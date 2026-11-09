import { Request, Response, NextFunction } from "express";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { NotificationService } from "../notifications/notification.service";
import { hideDeliveryPin, isOrderPaid } from "../../utils/orderRules";
import { refundTakeCommission } from "./deliveryWallet";

export const INCIDENT_TYPES = ["PASS", "CANCEL", "NO_SHOW", "NO_CODE"] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

const REASON_MIN = 10;
const REASON_MAX = 500;
const REASON_MESSAGE = `Escribe el motivo con al menos ${REASON_MIN} letras.`;

// Required written reason for pass, cancel and delivery problems. Returns null when it's not valid
export function readReason(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < REASON_MIN || text.length > REASON_MAX) return null;
  return text;
}

function readIds(req: Request) {
  const orderId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;
  if (isNaN(orderId) || !userId) return null;
  return { orderId, userId };
}

function emitStatus(req: Request, restaurantId: number, orderId: number, payload: Record<string, unknown>) {
  const io = req.app.get("io");
  if (io) io.to(`restaurant-${restaurantId}`).to(`order-${orderId}`).emit("order-status-updated", { orderId, ...payload });
}

// The driver picked up the food and leaves the restaurant
export async function startTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = readIds(req);
    if (!ids) return res.status(400).json({ success: false, message: "Pedido no válido" });

    const order = await prisma.order.findFirst({
      where: { id: ids.orderId, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING },
    });
    if (!order) return res.status(404).json({ success: false, message: "Pedido activo no encontrado" });

    if (!order.pickedUpAt) {
      await prisma.order.updateMany({
        where: { id: order.id, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING, pickedUpAt: null },
        data: { pickedUpAt: new Date() },
      });
      emitStatus(req, order.restaurantId, order.id, { status: OrderStatus.DELIVERING, pickedUp: true });
    }

    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    return res.status(200).json({ success: true, message: "Traslado iniciado", order: updated && hideDeliveryPin(updated) });
  } catch (error) {
    next(error);
  }
}

// Why a pass or cancel can't be done on this order, or null when it can
async function getBeforePickupError(orderId: number, userId: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryDriverId: userId, status: OrderStatus.DELIVERING },
    select: { pickedUpAt: true },
  });
  if (!order) return { status: 404, message: "Pedido activo no encontrado" };
  if (order.pickedUpAt) {
    return { status: 409, message: "Ya retiraste la comida. Si el cliente no sale o no tiene el código, usa esas opciones." };
  }
  return null;
}

// Before pickup: the order goes back to the list for another driver, and the commission is returned
export async function passOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = readIds(req);
    if (!ids) return res.status(400).json({ success: false, message: "Pedido no válido" });
    const reason = readReason(req.body?.reason);
    if (!reason) return res.status(400).json({ success: false, message: REASON_MESSAGE });

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${ids.userId} FOR UPDATE`;

      const claimed = await tx.order.updateMany({
        where: { id: ids.orderId, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING, pickedUpAt: null },
        data: {
          status: OrderStatus.READY,
          deliveryDriverId: null,
          driverLat: null,
          driverLng: null,
          providerPayAmount: null,
          driverEarnings: null,
          appCommissionFromProvider: null,
        },
      });
      if (claimed.count === 0) return null;

      const refunded = await refundTakeCommission(tx, ids.orderId, ids.userId, `Devolución por pasar el Pedido #${ids.orderId}`);
      await tx.deliveryIncident.create({
        data: { orderId: ids.orderId, driverId: ids.userId, type: "PASS", reason },
      });
      const order = await tx.order.findUnique({ where: { id: ids.orderId } });
      return { order, refunded };
    });

    if (!result?.order) {
      const error = await getBeforePickupError(ids.orderId, ids.userId);
      return res.status(error?.status ?? 404).json({ success: false, message: error?.message ?? "Pedido activo no encontrado" });
    }

    emitStatus(req, result.order.restaurantId, result.order.id, { status: OrderStatus.READY, driverName: null });

    return res.status(200).json({
      success: true,
      message: result.refunded > 0
        ? `Pasaste el pedido. Te devolvimos $${result.refunded.toFixed(2)} de comisión.`
        : "Pasaste el pedido. Otro motorizado lo puede tomar.",
      refunded: result.refunded,
    });
  } catch (error) {
    next(error);
  }
}

