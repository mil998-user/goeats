import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderStatus, Role } from "@prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { parseAmount } from "../../utils/validation";
import { AttemptLimiter, sendTooManyAttempts } from "../../utils/rateLimit";
import { getTakeCommissionDescription, hideDeliveryPin } from "../../utils/orderRules";
import {
  canPayTakeCommission,
  getInsufficientBalanceMessage,
  getMinimumBalanceAfterTake,
  isBalanceRule,
  readBalanceRule,
} from "./deliveryWallet";
import { calculateShippingCost, getShippingDistanceKm } from "../../utils/shipping";
import { readReason } from "./deliveryIncidents.controller";
import { getDriverAverages } from "../ratings/ratings.controller";
import { getDispatchView } from "./dispatch";

const MAX_PIN_ATTEMPTS = 5;
const pinAttempts = new AttemptLimiter(MAX_PIN_ATTEMPTS, 15 * 60 * 1000);

class InsufficientBalanceError extends Error {}


const round2 = (value: number) => Math.round(value * 100) / 100;

interface PayoutOrder {
  total: number;
  shippingCost: number | null;
  tipAmount?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  restaurant?: { deliveryCommissionPercentage?: number | null; mapLatitude?: number | null; mapLongitude?: number | null } | null;
}

// Plus only when the order was placed without a shipping charge; if the customer joined Plus later, the paid shipping is used
export function isPlusDelivery(order: { shippingCost: number | null; customer?: { isPlus?: boolean | null } | null }) {
  return order.customer?.isPlus === true && !((order.shippingCost || 0) > 0);
}

// One place for the money of a delivery: what the restaurant gets, what GoEats keeps and what the driver earns.
// On a Plus order the customer paid no shipping, so GoEats pays the driver the fare of the real distance.
export function getDeliveryPayout(
  order: PayoutOrder,
  rate: { basePrice: number; pricePerKm: number; plusDriverBonus: number },
  isPlusOrder: boolean
) {
  const commissionPct = order.restaurant?.deliveryCommissionPercentage ?? 10.0;
  const foodSubtotal = Math.max(0, order.total - (order.shippingCost || 0));
  const appCommission = round2((foodSubtotal * commissionPct) / 100);
  const providerPay = round2(foodSubtotal - appCommission);
  const fare = isPlusOrder
    ? calculateShippingCost(
        rate,
        getShippingDistanceKm(order.restaurant?.mapLatitude, order.restaurant?.mapLongitude, order.deliveryLat, order.deliveryLng)
      )
    : order.shippingCost || 0;
  const bonus = isPlusOrder ? rate.plusDriverBonus || 0 : rate.plusDriverBonus || 0.10;
  const tip = round2(order.tipAmount || 0);
  return { commissionPct, foodSubtotal, appCommission, providerPay, fare, bonus, tip, driverEarnings: round2(fare + bonus) };
}

// Get active config or default fallback values
export async function getActiveDeliveryRate() {
  let rate = await prisma.deliveryRate.findFirst({
    where: { isActive: true },
  });

  if (!rate) {
    // Seed one dynamically if none exists
    rate = await prisma.deliveryRate.create({
      data: {
        name: "Tarifa Estándar GoEats",
        basePrice: 1.0,
        pricePerKm: 0.5,
        costPerOrder: 0.5,
        plusDriverBonus: 0.50,
        isActive: true,
      },
    });
  }
  return rate;
}

