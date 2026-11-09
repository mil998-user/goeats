import { OrderStatus, OrderType, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

// Orders still being attended at a table
export const OPEN_TABLE_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY];

// Frees a table only when no other order is still open there.
// The tables joined to it are released with it, so the next group finds them free.
export async function releaseTable(tx: Tx, tableId: number, exceptOrderId?: number) {
  const stillOpen = await tx.order.count({
    where: {
      tableId,
      type: OrderType.DINE_IN,
      status: { in: OPEN_TABLE_STATUSES },
      ...(exceptOrderId ? { id: { not: exceptOrderId } } : {}),
    },
  });
  if (stillOpen > 0) return false;

  await tx.table.update({ where: { id: tableId }, data: { status: "FREE" } });
  await tx.table.updateMany({ where: { joinedToId: tableId }, data: { joinedToId: null, status: "FREE" } });
  return true;
}

// A joined table sends its orders to the main table of the group
export async function resolveOrderTable(tx: Tx, tableId: number, restaurantId: number) {
  const table = await tx.table.findFirst({
    where: { id: tableId, diningArea: { restaurantId } },
    select: { id: true, joinedToId: true },
  });
  if (!table) return null;
  return table.joinedToId ?? table.id;
}
