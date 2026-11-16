import { Server } from "socket.io";
import { ADMIN_ROOM } from "../modules/delivery/dispatch";

// Sala de todos los motorizados conectados
export const DRIVERS_ROOM = "drivers";

// Sala personal de cada usuario, para avisos que solo le tocan a el
export const userRoom = (userId: number) => `user-${userId}`;

// Cambio la lista de pedidos para repartir (nuevo, listo, tomado, cancelado...)
export function notifyDeliveryBoard(io?: Server | null) {
  io?.to(DRIVERS_ROOM).to(ADMIN_ROOM).emit("delivery-board-changed");
}

// Cambio el saldo de un motorizado
export function notifyWallet(io: Server | null | undefined, userId: number) {
  io?.to(userRoom(userId)).to(ADMIN_ROOM).emit("wallet-changed", { userId });
}

// Cambio una solicitud de recarga o de plan (nueva, aprobada o rechazada)
export function notifySaasOrder(io: Server | null | undefined, userId: number) {
  io?.to(userRoom(userId)).to(ADMIN_ROOM).emit("saas-order-changed", { userId });
}
