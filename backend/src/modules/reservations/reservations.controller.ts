import { Request, Response, NextFunction } from "express";
import { RestaurantStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { canEncryptSecrets, decryptSecret, encryptSecret } from "../../utils/secrets";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
export const RESERVATION_MIN_AHEAD_MS = 30 * 60 * 1000; // At least 30 minutes ahead
export const RESERVATION_MAX_AHEAD_DAYS = 60;
export const RESERVATION_MAX_PEOPLE = 30;
const MAX_OPEN_PER_CUSTOMER = 3;
const OPEN_STATUSES = ["PENDING", "CONFIRMED"];
const STAFF_STATUSES = ["PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW"];
const PUBLIC_RESTAURANT = { isActive: true, status: { in: [RestaurantStatus.APPROVED, RestaurantStatus.ACTIVE] } };

// The phone is personal data: stored encrypted whenever the key is configured
const protectPhone = (phone: string) => (canEncryptSecrets() ? encryptSecret(phone) : phone);
const readPhone = (stored: string) => {
  try {
    return decryptSecret(stored);
  } catch {
    return "";
  }
};

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

interface ReservationInput {
  name: string;
  phone: string;
  people: number;
  reservedAt: Date;
  notes: string | null;
}

export function readReservation(body: Record<string, unknown>, now = new Date()): { error: string } | ReservationInput {
  const name = cleanText(body.name, 120);
  if (name.length < 2) return { error: "Escribe el nombre para la reserva." };

  const phone = cleanText(body.phone, 20);
  if (!/^\+?\d[\d ()-]{6,19}$/.test(phone)) return { error: "Escribe un teléfono válido." };

  const people = typeof body.people === "string" ? Number(body.people) : body.people;
  if (typeof people !== "number" || !Number.isInteger(people) || people < 1 || people > RESERVATION_MAX_PEOPLE) {
    return { error: `La reserva puede ser de 1 a ${RESERVATION_MAX_PEOPLE} personas.` };
  }

  if (typeof body.reservedAt !== "string" || body.reservedAt.length > 40) {
    return { error: "Elige la fecha y la hora." };
  }
  const reservedAt = new Date(body.reservedAt);
  if (Number.isNaN(reservedAt.getTime())) return { error: "La fecha no es válida." };
  if (reservedAt.getTime() < now.getTime() + RESERVATION_MIN_AHEAD_MS) {
    return { error: "Reserva con al menos 30 minutos de anticipación." };
  }
  if (reservedAt.getTime() > now.getTime() + RESERVATION_MAX_AHEAD_DAYS * DAY_MS) {
    return { error: `Se puede reservar hasta ${RESERVATION_MAX_AHEAD_DAYS} días antes.` };
  }

  const notes = cleanText(body.notes, 300) || null;
  return { name, phone, people, reservedAt, notes };
}

const staffView = (reservation: {
  id: number;
  name: string;
  phone: string;
  people: number;
  reservedAt: Date;
  notes: string | null;
  status: string;
  createdAt: Date;
  customerId: number | null;
  table: { id: number; number: string } | null;
}) => ({
  id: reservation.id,
  name: reservation.name,
  phone: readPhone(reservation.phone),
  people: reservation.people,
  reservedAt: reservation.reservedAt,
  notes: reservation.notes,
  status: reservation.status,
  createdAt: reservation.createdAt,
  fromApp: reservation.customerId !== null,
  table: reservation.table,
});

function notifyRestaurant(req: Request, restaurantId: number, reservationId: number) {
  const io = req.app.get("io");
  if (io) io.to(`restaurant-${restaurantId}`).emit("reservation-updated", { reservationId });
}

// Customer, from the restaurant page
export async function createCustomerReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.userId;
    if (!customerId) return res.status(401).json({ success: false, message: "Inicia sesión para reservar." });

    const restaurant = await prisma.restaurant.findFirst({
      where: { slug: String(req.params.slug || "").toLowerCase().trim(), ...PUBLIC_RESTAURANT },
      select: { id: true, name: true, reservationsEnabled: true },
    });
    if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado." });
    if (!restaurant.reservationsEnabled) {
      return res.status(400).json({ success: false, message: "Este restaurante no recibe reservas por ahora." });
    }

    const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { name: true, phone: true } });
    const input = readReservation({
      ...req.body,
      name: req.body?.name || customer?.name,
      phone: req.body?.phone || customer?.phone,
    });
    if ("error" in input) return res.status(400).json({ success: false, message: input.error });

    const open = await prisma.reservation.count({
      where: { customerId, restaurantId: restaurant.id, status: { in: OPEN_STATUSES }, reservedAt: { gt: new Date() } },
    });
    if (open >= MAX_OPEN_PER_CUSTOMER) {
      return res.status(400).json({
        success: false,
        message: `Ya tienes ${MAX_OPEN_PER_CUSTOMER} reservas pendientes en este restaurante.`,
      });
    }

    const reservation = await prisma.reservation.create({
      data: { ...input, phone: protectPhone(input.phone), customerId, restaurantId: restaurant.id },
      select: { id: true, people: true, reservedAt: true, status: true },
    });
    notifyRestaurant(req, restaurant.id, reservation.id);

    return res.status(201).json({
      success: true,
      message: "Reserva enviada. El restaurante la confirmará.",
      reservation: { ...reservation, restaurantName: restaurant.name },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.userId;
    const reservations = await prisma.reservation.findMany({
      where: { customerId, reservedAt: { gt: new Date(Date.now() - 30 * DAY_MS) } },
      orderBy: { reservedAt: "desc" },
      take: 50,
      select: {
        id: true,
        people: true,
        reservedAt: true,
        notes: true,
        status: true,
        restaurant: { select: { name: true, slug: true } },
        table: { select: { number: true } },
      },
    });
    return res.status(200).json({ success: true, reservations });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.userId;
    const id = parseInt(req.params.id, 10);
    const reservation = await prisma.reservation.findFirst({ where: { id, customerId } });
    if (!reservation) return res.status(404).json({ success: false, message: "Reserva no encontrada." });
    if (!OPEN_STATUSES.includes(reservation.status)) {
      return res.status(400).json({ success: false, message: "Esta reserva ya no se puede cancelar." });
    }
    await prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" } });
    notifyRestaurant(req, reservation.restaurantId, id);
    return res.status(200).json({ success: true, message: "Reserva cancelada." });
  } catch (error) {
    next(error);
  }
}

