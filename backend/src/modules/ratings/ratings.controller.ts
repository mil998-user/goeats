import { Request, Response, NextFunction } from "express";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/database";

const COMMENT_MAX = 500;

// Whole stars from 1 to 5; anything else is rejected
export function readStars(value: unknown): number | null {
  const stars = typeof value === "string" ? Number(value) : value;
  if (typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) return null;
  return stars;
}

// Plain text only: control characters out and a fixed length
function readComment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, COMMENT_MAX);
  return clean || null;
}

const roundAverage = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

export async function getRestaurantAverages(restaurantIds: number[]) {
  if (restaurantIds.length === 0) return new Map<number, { average: number | null; count: number }>();
  const rows = await prisma.orderRating.groupBy({
    by: ["restaurantId"],
    where: { restaurantId: { in: restaurantIds }, restaurantStars: { not: null } },
    _avg: { restaurantStars: true },
    _count: { restaurantStars: true },
  });
  return new Map(
    rows.map((row) => [row.restaurantId, { average: roundAverage(row._avg.restaurantStars), count: row._count.restaurantStars }])
  );
}

export async function getDriverAverages(driverIds: number[]) {
  if (driverIds.length === 0) return new Map<number, { average: number | null; count: number }>();
  const rows = await prisma.orderRating.groupBy({
    by: ["driverId"],
    where: { driverId: { in: driverIds }, driverStars: { not: null } },
    _avg: { driverStars: true },
    _count: { driverStars: true },
  });
  return new Map(
    rows
      .filter((row) => row.driverId !== null)
      .map((row) => [row.driverId as number, { average: roundAverage(row._avg.driverStars), count: row._count.driverStars }])
  );
}

// The customer rates the restaurant and, for a delivery, the driver. Once per order
export async function rateOrderAsCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const customerId = req.user?.userId;
    if (!customerId || isNaN(orderId)) {
      return res.status(400).json({ success: false, message: "Pedido no válido." });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId },
      select: { id: true, status: true, restaurantId: true, deliveryDriverId: true, rating: true },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado." });
    }
    if (order.status !== OrderStatus.DELIVERED) {
      return res.status(400).json({ success: false, message: "Puedes calificar cuando el pedido haya sido entregado." });
    }
    if (order.rating?.restaurantStars) {
      return res.status(409).json({ success: false, message: "Ya calificaste este pedido." });
    }

    const restaurantStars = readStars(req.body?.restaurantStars);
    if (!restaurantStars) {
      return res.status(400).json({ success: false, message: "Elige de 1 a 5 estrellas para el restaurante." });
    }

    let driverStars: number | null = null;
    if (order.deliveryDriverId) {
      if (req.body?.driverStars !== undefined && req.body?.driverStars !== null && req.body?.driverStars !== "") {
        driverStars = readStars(req.body.driverStars);
        if (!driverStars) {
          return res.status(400).json({ success: false, message: "Elige de 1 a 5 estrellas para el motorizado." });
        }
      }
    }

    const comment = readComment(req.body?.comment);
    const data = {
      restaurantStars,
      driverStars,
      comment,
      customerId,
      driverId: order.deliveryDriverId,
      restaurantId: order.restaurantId,
    };

    const rating = await prisma.orderRating.upsert({
      where: { orderId },
      create: { orderId, ...data },
      update: data,
      select: { orderId: true, restaurantStars: true, driverStars: true, comment: true },
    });

    return res.status(201).json({ success: true, message: "¡Gracias por tu calificación!", rating });
  } catch (error) {
    next(error);
  }
}

// The driver rates the customer after delivering. Once per order
export async function rateCustomerAsDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const driverId = req.user?.userId;
    if (!driverId || isNaN(orderId)) {
      return res.status(400).json({ success: false, message: "Pedido no válido." });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, deliveryDriverId: driverId, status: OrderStatus.DELIVERED },
      select: { id: true, restaurantId: true, customerId: true, rating: true },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido entregado no encontrado." });
    }
    if (!order.customerId) {
      return res.status(400).json({ success: false, message: "Este pedido no tiene una cuenta de cliente para calificar." });
    }
    if (order.rating?.customerStars) {
      return res.status(409).json({ success: false, message: "Ya calificaste a este cliente." });
    }

    const customerStars = readStars(req.body?.stars);
    if (!customerStars) {
      return res.status(400).json({ success: false, message: "Elige de 1 a 5 estrellas." });
    }

    const now = new Date();
    await prisma.orderRating.upsert({
      where: { orderId },
      create: {
        orderId,
        restaurantId: order.restaurantId,
        customerId: order.customerId,
        driverId,
        customerStars,
        customerRatedAt: now,
      },
      update: { customerStars, customerRatedAt: now },
    });

    return res.status(201).json({ success: true, message: "Calificación guardada." });
  } catch (error) {
    next(error);
  }
}

// Owner and staff: average and latest comments of their own restaurant
export async function getMyRestaurantRatings(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurante no encontrado." });
    }

    const averages = await getRestaurantAverages([restaurantId]);
    const latest = await prisma.orderRating.findMany({
      where: { restaurantId, restaurantStars: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 30,
      // Only the customer's first name, no contact data
      select: { orderId: true, restaurantStars: true, comment: true, createdAt: true, customer: { select: { name: true } } },
    });

    return res.status(200).json({
      success: true,
      average: averages.get(restaurantId)?.average ?? null,
      count: averages.get(restaurantId)?.count ?? 0,
      ratings: latest.map((rating) => ({
        orderId: rating.orderId,
        stars: rating.restaurantStars,
        comment: rating.comment,
        createdAt: rating.createdAt,
        customerName: (rating.customer?.name || "Cliente").split(" ")[0],
      })),
    });
  } catch (error) {
    next(error);
  }
}

// Driver: own average, without the customers' comments
export async function getMyDriverRating(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = req.user?.userId;
    if (!driverId) return res.status(401).json({ success: false, message: "Sesión no válida." });
    const averages = await getDriverAverages([driverId]);
    return res.status(200).json({
      success: true,
      average: averages.get(driverId)?.average ?? null,
      count: averages.get(driverId)?.count ?? 0,
    });
  } catch (error) {
    next(error);
  }
}
