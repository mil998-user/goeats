import { Prisma } from "@prisma/client";
import { getTakeCommissionDescription } from "../../utils/orderRules";

// PREPAID: the driver needs balance to pay the take commission.
// DEBT_LIMIT: the driver may go negative down to their maxDebtLimit.
export const BALANCE_RULES = ["PREPAID", "DEBT_LIMIT"] as const;
export type BalanceRule = (typeof BALANCE_RULES)[number];

export function isBalanceRule(value: unknown): value is BalanceRule {
  return typeof value === "string" && (BALANCE_RULES as readonly string[]).includes(value);
}

export function readBalanceRule(value: unknown): BalanceRule {
  return isBalanceRule(value) ? value : "PREPAID";
}

const round2 = (value: number) => Math.round(value * 100) / 100;

// Lowest balance the driver may keep after paying the take commission
export function getMinimumBalanceAfterTake(rule: BalanceRule, maxDebtLimit: number) {
  return rule === "DEBT_LIMIT" ? -Math.abs(maxDebtLimit) : 0;
}

export function canPayTakeCommission(balance: number, cost: number, rule: BalanceRule, maxDebtLimit: number) {
  return round2(balance - cost) >= getMinimumBalanceAfterTake(rule, maxDebtLimit);
}

export function getInsufficientBalanceMessage(rule: BalanceRule, cost: number, maxDebtLimit: number) {
  if (rule === "DEBT_LIMIT") {
    return `Llegaste a tu límite de deuda de $${Math.abs(maxDebtLimit).toFixed(2)}. Haz un abono a GoEats para volver a tomar pedidos.`;
  }
  return `Saldo insuficiente en tu billetera. Necesitas al menos $${cost.toFixed(2)} para tomar este pedido. Por favor recarga.`;
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
