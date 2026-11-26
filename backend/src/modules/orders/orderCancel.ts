import { OrderStatus, OrderType } from "@prisma/client";
import type { Server } from "socket.io";
import { prisma } from "../../config/database";
import { notifyDeliveryBoard, notifyWallet } from "../../config/realtime";
import { hideDeliveryPin, isOrderPaid } from "../../utils/orderRules";
import { releaseTable } from "../../utils/tables";
import { refundTakeCommission } from "../delivery/deliveryWallet";
import { NotificationService } from "../notifications/notification.service";

// Who cancelled. The text goes before the reason, so customer, restaurant and driver read the same
export const CANCELLED_BY = {
  restaurant: "Cancelado por el local",
  rejected: "Rechazado por el local",
  customer: "Cancelado por el cliente",
  admin: "Cancelado por GoEats",
  timeout: "El local no respondió a tiempo",
  noDriver: "Ningún motorizado lo tomó a tiempo",
} as const;

const REASON_MIN = 5;
const REASON_MAX = 140;
const NOTE_MAX = 191;
export const CANCEL_REASON_MESSAGE = `Escribe el motivo con al menos ${REASON_MIN} letras.`;

// Required written reason. Returns null when it's not valid
export function readCancelReason(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length >= REASON_MIN && text.length <= REASON_MAX ? text : null;
}

interface CancellableOrder {
  id: number;
  type: OrderType;
  status: OrderStatus;
  tableId: number | null;
  deliveryDriverId: number | null;
  paymentStatus: string;
  payphoneTransactionId: string | null;
  paymentMethodString: string | null;
  paymentReceipt: string | null;
}

// Money the customer already sent to the restaurant: it has to be given back
function owesRefund(order: CancellableOrder) {
  return isOrderPaid(order) || (order.paymentMethodString === "TRANSFER" && !!order.paymentReceipt);
}

// Cancels the order, frees its table and gives back what the driver paid to take it.
// Returns null when the order changed in the meantime.
export async function cancelOrderAndNotify(
  io: Server | undefined,
  order: CancellableOrder,
  options: { by: keyof typeof CANCELLED_BY; reason?: string | null; rejectedPayment?: boolean }
) {
  const note = [CANCELLED_BY[options.by], options.reason].filter(Boolean).join(": ").slice(0, NOTE_MAX);

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: order.status, deliveryDriverId: order.deliveryDriverId },
      data: {
        status: OrderStatus.CANCELLED,
        deliveryObservation: note,
        // A receipt that was not valid has nothing to give back
        paymentStatus: options.rejectedPayment ? "REJECTED" : owesRefund(order) ? "REFUND_PENDING" : order.paymentStatus,
      },
    });
    if (claimed.count === 0) return null;

    if (order.type === OrderType.DINE_IN && order.tableId) {
      await releaseTable(tx, order.tableId, order.id);
    }

    if (order.status === OrderStatus.DELIVERING && order.deliveryDriverId) {
      await refundTakeCommission(tx, order.id, order.deliveryDriverId, `Devolución por cancelación de Pedido #${order.id}`);
    }

    return tx.order.findUnique({
      where: { id: order.id },
      omit: { paymentReceipt: true },
      include: {
        table: true,
        items: { include: { variant: { include: { menuItem: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  });

  if (!updatedOrder) return null;

  const safeOrder = hideDeliveryPin(updatedOrder);
  if (io) {
    notifyDeliveryBoard(io);
    io.to(`restaurant-${updatedOrder.restaurantId}`).to(`order-${order.id}`).emit("order-cancelled", safeOrder);
    io.to(`restaurant-${updatedOrder.restaurantId}`).to(`order-${order.id}`).emit("order-status-updated", safeOrder);
  }
  if (order.deliveryDriverId) notifyWallet(io, order.deliveryDriverId);

  if (updatedOrder.customer?.email) {
    NotificationService.notifyOrderCancelled(
      { id: order.id },
      { id: updatedOrder.customer.id, name: updatedOrder.customer.name, email: updatedOrder.customer.email },
      note
    ).catch((e) => console.warn("[Email] Error order cancelled notification:", e));
  }

  return safeOrder;
}
