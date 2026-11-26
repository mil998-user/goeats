import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { parseAmount } from "../../utils/validation";
import { AttemptLimiter, sendTooManyAttempts } from "../../utils/rateLimit";
import { getTakeCommissionDescription, hideDeliveryPin } from "../../utils/orderRules";
import { canCoverOrder, getCashHoldback, getInsufficientBalanceMessage, refundTakeCommission } from "./deliveryWallet";
import { calculateShippingCost, getShippingDistanceKm } from "../../utils/shipping";
import { readReason } from "./deliveryIncidents.controller";
import { getDriverAverages } from "../ratings/ratings.controller";
import { freshReadyWhere, getDispatchView } from "./dispatch";
import { notifyDeliveryBoard, notifyWallet } from "../../config/realtime";
import { cancelOrderAndNotify, CANCEL_REASON_MESSAGE, readCancelReason } from "../orders/orderCancel";

const MAX_PIN_ATTEMPTS = 5;
const pinAttempts = new AttemptLimiter(MAX_PIN_ATTEMPTS, 15 * 60 * 1000);

class InsufficientBalanceError extends Error {
  constructor(public required: number, public balance: number) {
    super("insufficient balance");
  }
}

type Db = Prisma.TransactionClient | typeof prisma;

// GoEats share of the cash the driver will collect on cash orders still on the way.
// It is deducted on delivery, so the balance has to keep it covered
async function getPendingCashHoldback(db: Db, driverId: number) {
  const active = await db.order.findMany({
    where: {
      deliveryDriverId: driverId,
      status: OrderStatus.DELIVERING,
      OR: [{ paymentMethodString: "CASH" }, { paymentMethodString: null }],
    },
    select: { total: true, providerPayAmount: true, driverEarnings: true },
  });
  return round2(active.reduce((sum, o) => sum + getCashHoldback(o.total, o.providerPayAmount ?? 0, o.driverEarnings ?? 0), 0));
}


const round2 = (value: number) => Math.round(value * 100) / 100;