// 1. List ready orders available for any delivery driver
export async function getAvailableOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const driver = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { lastLat: true, lastLng: true, lastLocationAt: true },
    });
    const orders = await prisma.order.findMany({
      where: {
        type: "DELIVERY",
        status: OrderStatus.READY,
        deliveryDriverId: null,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            mapLatitude: true,
            mapLongitude: true,
            deliveryCommissionPercentage: true,
          },
        },
        customer: { select: { isPlus: true } },
        items: {
          include: {
            variant: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "asc" },
    });

    const rate = await getActiveDeliveryRate();

    // Map orders with Zaymi financial breakdown
    // Nearby drivers see a ready order first; after the wait, all of them. Closest first
    const now = new Date();
    const visibleOrders = orders
      .map((order) => ({ order, dispatch: getDispatchView(order, driver ?? { lastLat: null, lastLng: null, lastLocationAt: null }, rate, now) }))
      .filter(({ dispatch }) => dispatch.visible)
      .sort((a, b) => (a.dispatch.distanceKm ?? Infinity) - (b.dispatch.distanceKm ?? Infinity));

    const enrichedOrders = visibleOrders.map(({ order, dispatch }) => {
      const payout = getDeliveryPayout(order, rate, isPlusDelivery(order));

      const { deliveryPin, customer, ...safeOrder } = order as any;

      return {
        ...safeOrder,
        requiresPin: !!deliveryPin,
        dispatch: {
          distanceKm: dispatch.distanceKm,
          nearby: dispatch.nearby,
          openToAll: dispatch.openToAll,
          openToAllAt: dispatch.openToAllAt,
        },
        financialBreakdown: {
          foodSubtotal: payout.foodSubtotal,
          commissionPct: payout.commissionPct,
          appCommissionFromProvider: payout.appCommission,
          providerPayAmount: payout.providerPay,
          driverBonus: payout.bonus,
          driverEarnings: payout.driverEarnings,
          tip: payout.tip,
          customerTotal: order.total,
        },
      };
    });

    return res.status(200).json({
      success: true,
      orders: enrichedOrders,
      rate,
      hasRecentLocation: !!driver?.lastLocationAt && now.getTime() - driver.lastLocationAt.getTime() <= 10 * 60 * 1000,
    });
  } catch (error) {
    next(error);
  }
}

// 2. Take/Accept an order
export async function takeOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user?.userId;

    if (isNaN(orderId) || !userId) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    // Load driver
    const driver = await prisma.user.findUnique({ where: { id: userId } });
    if (!driver || driver.role !== Role.MOTORIZADO) {
      return res.status(403).json({ success: false, message: "Only delivery drivers can accept orders" });
    }

    // Verify order is still available
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        type: "DELIVERY",
        status: OrderStatus.READY,
        deliveryDriverId: null,
      },
      include: {
        customer: true,
        restaurant: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "El pedido ya no está disponible o ya fue tomado" });
    }

    const isPlusOrder = isPlusDelivery(order);
    const isCashOrder = (order.paymentMethodString || "CASH") === "CASH";

    // Antifraude: Si el balance de deuda acumulado excede el límite (default $50.00), no permitir pedidos en efectivo
    const maxDebtAllowed = driver.maxDebtLimit ?? 50.0;
    if (isCashOrder && driver.walletBalance <= -maxDebtAllowed) {
      return res.status(400).json({
        success: false,
        message: `Has alcanzado tu límite máximo de deuda permitido (-$${maxDebtAllowed.toFixed(2)}). Por favor recarga o realiza un abono a GoEats para volver a tomar pedidos en efectivo.`,
      });
    }

    // Load active delivery rate configuration
    const rate = await getActiveDeliveryRate();

    // The same rule as the list: during the wait, only drivers inside the radius can take it
    if (!getDispatchView(order, driver, rate).visible) {
      return res.status(403).json({
        success: false,
        message: `Este pedido es primero para los motorizados a ${rate.dispatchRadiusKm} km del local. Se abre para todos en unos minutos.`,
      });
    }

    const balanceRule = readBalanceRule(rate.balanceRule);
    const insufficientBalanceMessage = getInsufficientBalanceMessage(balanceRule, rate.costPerOrder, maxDebtAllowed);
    // Lowest balance allowed before the charge, so the check below and the charge use the same limit
    const minimumBeforeCharge = rate.costPerOrder + getMinimumBalanceAfterTake(balanceRule, maxDebtAllowed);

    // Check wallet balance ONLY if not GoEats Plus order
    if (!isPlusOrder && !canPayTakeCommission(driver.walletBalance, rate.costPerOrder, balanceRule, maxDebtAllowed)) {
      return res.status(400).json({
        success: false,
        message: insufficientBalanceMessage,
      });
    }

    // Calculate Zaymi breakdown
    const { appCommission, providerPay, driverEarnings } = getDeliveryPayout(order, rate, isPlusOrder);

    // Execute wallet deduction and order assignment in transaction
    // Both writes only apply if the order is still free and the balance still covers it
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Lock the driver first: assigning the order reads the driver row for the foreign key,
      // and two takes at once by the same driver ended in a database deadlock (error 500)
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`;

      const claimed = await tx.order.updateMany({
        where: { id: orderId, type: "DELIVERY", status: OrderStatus.READY, deliveryDriverId: null },
        data: {
          status: OrderStatus.DELIVERING,
          deliveryDriverId: userId,
          providerPayAmount: providerPay,
          driverEarnings: driverEarnings,
          appCommissionFromProvider: appCommission,
        },
      });
      if (claimed.count === 0) return null;

      if (!isPlusOrder) {
        // Deduct take commission from wallet
        const charged = await tx.user.updateMany({
          where: { id: userId, walletBalance: { gte: minimumBeforeCharge - 0.000001 } },
          data: {
            walletBalance: {
              decrement: rate.costPerOrder,
            },
          },
        });
        if (charged.count === 0) throw new InsufficientBalanceError();

        // Log transaction
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: -rate.costPerOrder,
            type: "COMMISSION_DEDUCTION",
            description: getTakeCommissionDescription(orderId),
          },
        });
      }

      return tx.order.findUnique({ where: { id: orderId } });
    }).catch((error) => {
      if (error instanceof InsufficientBalanceError) return undefined;
      throw error;
    });

    if (updatedOrder === undefined) {
      return res.status(400).json({ success: false, message: insufficientBalanceMessage });
    }
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "El pedido ya no está disponible o ya fue tomado" });
    }

    // Notify POS real-time clients that order has been taken
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${order.restaurantId}`).to(`order-${order.id}`).emit("order-status-updated", {
        orderId: order.id,
        status: OrderStatus.DELIVERING,
        driverName: driver.name,
      });
    }

    // Disparar correos a Repartidor y Cliente (Sección 2 y 3 del Plan)
    (async () => {
      try {
        // Notificar al cliente: Repartidor asignado y en camino con su PIN de seguridad
        if (order.customer?.email) {
          NotificationService.notifyDriverAssigned(
            { id: order.id, deliveryPin: order.deliveryPin, restaurant: { name: order.restaurant.name } },
            { id: order.customer.id, name: order.customer.name, email: order.customer.email },
            driver.name
          ).catch((e) => console.warn("[Email] Error customer driver assigned:", e));
        }

        // Notificar al motorizado con detalles del pedido
        if (driver.email) {
          NotificationService.notifyDriverNewOrder(
            { id: driver.id, name: driver.name, email: driver.email },
            { id: order.id, total: order.total, deliveryAddress: order.deliveryAddress, driverEarnings },
            { name: order.restaurant.name, address: order.restaurant.address }
          ).catch((e) => console.warn("[Email] Error driver new order:", e));
        }
      } catch (err) {
        console.warn("[Email] Error dispatching delivery accept notifications:", err);
      }
    })();

    return res.status(200).json({ success: true, message: "Pedido tomado con éxito", order: hideDeliveryPin(updatedOrder) });
  } catch (error) {
    next(error);
  }
}

