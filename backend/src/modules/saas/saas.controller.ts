import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { safeDeleteUser } from "../auth/user-cleanup.service";
import { getReceiptError, parseAmount, simulatedPaymentsAllowed } from "../../utils/validation";
import { notifySaasOrder, notifyWallet } from "../../config/realtime";

const PURCHASE_ROLE_BY_TYPE: Record<string, string> = {
  RECHARGE: "MOTORIZADO",
  PLUS_SUBSCRIPTION: "CUSTOMER",
};

// 1. Submit purchase request for recharge or subscription (Driver or Customer)
export async function submitSaaSOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const { type, planName, paymentMethod, paymentReceipt, payphoneTransactionId } = req.body;

    if (typeof type !== "string" || typeof planName !== "string" || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Faltan campos requeridos" });
    }

    if (PURCHASE_ROLE_BY_TYPE[type] !== req.user?.role) {
      return res.status(403).json({ success: false, message: "Este plan no corresponde a tu cuenta" });
    }

    // The price always comes from the plan, never from the browser
    const plan = await prisma.saaSPlan.findFirst({ where: { name: planName, type } });
    if (!plan) {
      return res.status(400).json({ success: false, message: "El plan seleccionado no existe" });
    }
    const amount = plan.amount;

    // If Card (Payphone) -> Approve immediately
    if (paymentMethod === "CARD") {
      if (!simulatedPaymentsAllowed()) {
        return res.status(400).json({ success: false, message: "El pago con tarjeta aún no está disponible." });
      }

      if (!payphoneTransactionId) {
        return res.status(400).json({ success: false, message: "ID de transacción de tarjeta requerido" });
      }

      // Execute transaction to save order and grant benefit
      const order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.saaSOrder.create({
          data: {
            userId,
            type,
            planName,
            amount,
            paymentMethod,
            payphoneTransactionId,
            status: "APPROVED"
          }
        });

        if (type === "RECHARGE") {
          // Add balance to driver
          await tx.user.update({
            where: { id: userId },
            data: {
              walletBalance: { increment: amount }
            }
          });

          // Create transaction log
          await tx.walletTransaction.create({
            data: {
              userId,
              amount,
              type: "RECHARGE",
              description: `Recarga aprobada al instante - ${planName} (Tarjeta)`
            }
          });
        } else if (type === "PLUS_SUBSCRIPTION") {
          // Set customer as GoEats Plus
          await tx.user.update({
            where: { id: userId },
            data: { isPlus: true }
          });
        }

        return createdOrder;
      });

      return res.status(201).json({ success: true, message: "Compra aprobada al instante.", order });
    }

    // If Transfer -> Keep PENDING, await SuperAdmin approval
    if (paymentMethod === "TRANSFER") {
      const receiptError = getReceiptError(paymentReceipt);
      if (receiptError) {
        return res.status(400).json({ success: false, message: receiptError });
      }
      // One request at a time: the same receipt can't be sent twice while it waits
      const waiting = await prisma.saaSOrder.count({ where: { userId, type, status: "PENDING" } });
      if (waiting > 0) {
        return res.status(409).json({ success: false, message: "Ya tienes una solicitud esperando revisión. Espera la respuesta o cancélala en \"Mis solicitudes\" para enviar otra." });
      }

      const order = await prisma.saaSOrder.create({
        data: {
          userId,
          type,
          planName,
          amount,
          paymentMethod,
          paymentReceipt,
          status: "PENDING"
        }
      });

      notifySaasOrder(req.app.get("io"), userId);
      return res.status(201).json({ success: true, message: "Solicitud registrada. Pendiente de aprobación por SuperAdmin.", order });
    }

    return res.status(400).json({ success: false, message: "Método de pago no válido" });
  } catch (error) {
    next(error);
  }
}

// The user withdraws a request still waiting (wrong receipt, or wants another amount)
export async function cancelMySaaSOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const id = Number(req.params.id);
    if (!userId || !Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "Solicitud no válida" });
    }
    const updated = await prisma.saaSOrder.updateMany({
      where: { id, userId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (updated.count === 0) {
      return res.status(409).json({ success: false, message: "Esta solicitud ya fue revisada o no es tuya." });
    }
    notifySaasOrder(req.app.get("io"), userId);
    return res.status(200).json({ success: true, message: "Solicitud cancelada. Ya puedes enviar otra." });
  } catch (error) {
    next(error);
  }
}

// 2. Get SaaS orders list (SuperAdmin)
export async function getSaaSOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await prisma.saaSOrder.findMany({
      orderBy: { createdAt: "desc" },
      // The receipt is a big image: it only travels for the requests still to review
      omit: { paymentReceipt: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            cedula: true
          }
        }
      }
    });

    const pending = await prisma.saaSOrder.findMany({
      where: { status: "PENDING" },
      select: { id: true, paymentReceipt: true },
    });
    const receipts = new Map(pending.map((order) => [order.id, order.paymentReceipt]));

    // Pending first, each group from newest to oldest
    const warnings = new Map<number, string | null>();
    for (const order of orders) {
      if (order.status === "PENDING") warnings.set(order.id, await getApprovalWarning(order));
    }
    const list = orders
      .map((order) => ({ ...order, paymentReceipt: receipts.get(order.id) ?? null, warning: warnings.get(order.id) ?? null }))
      .sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));

    return res.status(200).json({ success: true, orders: list });
  } catch (error) {
    next(error);
  }
}

