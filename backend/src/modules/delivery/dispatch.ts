import { Request, Response, NextFunction } from "express";
import { OrderStatus, OrderType } from "@prisma/client";
import type { Server } from "socket.io";
import { prisma } from "../../config/database";
import { getShippingDistanceKm } from "../../utils/shipping";
import { cancelOrderAndNotify } from "../orders/orderCancel";

// A driver location older than this doesn't count as "nearby"
export const LOCATION_FRESH_MS = 10 * 60 * 1000;
const WATCH_EVERY_MS = 30 * 1000;
export const ADMIN_ROOM = "admins";
// Minutes a ready order is only for the nearby drivers before it opens to all (bosses, 17 nov)
export const DISPATCH_WAIT_MIN = 1;

interface DispatchRate {
  dispatchRadiusKm: number;
}

interface DispatchOrder {
  readyAt: Date | null;
  updatedAt: Date;
  restaurant: { mapLatitude: number | null; mapLongitude: number | null } | null;
}

interface DispatchDriver {
  lastLat: number | null;
  lastLng: number | null;
  lastLocationAt: Date | null;
}

// When a ready order stops being only for the nearby drivers
export function getOpenToAllAt(order: DispatchOrder) {
  const readyAt = order.readyAt ?? order.updatedAt;
  return new Date(readyAt.getTime() + DISPATCH_WAIT_MIN * 60 * 1000);
}

// Distance from the driver to the restaurant, or null without a recent location
export function getDriverDistanceKm(order: DispatchOrder, driver: DispatchDriver, now = new Date()) {
  const fresh = driver.lastLocationAt && now.getTime() - driver.lastLocationAt.getTime() <= LOCATION_FRESH_MS;
  if (!fresh || driver.lastLat == null || driver.lastLng == null) return null;
  if (order.restaurant?.mapLatitude == null || order.restaurant?.mapLongitude == null) return null;
  return getShippingDistanceKm(order.restaurant.mapLatitude, order.restaurant.mapLongitude, driver.lastLat, driver.lastLng);
}

// First the drivers inside the radius see the order; once the wait is over, everyone does.
// A restaurant without a map location can't be measured, so its orders are open to all at once
export function getDispatchView(order: DispatchOrder, driver: DispatchDriver, rate: DispatchRate, now = new Date()) {
  const openToAllAt = getOpenToAllAt(order);
  const openToAll = now.getTime() >= openToAllAt.getTime();
  const hasRestaurantLocation = order.restaurant?.mapLatitude != null && order.restaurant?.mapLongitude != null;
  const distanceKm = getDriverDistanceKm(order, driver, now);
  const nearby = distanceKm !== null && distanceKm <= rate.dispatchRadiusKm;
  return {
    visible: openToAll || nearby || !hasRestaurantLocation,
    nearby,
    openToAll: openToAll || !hasRestaurantLocation,
    openToAllAt,
    distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
  };
}

// Ready deliveries that nobody took within the wait: the administrator gets one alert per order
export async function alertUnassignedDeliveries(io: Server | undefined, now = new Date()) {
  const limit = new Date(now.getTime() - DISPATCH_WAIT_MIN * 60 * 1000);

  const waiting = await prisma.order.findMany({
    where: {
      type: OrderType.DELIVERY,
      status: OrderStatus.READY,
      deliveryDriverId: null,
      dispatchAlertAt: null,
      readyAt: { lte: limit },
    },
    select: { id: true, readyAt: true, restaurant: { select: { name: true } } },
    take: 50,
  });

  for (const order of waiting) {
    // Only the first check marks it, so two servers never alert twice
    const marked = await prisma.order.updateMany({
      where: { id: order.id, dispatchAlertAt: null },
      data: { dispatchAlertAt: now },
    });
    if (marked.count === 0) continue;
    io?.to(ADMIN_ROOM).emit("dispatch-alert", {
      orderId: order.id,
      restaurantName: order.restaurant.name,
      readyAt: order.readyAt,
      message: `Nadie tomó el pedido #${order.id} de ${order.restaurant.name} en ${DISPATCH_WAIT_MIN} min.`,
    });
  }
  return waiting.length;
}