// Staff: reservations of their restaurant, by default from 6 hours ago onwards
export async function getRestaurantReservations(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) return res.status(400).json({ success: false, message: "Restaurante no encontrado." });

    const fromQuery = typeof req.query.from === "string" ? new Date(req.query.from) : null;
    const toQuery = typeof req.query.to === "string" ? new Date(req.query.to) : null;
    const from = fromQuery && !Number.isNaN(fromQuery.getTime()) ? fromQuery : new Date(Date.now() - 6 * HOUR_MS);
    const to =
      toQuery && !Number.isNaN(toQuery.getTime()) ? toQuery : new Date(Date.now() + RESERVATION_MAX_AHEAD_DAYS * DAY_MS);

    const reservations = await prisma.reservation.findMany({
      where: { restaurantId, reservedAt: { gte: from, lte: to } },
      orderBy: { reservedAt: "asc" },
      take: 300,
      include: { table: { select: { id: true, number: true } } },
    });
    return res.status(200).json({ success: true, reservations: reservations.map(staffView) });
  } catch (error) {
    next(error);
  }
}

// Staff: a reservation taken by phone or in person
export async function createStaffReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) return res.status(400).json({ success: false, message: "Restaurante no encontrado." });
    const input = readReservation(req.body || {});
    if ("error" in input) return res.status(400).json({ success: false, message: input.error });

    const tableId = await readTable(req.body?.tableId, restaurantId);
    if (tableId === false) return res.status(400).json({ success: false, message: "La mesa no es de este restaurante." });

    const reservation = await prisma.reservation.create({
      data: { ...input, phone: protectPhone(input.phone), restaurantId, tableId, status: "CONFIRMED" },
      include: { table: { select: { id: true, number: true } } },
    });
    notifyRestaurant(req, restaurantId, reservation.id);
    return res.status(201).json({ success: true, message: "Reserva registrada.", reservation: staffView(reservation) });
  } catch (error) {
    next(error);
  }
}

// null: no table; false: a table of another restaurant
async function readTable(value: unknown, restaurantId: number): Promise<number | null | false> {
  if (value === undefined || value === null || value === "") return null;
  const tableId = Number(value);
  if (!Number.isInteger(tableId)) return false;
  const table = await prisma.table.findFirst({ where: { id: tableId, diningArea: { restaurantId } }, select: { id: true } });
  return table ? table.id : false;
}

// Staff: confirm, assign a table, seat, cancel or mark as no-show
export async function updateReservation(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const id = parseInt(req.params.id, 10);
    const reservation = await prisma.reservation.findFirst({ where: { id, restaurantId } });
    if (!reservation) return res.status(404).json({ success: false, message: "Reserva no encontrada." });

    const data: { status?: string; tableId?: number | null } = {};
    if (req.body?.status !== undefined) {
      if (!STAFF_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Estado de reserva no válido." });
      }
      data.status = req.body.status;
    }
    if (req.body?.tableId !== undefined) {
      const tableId = await readTable(req.body.tableId, restaurantId as number);
      if (tableId === false) return res.status(400).json({ success: false, message: "La mesa no es de este restaurante." });
      data.tableId = tableId;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "Nada que cambiar." });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data,
      include: { table: { select: { id: true, number: true } } },
    });
    notifyRestaurant(req, restaurantId as number, id);
    return res.status(200).json({ success: true, message: "Reserva actualizada.", reservation: staffView(updated) });
  } catch (error) {
    next(error);
  }
}