// 3. Approve SaaS order (SuperAdmin)
// Before giving money for a transfer: was it already given another way, or is the request very old?
// (26 nov: a $10 request left pending after a manual $10 recharge was approved two weeks later)
export const OLD_REQUEST_DAYS = 3;
export async function getApprovalWarning(order: { userId: number; type: string; amount: number; createdAt: Date }, now = new Date()) {
  if (order.type !== "RECHARGE") return null;
  const sameMoney = await prisma.walletTransaction.findFirst({
    where: { userId: order.userId, type: "RECHARGE", amount: order.amount, createdAt: { gte: order.createdAt } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, description: true },
  });
  if (sameMoney) {
    return `Después de esta solicitud ya se le acreditaron $${order.amount.toFixed(2)} el ${sameMoney.createdAt.toLocaleString("es-EC", { timeZone: "America/Guayaquil" })} (${sameMoney.description}). Si es el mismo pago, recházala para no darle el dinero dos veces.`;
  }
  const days = Math.floor((now.getTime() - order.createdAt.getTime()) / 86400000);
  if (days >= OLD_REQUEST_DAYS) {
    return `Esta solicitud tiene ${days} días. Revisa en el banco que el depósito sea real y que no se haya pagado antes.`;
  }
  return null;
}

export async function approveSaaSOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: "ID de pedido inválido" });
    }

    const order = await prisma.saaSOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "El pedido ya no está pendiente" });
    }

    // A possible double payment needs the administrator to confirm it on purpose
    const warning = await getApprovalWarning(order);
    if (warning && req.body?.confirmWarning !== true) {
      return res.status(409).json({ success: false, needsConfirm: true, message: warning });
    }

    // Start database transaction
    const approved = await prisma.$transaction(async (tx) => {
      // 1. Mark as APPROVED, only once even with simultaneous requests
      const marked = await tx.saaSOrder.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "APPROVED" }
      });
      if (marked.count === 0) return false;

      // 2. Grant benefit
      if (order.type === "RECHARGE") {
        // Increment wallet balance
        await tx.user.update({
          where: { id: order.userId },
          data: {
            walletBalance: { increment: order.amount }
          }
        });

        // Add wallet transaction log
        await tx.walletTransaction.create({
          data: {
            userId: order.userId,
            amount: order.amount,
            type: "RECHARGE",
            description: `Recarga aprobada por SuperAdmin - ${order.planName} (Transferencia)`
          }
        });
      } else if (order.type === "PLUS_SUBSCRIPTION") {
        // Activate Plus subscription
        await tx.user.update({
          where: { id: order.userId },
          data: { isPlus: true }
        });
      }

      return true;
    });

    if (!approved) {
      return res.status(400).json({ success: false, message: "El pedido ya no está pendiente" });
    }

    notifySaasOrder(req.app.get("io"), order.userId);
    notifyWallet(req.app.get("io"), order.userId);
    return res.status(200).json({ success: true, message: "Pedido aprobado con éxito y beneficio otorgado." });
  } catch (error) {
    next(error);
  }
}

// 4. Reject SaaS order (SuperAdmin)
export async function rejectSaaSOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: "ID de pedido inválido" });
    }

    const order = await prisma.saaSOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "El pedido ya no está pendiente" });
    }

    // Only once, even if someone approves it at the same time
    const marked = await prisma.saaSOrder.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "REJECTED" } });
    if (marked.count === 0) {
      return res.status(400).json({ success: false, message: "El pedido ya no está pendiente" });
    }

    notifySaasOrder(req.app.get("io"), order.userId);
    return res.status(200).json({ success: true, message: "Pedido rechazado con éxito." });
  } catch (error) {
    next(error);
  }
}

// 5. Get registered customers list (SuperAdmin)
export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        cedula: true,
        isPlus: true,
        createdAt: true
      }
    });

    return res.status(200).json({ success: true, customers });
  } catch (error) {
    next(error);
  }
}

// 6. Toggle client plus membership status manually (SuperAdmin)
export async function toggleCustomerPlus(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: "ID de cliente inválido" });
    }

    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer || customer.role !== "CUSTOMER") {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    const updated = await prisma.user.update({
      where: { id: customerId },
      data: { isPlus: !customer.isPlus },
      select: { id: true, isPlus: true }
    });

    return res.status(200).json({ success: true, isPlus: updated.isPlus });
  } catch (error) {
    next(error);
  }
}

// 7. Get logged-in user's SaaS orders history
export async function getMySaaSOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }
    const orders = await prisma.saaSOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      // The receipt image stays on the server: the list only needs the state
      omit: { paymentReceipt: true },
    });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