// After 10 minutes without a driver, the restaurant and the customer are told; GoEats decides what to do
export const NOBODY_TOOK_MIN = 10;
const delayWarned = new Set<number>();
export async function warnDelayedDeliveries(io: Server | undefined, now = new Date()) {
  const waiting = await prisma.order.findMany({
    where: {
      type: OrderType.DELIVERY,
      status: OrderStatus.READY,
      deliveryDriverId: null,
      readyAt: { lte: new Date(now.getTime() - NOBODY_TOOK_MIN * 60 * 1000), gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
    },
    select: { id: true, restaurantId: true },
    take: 50,
  });
  const ids = new Set(waiting.map((order) => order.id));
  for (const id of delayWarned) if (!ids.has(id)) delayWarned.delete(id);
  for (const order of waiting) {
    if (delayWarned.has(order.id)) continue;
    delayWarned.add(order.id);
    const payload = {
      orderId: order.id,
      message: `El pedido #${order.id} lleva más de ${NOBODY_TOOK_MIN} min sin motorizado. GoEats ya está buscando uno.`,
    };
    io?.to(`restaurant-${order.restaurantId}`).to(`order-${order.id}`).to(ADMIN_ROOM).emit("delivery-delayed", payload);
  }
}

// A ready order nobody took in this time is cancelled: the food is no longer good to deliver
export const NO_DRIVER_LIMIT_MIN = 60;

// Ready orders still inside the limit (old ones without readyAt use their last change)
export function freshReadyWhere(now = new Date()) {
  const since = new Date(now.getTime() - NO_DRIVER_LIMIT_MIN * 60 * 1000);
  return { OR: [{ readyAt: { gt: since } }, { readyAt: null, updatedAt: { gt: since } }] };
}

export async function expireUnclaimedDeliveries(io: Server | undefined, now = new Date()) {
  const since = new Date(now.getTime() - NO_DRIVER_LIMIT_MIN * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: {
      type: OrderType.DELIVERY,
      status: OrderStatus.READY,
      deliveryDriverId: null,
      OR: [{ readyAt: { lte: since } }, { readyAt: null, updatedAt: { lte: since } }],
    },
    take: 50,
  });
  for (const order of expired) {
    await cancelOrderAndNotify(io, order, { by: "noDriver", reason: `pasó más de ${NO_DRIVER_LIMIT_MIN} min listo sin motorizado` });
  }
  return expired.length;
}

export function startDispatchWatcher(io: Server) {
  const timer = setInterval(() => {
    warnDelayedDeliveries(io).catch((error) => console.error("[Dispatch] Could not warn delayed orders:", error));
    alertUnassignedDeliveries(io).catch((error) => console.error("[Dispatch] Could not check unassigned orders:", error));
    expireUnclaimedDeliveries(io).catch((error) => console.error("[Dispatch] Could not expire old orders:", error));
  }, WATCH_EVERY_MS);
  timer.unref();
  return timer;
}

// Administrator: ready deliveries without a driver, with how long they have waited
export async function getUnassignedDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const orders = await prisma.order.findMany({
      where: { type: OrderType.DELIVERY, status: OrderStatus.READY, deliveryDriverId: null },
      orderBy: { readyAt: "asc" },
      take: 100,
      select: {
        id: true,
        readyAt: true,
        updatedAt: true,
        dispatchAlertAt: true,
        total: true,
        restaurant: { select: { id: true, name: true, phone: true } },
      },
    });
    return res.status(200).json({
      success: true,
      orders: orders.map((order) => {
        const since = order.readyAt ?? order.updatedAt;
        return {
          id: order.id,
          restaurant: order.restaurant,
          total: order.total,
          readyAt: since,
          waitingMinutes: Math.max(0, Math.floor((now.getTime() - since.getTime()) / 60000)),
          alerted: !!order.dispatchAlertAt,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
}
