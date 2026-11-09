import { OrderStatus, OrderType, Role } from "@prisma/client";

type OrderState = {
  type: OrderType;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethodString: string | null;
  payphoneTransactionId: string | null;
};

const PAYMENT_ROLES: Role[] = [Role.SUPER_ADMIN, Role.RESTAURANT_OWNER, Role.CAJERO];
const CANCEL_ROLES: Role[] = [Role.SUPER_ADMIN, Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO];

export function isOrderPaid(order: Pick<OrderState, "paymentStatus" | "payphoneTransactionId">) {
  return order.paymentStatus === "APPROVED" || !!order.payphoneTransactionId;
}

export function isTransferUnverified(order: OrderState) {
  return order.status === OrderStatus.PENDING && order.paymentMethodString === "TRANSFER" && !isOrderPaid(order);
}

export function canEditOrder(order: Pick<OrderState, "status">) {
  const editable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY];
  return editable.includes(order.status);
}

// Returns why the order can't be cancelled, or null when it can
export function getCancelError(order: Pick<OrderState, "status">, hasSale: boolean) {
  if (order.status === OrderStatus.DELIVERED) return "No se puede cancelar un pedido entregado";
  if (order.status === OrderStatus.CANCELLED) return "Este pedido ya está cancelado";
  if (hasSale) return "Este pedido ya fue cobrado en caja y no se puede cancelar";
  return null;
}

// A restaurant can charge table orders before cooking them (payBeforeEating)
export function mustPayBeforeCooking(order: Pick<OrderState, "type" | "paymentStatus" | "payphoneTransactionId">, payBeforeEating: boolean) {
  return payBeforeEating && order.type === OrderType.DINE_IN && !isOrderPaid(order);
}

// Highest tip accepted, so a typo can't turn into a huge charge
export const MAX_TIP = 100;

// Returns why the order can't be charged at the register, or null when it can
export function getChargeError(order: OrderState, hasSale: boolean, payBeforeEating = false) {
  if (hasSale) return "Este pedido ya fue cobrado";
  if (order.status === OrderStatus.CANCELLED) return "Este pedido está cancelado";
  if (order.status === OrderStatus.DELIVERED) return "Este pedido ya está cerrado";
  if (isOrderPaid(order)) return "Este pedido ya fue pagado";
  if (order.type === OrderType.DELIVERY) return "Los pedidos a domicilio se cobran al entregar";
  if (isTransferUnverified(order)) return "Primero hay que verificar la transferencia";
  if (order.type === OrderType.DINE_IN && order.status !== OrderStatus.READY) {
    // Pay first: the order waits unpaid, before the kitchen starts it
    if (payBeforeEating && order.status === OrderStatus.PENDING) return null;
    return "La cocina todavía no termina este pedido";
  }
  return null;
}

// Validates a manual change. Returns the HTTP error, or null when it's allowed
export function getStatusChangeError(
  order: OrderState,
  nextStatus: OrderStatus,
  role: Role | undefined,
  paymentStatus?: unknown,
  payBeforeEating = false
): { code: number; message: string } | null {
  const conflict = (message: string) => ({ code: 409, message });

  if (paymentStatus !== undefined) {
    if (!role || !PAYMENT_ROLES.includes(role)) {
      return { code: 403, message: "Solo el dueño o el cajero pueden verificar pagos" };
    }
    const expected = paymentStatus === "APPROVED" ? OrderStatus.PREPARING : paymentStatus === "REJECTED" ? OrderStatus.CANCELLED : null;
    if (expected !== nextStatus) {
      return { code: 400, message: "Estado de pago no válido" };
    }
    if (!isTransferUnverified(order)) {
      return conflict("Este pedido no tiene una transferencia por verificar");
    }
  }

  if (nextStatus === OrderStatus.CANCELLED) {
    return role && CANCEL_ROLES.includes(role) ? null : { code: 403, message: "No tienes permiso para cancelar pedidos" };
  }

  if (nextStatus === OrderStatus.PENDING) return conflict("Un pedido no puede volver a pendiente");
  if (nextStatus === OrderStatus.DELIVERING) return conflict("El pedido sale a reparto cuando un motorizado lo toma");

  if (nextStatus === OrderStatus.PREPARING) {
    if (order.status !== OrderStatus.PENDING) return conflict("Solo un pedido pendiente puede pasar a preparación");
    if (isTransferUnverified(order) && paymentStatus !== "APPROVED") {
      return conflict("Primero hay que verificar la transferencia");
    }
    if (mustPayBeforeCooking(order, payBeforeEating)) {
      return conflict("Este local cobra antes de preparar: primero cobra el pedido en caja");
    }
    return null;
  }

  if (nextStatus === OrderStatus.READY) {
    return order.status === OrderStatus.PREPARING ? null : conflict("Solo un pedido en preparación puede quedar listo");
  }

  if (order.type === OrderType.DELIVERY) {
    return conflict("El motorizado cierra la entrega con el PIN del cliente");
  }
  if (order.status !== OrderStatus.READY) return conflict("Solo un pedido listo puede entregarse");
  if (!isOrderPaid(order)) return conflict("Primero hay que cobrar este pedido");
  return null;
}

export function getTakeCommissionDescription(orderId: number) {
  return `Comisión de despacho por tomar Pedido #${orderId}`;
}

export function hideDeliveryPin<T extends { deliveryPin?: string | null }>(order: T) {
  const { deliveryPin, ...safeOrder } = order;
  return { ...safeOrder, requiresPin: !!deliveryPin };
}