// 8. Get SaaS plans list (with automatic seeding if empty)
export async function getSaaSPlans(req: Request, res: Response, next: NextFunction) {
  try {
    let plans = await prisma.saaSPlan.findMany({
      orderBy: { id: "asc" }
    });

    if (plans.length === 0) {
      // Seed default plans
      const defaultPlans = [
        {
          name: "Plan Plus Mensual",
          type: "PLUS_SUBSCRIPTION",
          amount: 4.99,
          period: "mes",
          discount: "Sin descuento",
          description: "Prueba el club con pagos mensuales flexibles y cancela cuando quieras."
        },
        {
          name: "Plan Plus Semestral",
          type: "PLUS_SUBSCRIPTION",
          amount: 24.99,
          period: "6 meses",
          discount: "Ahorra 15%",
          description: "Ahorra en envíos y obtén soporte VIP por un periodo extendido."
        },
        {
          name: "Plan Plus Anual",
          type: "PLUS_SUBSCRIPTION",
          amount: 39.99,
          period: "año",
          discount: "Ahorra 33%",
          description: "Nuestra mejor oferta. Envíos gratis todo el año al menor costo mensual."
        },
        {
          name: "Tarjeta Recarga Bronce",
          type: "RECHARGE",
          amount: 10.00,
          period: null,
          discount: null,
          description: "Permite tomar hasta 20 pedidos con la comisión básica descontada de la wallet."
        },
        {
          name: "Tarjeta Recarga Plata",
          type: "RECHARGE",
          amount: 20.00,
          period: null,
          discount: null,
          description: "La recarga más recomendada para jornadas semanales completas de entregas."
        },
        {
          name: "Tarjeta Recarga Oro",
          type: "RECHARGE",
          amount: 50.00,
          period: null,
          discount: null,
          description: "Recarga premium para motorizados de alto rendimiento. Máxima autonomía."
        }
      ];

      await prisma.saaSPlan.createMany({
        data: defaultPlans
      });

      plans = await prisma.saaSPlan.findMany({
        orderBy: { id: "asc" }
      });
    }

    return res.status(200).json({ success: true, plans });
  } catch (error) {
    next(error);
  }
}

// 9. Create SaaS plan (SuperAdmin)
export async function createSaaSPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, type, amount, period, discount, description } = req.body;
    if (!name || !type || amount === undefined || !description) {
      return res.status(400).json({ success: false, message: "Faltan campos requeridos" });
    }

    const parsedPlanAmount = parseAmount(amount);
    if (parsedPlanAmount === null || !PURCHASE_ROLE_BY_TYPE[type]) {
      return res.status(400).json({ success: false, message: "Monto o tipo de plan inválido" });
    }

    const plan = await prisma.saaSPlan.create({
      data: {
        name,
        type,
        amount: parsedPlanAmount,
        period: period || null,
        discount: discount || null,
        description
      }
    });

    return res.status(201).json({ success: true, plan });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "Ya existe un plan con ese nombre" });
    }
    next(error);
  }
}

// 10. Update SaaS plan (SuperAdmin)
export async function updateSaaSPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }

    const { name, type, amount, period, discount, description } = req.body;
    if (!name || !type || amount === undefined || !description) {
      return res.status(400).json({ success: false, message: "Faltan campos requeridos" });
    }

    const parsedPlanAmount = parseAmount(amount);
    if (parsedPlanAmount === null || !PURCHASE_ROLE_BY_TYPE[type]) {
      return res.status(400).json({ success: false, message: "Monto o tipo de plan inválido" });
    }

    const plan = await prisma.saaSPlan.update({
      where: { id },
      data: {
        name,
        type,
        amount: parsedPlanAmount,
        period: period || null,
        discount: discount || null,
        description
      }
    });

    return res.status(200).json({ success: true, plan });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "Ya existe un plan con ese nombre" });
    }
    next(error);
  }
}

// 11. Delete SaaS plan (SuperAdmin)
export async function deleteSaaSPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }

    await prisma.saaSPlan.delete({
      where: { id }
    });

    return res.status(200).json({ success: true, message: "Plan eliminado con éxito" });
  } catch (error) {
    next(error);
  }
}

// 12. Delete customer account (SuperAdmin)
export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({ success: false, message: "ID de cliente inválido" });
    }

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, username: true, role: true },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    if (customer.role !== "CUSTOMER") {
      return res.status(400).json({ success: false, message: "Solo se pueden eliminar cuentas con rol CLIENTE desde este apartado" });
    }

    const result = await safeDeleteUser(customerId);
    if (!result.success) {
      if (result.blocked) return res.status(409).json({ success: false, message: result.error });
      return res.status(500).json({ success: false, message: result.error || "Error al eliminar el cliente" });
    }

    return res.status(200).json({
      success: true,
      message: `Cliente ${customer.name} (@${customer.username}) eliminado exitosamente.`,
    });
  } catch (error) {
    next(error);
  }
}
