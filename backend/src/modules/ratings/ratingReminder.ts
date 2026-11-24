import { OrderStatus } from "@prisma/client";
import { Server } from "socket.io";
import { prisma } from "../../config/database";
import { userRoom } from "../../config/realtime";

// The customer is asked to rate between 15 and 20 minutes after the delivery (plan 5.9).
// Orders have no delivery time of their own: updatedAt is the moment they became DELIVERED.
export const RATING_AFTER_MS = 15 * 60 * 1000;
const RATING_LIMIT_MS = 20 * 60 * 1000;
const WATCH_EVERY_MS = 60 * 1000;

// In memory on purpose: after a restart the worst case is one repeated reminder
const reminded = new Map<number, number>();

export async function remindRatings(io: Server | undefined, now = Date.now()) {
  for (const [orderId, at] of reminded) {
    if (now - at > 2 * RATING_LIMIT_MS) reminded.delete(orderId);
  }

  // Nobody connected: nothing to send, so the database is not asked either
  if (io && io.engine?.clientsCount === 0) return;

  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
      customerId: { not: null },
      updatedAt: { gte: new Date(now - RATING_LIMIT_MS), lte: new Date(now - RATING_AFTER_MS) },
      OR: [{ rating: { is: null } }, { rating: { is: { restaurantStars: null } } }],
    },
    select: { id: true, customerId: true },
    take: 100,
  });

  for (const order of orders) {
    if (reminded.has(order.id)) continue;
    reminded.set(order.id, now);
    io?.to(userRoom(order.customerId as number)).emit("rate-order", { orderId: order.id });
  }
}

export function startRatingReminder(io: Server) {
  const timer = setInterval(() => {
    remindRatings(io).catch((error) => console.error("[Ratings] Could not send reminders:", error));
  }, WATCH_EVERY_MS);
  timer.unref();
  return timer;
}