// Before pickup, when the restaurant is closed or the order can't be done. The order is cancelled
export async function cancelByDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = readIds(req);
    if (!ids) return res.status(400).json({ success: false, message: "Pedido no válido" });
    const reason = readReason(req.body?.reason);
    if (!reason) return res.status(400).json({ success: false, message: REASON_MESSAGE });

    const order = await prisma.order.findFirst({
      where: { id: ids.orderId, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING, pickedUpAt: null },
      include: { customer: { select: { id: true, name: true, email: true } } },
    });
    if (!order) {
      const error = await getBeforePickupError(ids.orderId, ids.userId);
      return res.status(error?.status ?? 404).json({ success: false, message: error?.message ?? "Pedido activo no encontrado" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM User WHERE id = ${ids.userId} FOR UPDATE`;

      const claimed = await tx.order.updateMany({
        where: { id: order.id, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING, pickedUpAt: null },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: isOrderPaid(order) ? "REFUND_PENDING" : order.paymentStatus,
          deliveryObservation: `Cancelado por el motorizado: ${reason}`,
        },
      });
      if (claimed.count === 0) return null;

      const refunded = await refundTakeCommission(tx, order.id, ids.userId, `Devolución por cancelación de Pedido #${order.id}`);
      await tx.deliveryIncident.create({
        data: { orderId: order.id, driverId: ids.userId, type: "CANCEL", reason },
      });
      return { refunded };
    });

    if (!result) return res.status(409).json({ success: false, message: "El pedido cambió. Actualiza la pantalla." });

    const io = req.app.get("io");
    if (io) io.to(`restaurant-${order.restaurantId}`).to(`order-${order.id}`).emit("order-cancelled", { id: order.id, orderId: order.id, status: OrderStatus.CANCELLED });
    emitStatus(req, order.restaurantId, order.id, { status: OrderStatus.CANCELLED });

    // The driver's text is not sent to the customer; GoEats reviews it first
    if (order.customer?.email) {
      NotificationService.notifyOrderCancelled(
        { id: order.id },
        { id: order.customer.id, name: order.customer.name, email: order.customer.email },
        "El motorizado no pudo completar tu pedido. GoEats revisará lo sucedido."
      ).catch((e) => console.warn("[Email] Error order cancelled by driver:", e));
    }

    return res.status(200).json({ success: true, message: "Pedido cancelado. El administrador revisará el motivo.", refunded: result.refunded });
  } catch (error) {
    next(error);
  }
}

// After pickup, when the customer doesn't come out. The order is closed as not delivered.
// Money is not moved: the administrator decides after reviewing it
export async function reportNoShow(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = readIds(req);
    if (!ids) return res.status(400).json({ success: false, message: "Pedido no válido" });
    const reason = readReason(req.body?.reason);
    if (!reason) return res.status(400).json({ success: false, message: REASON_MESSAGE });

    const order = await prisma.order.findFirst({
      where: { id: ids.orderId, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING },
    });
    if (!order) return res.status(404).json({ success: false, message: "Pedido activo no encontrado" });
    if (!order.pickedUpAt) {
      return res.status(409).json({ success: false, message: "Primero presiona \"Empezar traslado\" cuando retires la comida." });
    }

    const done = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: order.id, deliveryDriverId: ids.userId, status: OrderStatus.DELIVERING },
        data: { status: OrderStatus.CANCELLED, deliveryObservation: `Cliente no salió: ${reason}` },
      });
      if (claimed.count === 0) return false;
      await tx.deliveryIncident.create({
        data: { orderId: order.id, driverId: ids.userId, type: "NO_SHOW", reason },
      });
      return true;
    });

    if (!done) return res.status(409).json({ success: false, message: "El pedido cambió. Actualiza la pantalla." });

    emitStatus(req, order.restaurantId, order.id, { status: OrderStatus.CANCELLED });
    return res.status(200).json({ success: true, message: "Reportado. El administrador revisará el caso y te avisará." });
  } catch (error) {
    next(error);
  }
}

// Administrator: incidents waiting for review (or all with ?all=true)
export async function getIncidents(req: Request, res: Response, next: NextFunction) {
  try {
    const showAll = req.query.all === "true";
    const incidents = await prisma.deliveryIncident.findMany({
      where: showAll ? {} : { reviewedAt: null },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            paymentMethodString: true,
            paymentStatus: true,
            customerName: true,
            restaurant: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return res.status(200).json({ success: true, incidents });
  } catch (error) {
    next(error);
  }
}

export async function reviewIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Incidencia no válida" });

    const rawNote = typeof req.body?.note === "string" ? req.body.note.trim() : "";
    if (rawNote.length > REASON_MAX) {
      return res.status(400).json({ success: false, message: `La nota no puede pasar de ${REASON_MAX} letras.` });
    }

    const updated = await prisma.deliveryIncident.updateMany({
      where: { id, reviewedAt: null },
      data: { reviewedAt: new Date(), reviewedById: req.user?.userId ?? null, reviewNote: rawNote || null },
    });
    if (updated.count === 0) {
      return res.status(404).json({ success: false, message: "La incidencia no existe o ya fue revisada" });
    }
    return res.status(200).json({ success: true, message: "Incidencia revisada" });
  } catch (error) {
    next(error);
  }
}
