import { OrderStatus, OrderType } from "@prisma/client";
import type { Server } from "socket.io";
import { prisma } from "../../config/database";
import { cancelOrderAndNotify } from "./orderCancel";

// Cash and transfer orders wait for the register (engineers, 25 nov).
// Without an answer: the restaurant is warned, and later the order is cancelled so the customer isn't left waiting.
export const ACCEPT_WARN_MIN = 5;
export const ACCEPT_LIMIT_MIN = 15;
// Older orders are left alone: they are from before this rule, or the server was off
const IGNORE_AFTER_MIN = 6 * 60;
const WATCH_EVERY_MS = 30 * 1000;
const MINUTE = 60 * 1000;

const warned = new Set<number>();

export async function checkWaitingOrders(io: Server | undefined, now = Date.now()) {
  const waiting = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      type: { in: [OrderType.DELIVERY, OrderType.TAKEOUT] },
      paymentStatus: { not: "APPROVED" },
      // Only orders sent by customers: the register doesn't wait for itself
      customerId: { not: null },
      createdAt: { lte: new Date(now - ACCEPT_WARN_MIN * MINUTE), gte: new Date(now - IGNORE_AFTER_MIN * MINUTE) },
    },
    take: 100,
  });

  const ids = new Set(waiting.map((order) => order.id));
  for (const id of warned) if (!ids.has(id)) warned.delete(id);

  for (const order of waiting) {
    const minutes = Math.floor((now - order.createdAt.getTime()) / MINUTE);
    if (minutes >= ACCEPT_LIMIT_MIN) {
      await cancelOrderAndNotify(io, order, { by: "timeout" });
      continue;
    }
    if (warned.has(order.id)) continue;
    warned.add(order.id);
    io?.to(`restaurant-${order.restaurantId}`).emit("waiter-order-notification", {
      type: "CALL_WAITER",
      restaurantId: order.restaurantId,
      orderId: order.id,
      tableName: order.customerName,
      title: `Pedido #${order.id} esperando`,
      message: `${order.customerName} espera hace ${minutes} min. Acéptalo o recházalo en Pedidos: en ${ACCEPT_LIMIT_MIN - minutes} min se cancela solo.`,
      timestamp: new Date(now).toISOString(),
    });
  }
  return waiting.length;
}

export function startAcceptanceWatcher(io: Server) {
  const timer = setInterval(() => {
    checkWaitingOrders(io).catch((error) => console.error("[Orders] Could not check waiting orders:", error));
  }, WATCH_EVERY_MS);
  timer.unref();
  return timer;
}