// 3. Mark delivery as complete
export async function completeDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user?.userId;

    if (isNaN(orderId) || !userId) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const { pin } = req.body;
    // The customer came out but can't give the code. Allowed with a written reason that the administrator reviews
    const withoutPin = req.body?.withoutPin === true;
    const noCodeReason = withoutPin ? readReason(req.body?.reason) : null;
    if (withoutPin && !noCodeReason) {
      return res.status(400).json({ success: false, message: "Escribe por qué entregas sin código, con al menos 10 letras." });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, deliveryDriverId: userId, status: OrderStatus.DELIVERING },
      include: {
        customer: true,
        restaurant: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido activo no encontrado" });
    }

    // Validación de PIN de entrega estilo PedidosYa / Uber Eats
    if (order.deliveryPin && !withoutPin) {
      const pinKey = String(orderId);
      const retryAfter = pinAttempts.retryAfter(pinKey);
      if (retryAfter > 0) {
        return sendTooManyAttempts(res, retryAfter, "Demasiados intentos con el PIN. Espera unos minutos y confirma el código con el cliente.");
      }

      if (!pin || pin.toString().trim() !== order.deliveryPin.trim()) {
        pinAttempts.hit(pinKey);
        return res.status(400).json({
          success: false,
          message: "PIN de entrega incorrecto. Solicita al cliente su código de 4 dígitos para confirmar la entrega.",
        });
      }

      pinAttempts.reset(pinKey);
    }

    const isPlusOrder = isPlusDelivery(order);
    const rate = await getActiveDeliveryRate();

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Complete order. A repeated request finds nothing to update and pays nothing
      const claimed = await tx.order.updateMany({
        where: { id: orderId, deliveryDriverId: userId, status: OrderStatus.DELIVERING },
        data: { status: OrderStatus.DELIVERED, paymentStatus: "APPROVED", pickedUpAt: order.pickedUpAt ?? new Date() },
      });
      if (claimed.count === 0) return null;

      if (withoutPin && noCodeReason) {
        await tx.deliveryIncident.create({
          data: { orderId, driverId: userId, type: "NO_CODE", reason: noCodeReason },
        });
      }

      // Money of this delivery. The amounts fixed when the driver took the order are kept
      const payout = getDeliveryPayout(order, rate, isPlusOrder);
      const providerPay = order.providerPayAmount ?? payout.providerPay;
      const driverEarnings = order.driverEarnings ?? payout.driverEarnings;
      const tip = payout.tip;
      const paymentMethod = order.paymentMethodString || "CASH";
      const credit = async (amount: number, type: string, description: string) => {
        if (Math.abs(amount) < 0.005) return;
        await tx.user.update({ where: { id: userId }, data: { walletBalance: { increment: amount } } });
        await tx.walletTransaction.create({ data: { userId, amount, type, description } });
      };

      if (paymentMethod === "CASH") {
        // ==========================================
        // CASO EFECTIVO (MODELO ZAYMI):
        // - Motorizado pagó en local: providerPay
        // - Motorizado cobró al cliente: order.total + propina; la propina es suya y queda en su bolsillo
        // - Lo que retuvo de más pertenece a GoEats: (order.total - providerPay) - driverEarnings
        // - En Plus el cliente no pagó envío: GoEats le debe la tarifa y el bono, menos la comisión que retuvo
        // ==========================================
        const cashInHand = order.total - providerPay;
        const netDebtOwedToApp = round2(cashInHand - driverEarnings);
        if (netDebtOwedToApp > 0) {
          await credit(
            -netDebtOwedToApp,
            "CASH_COLLECTED_DEDUCTION",
            `Comisión retenida de Pedido #${orderId} (Cobró $${order.total.toFixed(2)} efectivo, pagó $${providerPay.toFixed(2)} en local, ganancia $${driverEarnings.toFixed(2)})`
          );
        } else if (netDebtOwedToApp < 0) {
          await credit(
            Math.abs(netDebtOwedToApp),
            isPlusOrder ? "PLUS_BONUS" : "DELIVERY_EARNINGS",
            isPlusOrder
              ? `Tarifa y bono GoEats Plus por Pedido #${orderId} (ganancia $${driverEarnings.toFixed(2)} menos la comisión retenida en efectivo)`
              : `Bono neto a favor por Pedido #${orderId}`
          );
        }
      } else {
        // ==========================================
        // CASO EN LÍNEA (TARJETA / TRANSFERENCIA):
        // - El cliente ya pagó, el motorizado no cobra nada
        // - Se le devuelve lo que pagó en el local, más su ganancia y la propina
        // ==========================================
        const totalCredit = round2(providerPay + driverEarnings + tip);
        await credit(
          totalCredit,
          isPlusOrder ? "PLUS_BONUS" : "DELIVERY_EARNINGS",
          `Reembolso de compra ($${providerPay.toFixed(2)}) + Ganancia flete ($${driverEarnings.toFixed(2)})${tip > 0 ? ` + Propina ($${tip.toFixed(2)})` : ""} de Pedido #${orderId} (Pago en Línea${isPlusOrder ? ", GoEats Plus" : ""})`
        );
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Pedido activo no encontrado" });
    }

    // Notify POS
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${order.restaurantId}`).to(`order-${order.id}`).emit("order-status-updated", {
        orderId: order.id,
        status: OrderStatus.DELIVERED,
      });
    }

    // Notificar al cliente: Pedido entregado (Sección 2 del Plan)
    if (order.customer?.email) {
      NotificationService.notifyOrderDelivered(
        { id: order.id, restaurant: { name: order.restaurant.name } },
        { id: order.customer.id, name: order.customer.name, email: order.customer.email }
      ).catch((e) => console.warn("[Email] Error customer order delivered:", e));
    }

    return res.status(200).json({ success: true, message: "Pedido entregado correctamente", order: hideDeliveryPin(updatedOrder) });
  } catch (error) {
    next(error);
  }
}

// 4. Add delivery observation
export async function addObservation(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.user?.userId;
    const { observation } = req.body;

    if (isNaN(orderId) || !userId || !observation) {
      return res.status(400).json({ success: false, message: "Observation and valid ID are required" });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, deliveryDriverId: userId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { deliveryObservation: observation },
    });

    return res.status(200).json({ success: true, message: "Observación registrada con éxito", order: hideDeliveryPin(updatedOrder) });
  } catch (error) {
    next(error);
  }
}

// 5. Get active orders for current driver
export async function getDriverActiveOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await prisma.order.findMany({
      where: {
        deliveryDriverId: userId,
        status: OrderStatus.DELIVERING,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            mapLatitude: true,
            mapLongitude: true,
            deliveryCommissionPercentage: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rate = await getActiveDeliveryRate();

    const enrichedOrders = orders.map((order) => {
      const payout = getDeliveryPayout(order, rate, false);
      const { commissionPct, foodSubtotal, bonus } = payout;
      const appCommission = order.appCommissionFromProvider ?? payout.appCommission;
      const providerPay = order.providerPayAmount ?? payout.providerPay;
      const driverEarnings = order.driverEarnings ?? payout.driverEarnings;

      const { deliveryPin, ...safeOrder } = order as any;

      return {
        ...safeOrder,
        requiresPin: !!deliveryPin,
        financialBreakdown: {
          foodSubtotal,
          commissionPct,
          appCommissionFromProvider: appCommission,
          providerPayAmount: providerPay,
          driverBonus: bonus,
          driverEarnings,
          tip: payout.tip,
          customerTotal: order.total,
        },
      };
    });

    return res.status(200).json({ success: true, orders: enrichedOrders });
  } catch (error) {
    next(error);
  }
}

// 6. Get driver's wallet history
export async function getDriverWalletHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const driver = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, maxDebtLimit: true },
    });

    const balance = driver?.walletBalance || 0;
    const maxDebt = driver?.maxDebtLimit ?? 50.0;
    const isDebtLocked = balance <= -maxDebt;
    const rate = await getActiveDeliveryRate();
    const balanceRule = readBalanceRule(rate.balanceRule);
    const canTakeOrders = canPayTakeCommission(balance, rate.costPerOrder, balanceRule, maxDebt);

    return res.status(200).json({
      success: true,
      walletBalance: balance,
      maxDebtLimit: maxDebt,
      isDebtLocked,
      balanceRule,
      costPerOrder: rate.costPerOrder,
      canTakeOrders,
      blockedMessage: canTakeOrders ? null : getInsufficientBalanceMessage(balanceRule, rate.costPerOrder, maxDebt),
      transactions,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// SUPER_ADMIN WALLET & CONFIG MANAGEMENT
// ==========================================

// 7. Recharge wallet for driver (SuperAdmin only)
export async function rechargeDriverWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const { driverId, amount, description } = req.body;

    const parsedAmount = parseAmount(amount);
    if (!driverId || parsedAmount === null) {
      return res.status(400).json({ success: false, message: "driverId and positive amount are required" });
    }

    const targetDriver = await prisma.user.findUnique({
      where: { id: parseInt(driverId, 10) },
    });

    if (!targetDriver || targetDriver.role !== Role.MOTORIZADO) {
      return res.status(404).json({ success: false, message: "Conductor no encontrado" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: targetDriver.id },
        data: {
          walletBalance: {
            increment: parsedAmount,
          },
        },
      });

      const txLog = await tx.walletTransaction.create({
        data: {
          userId: targetDriver.id,
          amount: parsedAmount,
          type: "RECHARGE",
          description: description || `Recarga de saldo por Administrador`,
        },
      });

      return { updatedUser, txLog };
    });

    return res.status(200).json({
      success: true,
      message: `Billetera recargada exitosamente con $${parsedAmount.toFixed(2)}`,
      walletBalance: result.updatedUser.walletBalance,
    });
  } catch (error) {
    next(error);
  }
}

// 8. List all drivers in the system
export async function getDriversList(req: Request, res: Response, next: NextFunction) {
  try {
    const drivers = await prisma.user.findMany({
      where: { role: Role.MOTORIZADO },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        cedula: true,
        vehicleType: true,
        vehiclePlate: true,
        walletBalance: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const ratings = await getDriverAverages(drivers.map((driver) => driver.id));

    return res.status(200).json({
      success: true,
      drivers: drivers.map((driver) => ({
        ...driver,
        ratingAverage: ratings.get(driver.id)?.average ?? null,
        ratingCount: ratings.get(driver.id)?.count ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// 8.1 Toggle Driver Approval / Active Status
export async function toggleDriverActive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    const driver = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!driver || driver.role !== Role.MOTORIZADO) {
      return res.status(404).json({ success: false, message: "Motorizado no encontrado" });
    }

    const newActiveState = isActive !== undefined ? !!isActive : !driver.isActive;

    const updated = await prisma.user.update({
      where: { id: driver.id },
      data: { isActive: newActiveState },
    });

    // Enviar correo de notificación
    if (driver.email) {
      if (newActiveState) {
        NotificationService.notifyDriverApproved({ id: driver.id, name: driver.name, email: driver.email })
          .catch((e) => console.warn("[Email] Error approved driver:", e));
      } else if (reason) {
        NotificationService.notifyDriverRejected({ id: driver.id, name: driver.name, email: driver.email }, reason)
          .catch((e) => console.warn("[Email] Error rejected driver:", e));
      }
    }

    return res.status(200).json({
      success: true,
      message: newActiveState ? "Motorizado aprobado y activado exitosamente" : "Motorizado suspendido o desactivado",
      driver: updated,
    });
  } catch (error) {
    next(error);
  }
}

// 9. Get active delivery rate configs
export async function getDeliveryRates(req: Request, res: Response, next: NextFunction) {
  try {
    const rates = await prisma.deliveryRate.findMany({
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ success: true, rates });
  } catch (error) {
    next(error);
  }
}

// 10. Update/Save delivery rates configuration
export async function saveDeliveryRate(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, name, basePrice, pricePerKm, costPerOrder, plusDriverBonus, isActive, balanceRule, dispatchRadiusKm, dispatchWaitMin } = req.body;

    // Radius and wait of the nearest-driver offer, while the bosses confirm the final values
    const dispatch: { dispatchRadiusKm?: number; dispatchWaitMin?: number } = {};
    if (dispatchRadiusKm !== undefined) {
      const radius = Number(dispatchRadiusKm);
      if (!Number.isFinite(radius) || radius < 0.5 || radius > 50) {
        return res.status(400).json({ success: false, message: "El radio debe estar entre 0,5 y 50 km" });
      }
      dispatch.dispatchRadiusKm = Math.round(radius * 10) / 10;
    }
    if (dispatchWaitMin !== undefined) {
      const wait = Number(dispatchWaitMin);
      if (!Number.isInteger(wait) || wait < 0 || wait > 30) {
        return res.status(400).json({ success: false, message: "El tiempo de espera debe ser de 0 a 30 minutos" });
      }
      dispatch.dispatchWaitMin = wait;
    }

    if (balanceRule !== undefined && !isBalanceRule(balanceRule)) {
      return res.status(400).json({ success: false, message: "La regla de saldo debe ser PREPAID o DEBT_LIMIT" });
    }

    if (!name || basePrice === undefined || pricePerKm === undefined || costPerOrder === undefined) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const parsedBasePrice = parseAmount(basePrice, { allowZero: true });
    const parsedPricePerKm = parseAmount(pricePerKm, { allowZero: true });
    const parsedCostPerOrder = parseAmount(costPerOrder, { allowZero: true });
    const bonusVal = plusDriverBonus !== undefined ? parseAmount(plusDriverBonus, { allowZero: true }) : 0.50;

    if (parsedBasePrice === null || parsedPricePerKm === null || parsedCostPerOrder === null || bonusVal === null) {
      return res.status(400).json({ success: false, message: "Rate values must be valid amounts" });
    }

    let rate;
    if (id) {
      // Update
      rate = await prisma.deliveryRate.update({
        where: { id: parseInt(id, 10) },
        data: {
          name,
          basePrice: parsedBasePrice,
          pricePerKm: parsedPricePerKm,
          costPerOrder: parsedCostPerOrder,
          plusDriverBonus: bonusVal,
          ...(balanceRule !== undefined ? { balanceRule } : {}),
          ...dispatch,
          isActive: isActive !== undefined ? !!isActive : true,
        },
      });
    } else {
      // Create
      rate = await prisma.deliveryRate.create({
        data: {
          name,
          basePrice: parsedBasePrice,
          pricePerKm: parsedPricePerKm,
          costPerOrder: parsedCostPerOrder,
          plusDriverBonus: bonusVal,
          ...(balanceRule !== undefined ? { balanceRule } : {}),
          ...dispatch,
          isActive: isActive !== undefined ? !!isActive : true,
        },
      });
    }

    // If active, deactivate others
    if (rate.isActive) {
      await prisma.deliveryRate.updateMany({
        where: { id: { not: rate.id } },
        data: { isActive: false },
      });
    }

    return res.status(200).json({ success: true, message: "Tarifa guardada con éxito", rate });
  } catch (error) {
    next(error);
  }
}

// 11. Get currently active delivery rate
export async function getActiveRate(req: Request, res: Response, next: NextFunction) {
  try {
    const rate = await getActiveDeliveryRate();
    return res.status(200).json({ success: true, rate });
  } catch (error) {
    next(error);
  }
}

// 12. Settle driver balance (1-Click payment to driver)
export async function settleDriverBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const { driverId, note } = req.body;

    if (!driverId) {
      return res.status(400).json({ success: false, message: "driverId is required" });
    }

    const targetDriver = await prisma.user.findUnique({
      where: { id: parseInt(driverId, 10) },
    });

    if (!targetDriver || targetDriver.role !== Role.MOTORIZADO) {
      return res.status(404).json({ success: false, message: "Conductor no encontrado" });
    }

    if (targetDriver.walletBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "El conductor no tiene saldo a favor pendiente de liquidar.",
      });
    }

    const amountToSettle = targetDriver.walletBalance;

    const result = await prisma.$transaction(async (tx) => {
      // Reset positive balance to 0
      const updatedUser = await tx.user.update({
        where: { id: targetDriver.id },
        data: {
          walletBalance: 0.0,
        },
      });

      const txLog = await tx.walletTransaction.create({
        data: {
          userId: targetDriver.id,
          amount: -amountToSettle,
          type: "SETTLEMENT_PAYMENT",
          description: note || `Liquidación de corte (Transferencia bancaria al repartidor: $${amountToSettle.toFixed(2)})`,
        },
      });

      return { updatedUser, txLog };
    });

    return res.status(200).json({
      success: true,
      message: `Liquidación completada. Se pagaron $${amountToSettle.toFixed(2)} al conductor.`,
      settledAmount: amountToSettle,
      walletBalance: result.updatedUser.walletBalance,
    });
  } catch (error) {
    next(error);
  }
}

// 12. Update live GPS coordinates of the delivery driver
export async function updateDriverLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const { orderId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Driver ID and coordinates are required" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ success: false, message: "Invalid latitude or longitude coordinates" });
    }

    // The last position decides which ready orders are nearby
    await prisma.user.update({
      where: { id: userId },
      data: { lastLat: lat, lastLng: lng, lastLocationAt: new Date() },
    });

    let updatedOrder = null;
    let targetOrderId = orderId ? parseInt(orderId, 10) : null;

    // If orderId is not passed or not found, locate current active DELIVERING order for this driver
    if ((!targetOrderId || isNaN(targetOrderId)) && userId) {
      const activeOrder = await prisma.order.findFirst({
        where: {
          deliveryDriverId: userId,
          status: "DELIVERING",
        },
        orderBy: { updatedAt: "desc" },
      });
      if (activeOrder) {
        targetOrderId = activeOrder.id;
      }
    }

    if (targetOrderId && !isNaN(targetOrderId)) {
      const assignedOrder = await prisma.order.findFirst({
        where: { id: targetOrderId, deliveryDriverId: userId },
      });
      if (!assignedOrder) {
        return res.status(403).json({ success: false, message: "This order is not assigned to you" });
      }

      updatedOrder = await prisma.order.update({
        where: { id: targetOrderId },
        data: {
          driverLat: lat,
          driverLng: lng,
        },
      });

      const io = req.app.get("io");
      if (io) {
        const payload = {
          orderId: targetOrderId,
          driverId: userId,
          driverLat: lat,
          driverLng: lng,
          timestamp: new Date().toISOString(),
        };

        // Only people linked to this order receive the location
        io.to(`order-${targetOrderId}`).emit(`order-${targetOrderId}-location`, payload);
        io.to(`order-${targetOrderId}`).emit("driver-location-updated", payload);
      }
    }

    return res.status(200).json({
      success: true,
      driverLat: lat,
      driverLng: lng,
      orderId: targetOrderId,
      order: updatedOrder && hideDeliveryPin(updatedOrder),
    });
  } catch (error) {
    next(error);
  }
}
