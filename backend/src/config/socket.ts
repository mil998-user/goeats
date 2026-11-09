import { Role } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { prisma } from "./database";
import { getSessionUser, TokenPayload } from "../middlewares/auth";
import { ADMIN_ROOM } from "../modules/delivery/dispatch";

async function canJoinOrder(user: TokenPayload, orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { restaurantId: true, customerId: true, deliveryDriverId: true },
  });
  if (!order) return false;

  if (user.role === Role.SUPER_ADMIN) return true;
  if (user.role === Role.CUSTOMER) return order.customerId === user.userId;
  if (user.role === Role.MOTORIZADO) return order.deliveryDriverId === user.userId;
  return order.restaurantId === user.restaurantId;
}

export function setupSocket(io: Server) {
  // Every real-time connection needs a valid session
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") {
      return next(new Error("Unauthorized"));
    }

    try {
      const user = await getSessionUser(token);
      if (!user) {
        return next(new Error("Unauthorized"));
      }
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as TokenPayload;
    const isRestaurantStaff = user.role !== Role.CUSTOMER && user.role !== Role.MOTORIZADO;

    // The restaurant room comes from the token, clients can't pick one
    if (isRestaurantStaff && user.restaurantId) {
      socket.join(`restaurant-${user.restaurantId}`);
    }
    // Alerts for the administrator, such as a ready delivery that nobody took
    if (user.role === Role.SUPER_ADMIN) {
      socket.join(ADMIN_ROOM);
    }

    socket.on("join-order", async (rawOrderId: string | number) => {
      const orderId = Number(rawOrderId);
      if (!Number.isInteger(orderId) || orderId <= 0) return;

      try {
        if (await canJoinOrder(user, orderId)) {
          socket.join(`order-${orderId}`);
        }
      } catch (error) {
        console.error("[Socket] Could not join order room:", error);
      }
    });
  });
}