interface PayoutOrder {
  paymentMethodString?: string | null;
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
// Paid by card or transfer: the money went straight to the restaurant (engineers, 25 nov)
export function isPrepaidOrder(order: { paymentMethodString?: string | null }) {
  return !!order.paymentMethodString && order.paymentMethodString !== "CASH";
}

export function getDeliveryPayout(
  order: PayoutOrder,
  rate: { basePrice: number; pricePerKm: number; plusDriverBonus: number },
  isPlusOrder: boolean
) {
  const commissionPct = order.restaurant?.deliveryCommissionPercentage ?? 10.0;
  const foodSubtotal = Math.max(0, order.total - (order.shippingCost || 0));
  const appCommission = round2((foodSubtotal * commissionPct) / 100);
  // Already paid to the restaurant: the driver pays nothing there
  const prepaid = isPrepaidOrder(order);
  const providerPay = prepaid ? 0 : round2(foodSubtotal - appCommission);
  const fare = isPlusOrder
    ? calculateShippingCost(
        rate,
        getShippingDistanceKm(order.restaurant?.mapLatitude, order.restaurant?.mapLongitude, order.deliveryLat, order.deliveryLng)
      )
    : order.shippingCost || 0;
  const bonus = isPlusOrder ? rate.plusDriverBonus || 0 : rate.plusDriverBonus || 0.10;
  const tip = round2(order.tipAmount || 0);
  return { commissionPct, foodSubtotal, appCommission, providerPay, fare, bonus, tip, prepaid, driverEarnings: round2(fare + bonus) };
}

type SettleOrder = PayoutOrder & {
  id: number;
  providerPayAmount: number | null;
  driverEarnings: number | null;
  customer?: { isPlus?: boolean | null } | null;
};

// What a delivered order moves in the driver's wallet. One rule for delivery and for the later review
export function getSettlement(order: SettleOrder, rate: { basePrice: number; pricePerKm: number; plusDriverBonus: number }) {
  const isPlusOrder = isPlusDelivery({ shippingCost: order.shippingCost, customer: order.customer });
  const payout = getDeliveryPayout(order, rate, isPlusOrder);
  // The amounts fixed when the driver took the order are kept
  const providerPay = order.providerPayAmount ?? payout.providerPay;
  const driverEarnings = order.driverEarnings ?? payout.driverEarnings;
  const tip = payout.tip;

  if ((order.paymentMethodString || "CASH") === "CASH") {
    // He paid the restaurant and collected the total: what he kept beyond his earnings belongs to GoEats
    const debt = round2(order.total - providerPay - driverEarnings);
    if (debt > 0) {
      return {
        amount: -debt,
        type: "CASH_COLLECTED_DEDUCTION",
        description: `Comisión retenida de Pedido #${order.id} (Cobró $${order.total.toFixed(2)} efectivo, pagó $${providerPay.toFixed(2)} en local, ganancia $${driverEarnings.toFixed(2)})`,
      };
    }
    return {
      amount: Math.abs(debt),
      type: isPlusOrder ? "PLUS_BONUS" : "DELIVERY_EARNINGS",
      description: isPlusOrder
        ? `Tarifa y bono GoEats Plus por Pedido #${order.id} (ganancia $${driverEarnings.toFixed(2)} menos la comisión retenida en efectivo)`
        : `Bono neto a favor por Pedido #${order.id}`,
    };
  }
  // Paid online: what he paid at the restaurant (only in orders taken before 25 nov), his earnings and the tip
  return {
    amount: round2(providerPay + driverEarnings + tip),
    type: isPlusOrder ? "PLUS_BONUS" : "DELIVERY_EARNINGS",
    description: `${providerPay > 0 ? `Reembolso de compra ($${providerPay.toFixed(2)}) + ` : ""}Ganancia flete ($${driverEarnings.toFixed(2)})${tip > 0 ? ` + Propina ($${tip.toFixed(2)})` : ""} de Pedido #${order.id} (pagado al local)`,
  };
}

// Money held back from deliveries without the customer's code, until GoEats reviews them
export async function getHeldAmount(driverId: number) {
  const pending = await prisma.deliveryIncident.findMany({
    where: { driverId, type: "NO_CODE", reviewedAt: null },
    select: { order: { include: { customer: { select: { isPlus: true } }, restaurant: true } } },
  });
  if (pending.length === 0) return 0;
  const rate = await getActiveDeliveryRate();
  return round2(pending.reduce((sum, row) => sum + Math.max(0, getSettlement(row.order, rate).amount), 0));
}

// Orders a driver may carry at once: 2 without asking, up to 4 if he says he can (engineers, 25 nov)
export const DRIVER_FREE_LIMIT = 2;
export const DRIVER_MAX_ORDERS = 4;

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
        // Old ready orders are not offered: the watcher cancels them
        ...freshReadyWhere(),
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
          prepaid: payout.prepaid,
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

class DriverLimitError extends Error {
  constructor(message: string, public needsConfirm: boolean) {
    super(message);
  }
}

// 2. Take/Accept an order
export async function takeOrder(req: Request, res: Response, next: NextFunction) {
  const orderId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;
  if (isNaN(orderId) || !userId) {
    return res.status(400).json({ success: false, message: "Invalid parameters" });
  }
  return performTake(req, res, next, orderId, userId, { admin: false, acceptExtra: req.body?.acceptExtra === true });
}

// Administrator: gives a ready order to a driver (skips the nearby-first wait)
export async function assignOrderToDriver(req: Request, res: Response, next: NextFunction) {
  const orderId = parseInt(req.params.id, 10);
  const driverId = parseInt(req.body?.driverId, 10);
  if (isNaN(orderId) || isNaN(driverId)) {
    return res.status(400).json({ success: false, message: "Elige el pedido y el motorizado." });
  }
  return performTake(req, res, next, orderId, driverId, { admin: true, acceptExtra: true });
}

async function performTake(
  req: Request,
  res: Response,
  next: NextFunction,
  orderId: number,
  userId: number,
  options: { admin: boolean; acceptExtra: boolean }
) {
  try {
    // Load driver
    const driver = await prisma.user.findUnique({ where: { id: userId } });
    if (!driver || driver.role !== Role.MOTORIZADO || !driver.isActive) {
      return res.status(403).json({ success: false, message: options.admin ? "Ese motorizado no está activo." : "Only delivery drivers can accept orders" });
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

    // Load active delivery rate configuration
    const rate = await getActiveDeliveryRate();

    // The same rule as the list: during the wait, only drivers inside the radius can take it
    if (!options.admin && !getDispatchView(order, driver, rate).visible) {
      return res.status(403).json({
        success: false,
        message: `Este pedido es primero para los motorizados a ${rate.dispatchRadiusKm} km del local. Se abre para todos en menos de un minuto.`,
      });
    }

    // Calculate Zaymi breakdown
    const { appCommission, providerPay, driverEarnings } = getDeliveryPayout(order, rate, isPlusOrder);

    // The wallet never goes negative: the balance must cover the take commission (not on Plus),
    // the GoEats share of this order's cash, and that of the cash orders already on the way
    const takeCost = isPlusOrder ? 0 : rate.costPerOrder;
    const orderHoldback = isCashOrder ? getCashHoldback(order.total, providerPay, driverEarnings) : 0;

    // Execute wallet deduction and order assignment in transaction
    // Both writes only apply if the order is still free and the balance still covers it
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Lock the driver first: assigning the order reads the driver row for the foreign key,
      // and two takes at once by the same driver ended in a database deadlock (error 500)
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`;

      // How many he already carries, counted with the driver locked: two taps at once can't pass the limit
      const carrying = await tx.order.count({ where: { deliveryDriverId: userId, status: OrderStatus.DELIVERING } });
      if (carrying >= DRIVER_MAX_ORDERS) {
        throw new DriverLimitError(`${options.admin ? "Ese motorizado ya lleva" : "Ya llevas"} ${carrying} pedidos, el máximo. Entrega alguno antes de tomar otro.`, false);
      }
      if (carrying >= DRIVER_FREE_LIMIT && !options.acceptExtra) {
        throw new DriverLimitError(`Ya llevas ${carrying} pedidos. ¿Puedes llevar uno más a tiempo?`, true);
      }

      const current = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      const required = round2(takeCost + orderHoldback + (await getPendingCashHoldback(tx, userId)));
      if (!canCoverOrder(current?.walletBalance ?? 0, required)) throw new InsufficientBalanceError(required, current?.walletBalance ?? 0);

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
        // Deduct take commission from wallet. The driver row is locked, so the balance read above still holds
        await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: {
              decrement: rate.costPerOrder,
            },
          },
        });

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
      if (error instanceof InsufficientBalanceError || error instanceof DriverLimitError) return error;
      throw error;
    });

    if (updatedOrder instanceof DriverLimitError) {
      return res.status(409).json({ success: false, needsConfirm: updatedOrder.needsConfirm, message: updatedOrder.message });
    }
    if (updatedOrder instanceof InsufficientBalanceError) {
      return res.status(400).json({ success: false, message: getInsufficientBalanceMessage(updatedOrder.required, updatedOrder.balance) });
    }
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "El pedido ya no está disponible o ya fue tomado" });
    }

    // Notify POS real-time clients that order has been taken
    const io = req.app.get("io");
    if (io) {
      notifyDeliveryBoard(io);
      io.to(`restaurant-${order.restaurantId}`).to(`order-${order.id}`).emit("order-status-updated", {
        orderId: order.id,
        status: OrderStatus.DELIVERING,
        driverName: driver.name,
      });
    }
    notifyWallet(io, userId);
    // The driver sees at once the order the administrator gave him
    if (options.admin) io?.to(`user-${userId}`).emit("delivery-board-changed");

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

    return res.status(200).json({
      success: true,
      message: options.admin ? `Pedido asignado a ${driver.name}.` : "Pedido tomado con éxito",
      order: hideDeliveryPin(updatedOrder),
    });
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
    // You can't deliver what you never picked up
    if (!order.pickedUpAt) {
      return res.status(409).json({ success: false, message: "Primero presiona \"Empezar traslado\" cuando retires la comida del local." });
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

      // Money of this delivery. Without the code, what GoEats owes him waits for the review;
      // what he owes GoEats (cash) is taken at once
      const settlement = getSettlement(order, rate);
      const held = withoutPin && settlement.amount > 0;
      if (!held && Math.abs(settlement.amount) >= 0.005) {
        await tx.user.update({ where: { id: userId }, data: { walletBalance: { increment: settlement.amount } } });
        await tx.walletTransaction.create({ data: { userId, amount: settlement.amount, type: settlement.type, description: settlement.description } });
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Pedido activo no encontrado" });
    }

    // Notify POS
    const io = req.app.get("io");
    if (io) {
      notifyDeliveryBoard(io);
      io.to(`restaurant-${order.restaurantId}`).to(`order-${order.id}`).emit("order-status-updated", {
        orderId: order.id,
        status: OrderStatus.DELIVERED,
      });
    }
    notifyWallet(io, userId);

    // Notificar al cliente: Pedido entregado (Sección 2 del Plan)
    if (order.customer?.email) {
      NotificationService.notifyOrderDelivered(
        { id: order.id, restaurant: { name: order.restaurant.name } },
        { id: order.customer.id, name: order.customer.name, email: order.customer.email }
      ).catch((e) => console.warn("[Email] Error customer order delivered:", e));
    }

    return res.status(200).json({
      success: true,
      message: withoutPin ? "Entregado sin código. Tu pago queda en revisión de GoEats." : "Pedido entregado correctamente",
      order: hideDeliveryPin(updatedOrder),
    });
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
// Historial de entregas del motorizado: ultimas 50 terminadas o canceladas, sin datos privados del cliente
export async function getDriverDeliveryHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await prisma.order.findMany({
      where: {
        deliveryDriverId: userId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        total: true,
        shippingCost: true,
        tipAmount: true,
        paymentMethodString: true,
        updatedAt: true,
        restaurant: { select: { name: true } },
      },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

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
      const prepaid = payout.prepaid;
      const { commissionPct, foodSubtotal, bonus } = payout;
      const appCommission = order.appCommissionFromProvider ?? payout.appCommission;
      const providerPay = order.providerPayAmount ?? payout.providerPay;
      const driverEarnings = order.driverEarnings ?? payout.driverEarnings;

      const { deliveryPin, ...safeOrder } = order as any;

      return {
        ...safeOrder,
        requiresPin: !!deliveryPin,
        financialBreakdown: {
          prepaid,
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
      select: { walletBalance: true },
    });

    const balance = driver?.walletBalance || 0;
    const rate = await getActiveDeliveryRate();
    // Cash of orders on the way that belongs to GoEats: part of the balance is already spoken for
    const reserved = await getPendingCashHoldback(prisma, userId);
    const held = await getHeldAmount(userId);
    const required = round2(rate.costPerOrder + reserved);
    const canTakeOrders = canCoverOrder(balance, required);

    return res.status(200).json({
      success: true,
      walletBalance: balance,
      reservedBalance: reserved,
      heldAmount: held,
      costPerOrder: rate.costPerOrder,
      canTakeOrders,
      blockedMessage: canTakeOrders ? null : getInsufficientBalanceMessage(required, balance),
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

    notifyWallet(req.app.get("io"), targetDriver.id);

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

    // Nobody is paused with orders in his hands: first they are released or reassigned
    if (!newActiveState) {
      const carrying = await prisma.order.findMany({ where: { deliveryDriverId: driver.id, status: OrderStatus.DELIVERING }, select: { id: true } });
      if (carrying.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Lleva ${carrying.length === 1 ? "el pedido" : "los pedidos"} ${carrying.map((o) => `#${o.id}`).join(", ")}. Libéralos o reasígnalos en "En camino" antes de pausarlo.`,
        });
      }
    }

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
    const { id, name, basePrice, pricePerKm, costPerOrder, plusDriverBonus, isActive, dispatchRadiusKm } = req.body;

    // Radius of the nearest-driver offer. The wait is fixed at 1 minute (DISPATCH_WAIT_MIN)
    const dispatch: { dispatchRadiusKm?: number } = {};
    if (dispatchRadiusKm !== undefined) {
      const radius = Number(dispatchRadiusKm);
      if (!Number.isFinite(radius) || radius < 0.5 || radius > 50) {
        return res.status(400).json({ success: false, message: "El radio debe estar entre 0,5 y 50 km" });
      }
      dispatch.dispatchRadiusKm = Math.round(radius * 10) / 10;
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
          balanceRule: "PREPAID",
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
          balanceRule: "PREPAID",
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

    // Only what is free: the cash still on the way and the money under review stay
    const held = await getHeldAmount(targetDriver.id);
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${targetDriver.id} FOR UPDATE`;
      const fresh = await tx.user.findUniqueOrThrow({ where: { id: targetDriver.id }, select: { walletBalance: true } });
      const reserved = await getPendingCashHoldback(tx, targetDriver.id);
      const amountToSettle = round2(fresh.walletBalance - reserved);
      if (amountToSettle <= 0) return null;
      const updatedUser = await tx.user.update({ where: { id: targetDriver.id }, data: { walletBalance: { decrement: amountToSettle } } });
      await tx.walletTransaction.create({
        data: {
          userId: targetDriver.id,
          amount: -amountToSettle,
          type: "SETTLEMENT_PAYMENT",
          description: note || `Liquidación de corte (Transferencia bancaria al repartidor: $${amountToSettle.toFixed(2)})`,
        },
      });
      return { updatedUser, amountToSettle };
    });
    if (!result) {
      return res.status(400).json({ success: false, message: "El conductor no tiene saldo libre para liquidar." });
    }
    const amountToSettle = result.amountToSettle;
    void held;

    notifyWallet(req.app.get("io"), targetDriver.id);

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
      // A late position never touches a finished order: the customer stops being followed
      // and its delivery time (updatedAt) stays as it was
      if (assignedOrder.status === "DELIVERED" || assignedOrder.status === "CANCELLED") {
        return res.status(200).json({ success: true, driverLat: lat, driverLng: lng, orderId: targetOrderId, order: null });
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

// ==========================================
// ADMINISTRATOR: orders on the way, release, cancel, what restaurants owe
// ==========================================

// Orders on the way: who carries them, since when and the last location
export async function getInProgressDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const now = Date.now();
    const orders = await prisma.order.findMany({
      where: { type: "DELIVERY", status: OrderStatus.DELIVERING },
      orderBy: { updatedAt: "asc" },
      take: 100,
      select: {
        id: true,
        total: true,
        pickedUpAt: true,
        updatedAt: true,
        paymentMethodString: true,
        restaurant: { select: { name: true } },
        deliveryDriver: { select: { id: true, name: true, phone: true, lastLocationAt: true } },
      },
    });
    return res.status(200).json({
      success: true,
      orders: orders.map((order) => ({
        ...order,
        minutes: Math.max(0, Math.floor((now - order.updatedAt.getTime()) / 60000)),
        locationMinutes: order.deliveryDriver?.lastLocationAt ? Math.floor((now - order.deliveryDriver.lastLocationAt.getTime()) / 60000) : null,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// Before pickup, the order goes back to the list and the driver gets his commission back
export async function releaseDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const reason = readCancelReason(req.body?.reason);
    if (!reason) return res.status(400).json({ success: false, message: CANCEL_REASON_MESSAGE });
    const order = await prisma.order.findFirst({ where: { id: orderId, type: "DELIVERY", status: OrderStatus.DELIVERING } });
    if (!order || !order.deliveryDriverId) return res.status(404).json({ success: false, message: "Ese pedido no está en camino." });
    if (order.pickedUpAt) {
      return res.status(409).json({ success: false, message: "El motorizado ya retiró la comida. Solo se puede cancelar." });
    }
    const driverId = order.deliveryDriverId;
    const done = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${driverId} FOR UPDATE`;
      const claimed = await tx.order.updateMany({
        where: { id: orderId, deliveryDriverId: driverId, status: OrderStatus.DELIVERING, pickedUpAt: null },
        data: { status: OrderStatus.READY, deliveryDriverId: null, driverLat: null, driverLng: null, providerPayAmount: null, driverEarnings: null, appCommissionFromProvider: null },
      });
      if (claimed.count === 0) return false;
      await refundTakeCommission(tx, orderId, driverId, `Devolución por liberar el Pedido #${orderId}`);
      await tx.deliveryIncident.create({
        data: { orderId, driverId, type: "ADMIN", reason: `Liberado por GoEats: ${reason}`, reviewedAt: new Date(), reviewedById: req.user?.userId ?? null },
      });
      return true;
    });
    if (!done) return res.status(409).json({ success: false, message: "El pedido cambió. Actualiza la pantalla." });
    const io = req.app.get("io");
    notifyDeliveryBoard(io);
    notifyWallet(io, driverId);
    io?.to(`restaurant-${order.restaurantId}`).to(`order-${orderId}`).emit("order-status-updated", { orderId, status: OrderStatus.READY, driverName: null });
    return res.status(200).json({ success: true, message: "Pedido liberado. Ya lo puede tomar otro motorizado." });
  } catch (error) {
    next(error);
  }
}

