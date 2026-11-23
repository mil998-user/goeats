import { Prisma } from "@prisma/client";
import { getTakeCommissionDescription } from "../../utils/orderRules";

// The driver wallet never goes below $0 (bosses, 17 nov).
// To take an order the balance must already cover everything that order will deduct:
// the take commission and, on cash orders, the GoEats share of the cash the driver collects.

const round2 = (value: number) => Math.round(value * 100) / 100;

// Cash the driver keeps on a cash order that belongs to GoEats. It is deducted on delivery
export function getCashHoldback(total: number, providerPay: number, driverEarnings: number) {
  return Math.max(0, round2(total - providerPay - driverEarnings));
}

export function canCoverOrder(balance: number, required: number) {
  return round2(balance - required) >= 0;
}

export function getInsufficientBalanceMessage(required: number, balance: number) {
  const missing = Math.max(0.01, round2(required - balance));
  return `Saldo insuficiente: necesitas $${required.toFixed(2)} de saldo para tomar este pedido. Recarga $${missing.toFixed(2)} para seguir tomando pedidos.`;
}

// Gives back the take commission this driver still has paid for the order.
// Charges minus refunds, so a pass followed by a new take never refunds twice.
// Refund descriptions must end with "Pedido #<id>" to be counted.
export async function refundTakeCommission(tx: Prisma.TransactionClient, orderId: number, driverId: number, description: string) {
  const [charged, refunded] = await Promise.all([
    tx.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: driverId, type: "COMMISSION_DEDUCTION", description: getTakeCommissionDescription(orderId) },
    }),
    tx.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: driverId, type: "COMMISSION_REFUND", description: { endsWith: `Pedido #${orderId}` } },
    }),
  ]);

  const pending = round2(Math.abs(charged._sum.amount || 0) - (refunded._sum.amount || 0));
  if (pending <= 0) return 0;

  await tx.user.update({
    where: { id: driverId },
    data: { walletBalance: { increment: pending } },
  });
  await tx.walletTransaction.create({
    data: { userId: driverId, amount: pending, type: "COMMISSION_REFUND", description },
  });
  return pending;
}
