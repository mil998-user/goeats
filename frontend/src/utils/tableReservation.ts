// Next reservations of a table, as sent by /tables/dining-areas (no phone, only what the floor staff needs)
export interface TableReservation {
  id: number;
  name: string;
  people: number;
  reservedAt: string;
  status: "PENDING" | "CONFIRMED";
}

// From 2 hours before, the table itself is marked as reserved and opening it asks first
export const RESERVED_SOON_MS = 2 * 60 * 60 * 1000;

// Same limit as the server: one hour late, the reservation no longer holds the table
const LATE_MS = 60 * 60 * 1000;

export function getReservedSoon(reservations: TableReservation[] | undefined, now = Date.now()) {
  return (
    (reservations || []).find((r) => {
      const left = new Date(r.reservedAt).getTime() - now;
      return r.status === "CONFIRMED" && left <= RESERVED_SOON_MS && left >= -LATE_MS;
    }) || null
  );
}

// What the table shows: the one holding it now, or else the next one
export function getShownReservation(reservations: TableReservation[] | undefined, now = Date.now()) {
  const current = (reservations || []).filter((r) => now - new Date(r.reservedAt).getTime() <= LATE_MS);
  return getReservedSoon(current, now) || current[0] || null;
}

export function reservationWhen(iso: string, now = new Date()) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date.toDateString() === now.toDateString()) return `Hoy ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Mañana ${time}`;
  return `${date.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })} ${time}`;
}

export const reservationPeople = (people: number) => (people === 1 ? "1 persona" : `${people} personas`);