// Any delivery not finished yet, at any step
export async function cancelDeliveryAsAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const reason = readCancelReason(req.body?.reason);
    if (!reason) return res.status(400).json({ success: false, message: CANCEL_REASON_MESSAGE });
    const order = await prisma.order.findFirst({
      where: { id: orderId, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] } },
      include: { sale: { select: { id: true } } },
    });
    if (!order) return res.status(404).json({ success: false, message: "Ese pedido ya terminó." });
    if (order.sale) return res.status(409).json({ success: false, message: "Ese pedido ya se cobró en caja." });
    const cancelled = await cancelOrderAndNotify(req.app.get("io"), order, { by: "admin", reason });
    if (!cancelled) return res.status(409).json({ success: false, message: "El pedido cambió. Actualiza la pantalla." });
    return res.status(200).json({ success: true, message: "Pedido cancelado." });
  } catch (error) {
    next(error);
  }
}

// What each restaurant owes GoEats for deliveries paid straight to it: commission, shipping and tip
export async function getRestaurantBalances(req: Request, res: Response, next: NextFunction) {
  try {
    const day = (value: unknown, time: string) =>
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T${time}-05:00`) : null;
    const start = day(req.query.from, "00:00:00.000") ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = day(req.query.to, "23:59:59.999") ?? new Date();
    const orders = await prisma.order.findMany({
      where: {
        type: "DELIVERY",
        status: OrderStatus.DELIVERED,
        paymentMethodString: { in: ["TRANSFER", "CARD"] },
        updatedAt: { gte: start, lte: end },
      },
      select: { restaurantId: true, appCommissionFromProvider: true, shippingCost: true, tipAmount: true, restaurant: { select: { name: true } } },
    });
    const byRestaurant = new Map<number, { restaurantId: number; name: string; orders: number; commission: number; shipping: number; tips: number; total: number }>();
    for (const order of orders) {
      const row = byRestaurant.get(order.restaurantId) ?? { restaurantId: order.restaurantId, name: order.restaurant.name, orders: 0, commission: 0, shipping: 0, tips: 0, total: 0 };
      row.orders += 1;
      row.commission = round2(row.commission + (order.appCommissionFromProvider || 0));
      row.shipping = round2(row.shipping + (order.shippingCost || 0));
      row.tips = round2(row.tips + (order.tipAmount || 0));
      row.total = round2(row.commission + row.shipping + row.tips);
      byRestaurant.set(order.restaurantId, row);
    }
    return res.status(200).json({ success: true, from: start, to: end, restaurants: [...byRestaurant.values()].sort((a, b) => b.total - a.total) });
  } catch (error) {
    next(error);
  }
}
