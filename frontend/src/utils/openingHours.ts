// Horario semanal del restaurante.
// Se guarda como JSON en el mismo campo de texto "openingHours" (sin cambiar la base de datos).
// Si el campo tiene texto libre antiguo, se muestra tal cual y no se calcula abierto/cerrado.
// La misma logica existe en backend/src/utils/openingHours.ts: si cambias una, cambia la otra.

export interface DayHours {
  closed: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"; si es menor que open, cierra al dia siguiente
}

export interface WeeklyHours {
  v: 1;
  // 0 = domingo ... 6 = sabado
  days: DayHours[];
}

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TIME_ZONE = "America/Guayaquil";
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultWeek(): WeeklyHours {
  return { v: 1, days: Array.from({ length: 7 }, () => ({ closed: false, open: "09:00", close: "22:00" })) };
}

export function parseWeeklyHours(raw: string | null | undefined): WeeklyHours | null {
  if (!raw || raw.trim()[0] !== "{") return null;
  try {
    const data = JSON.parse(raw);
    if (data?.v !== 1 || !Array.isArray(data.days) || data.days.length !== 7) return null;
    const ok = data.days.every(
      (d: any) => typeof d?.closed === "boolean" && TIME_RE.test(d?.open) && TIME_RE.test(d?.close)
    );
    return ok ? (data as WeeklyHours) : null;
  } catch {
    return null;
  }
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Hora 12h para mostrar: "9:00 a.m."
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Dia de la semana y minuto del dia en la hora de Ecuador, sin importar la zona del telefono
function nowInEcuador(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const minute = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
  return { day, minute };
}

function isOpenAt(week: WeeklyHours, day: number, minute: number): DayHours | null {
  const today = week.days[day];
  if (!today.closed) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (c > o ? minute >= o && minute < c : minute >= o) return today;
  }
  // Turno de ayer que pasa la medianoche
  const yesterday = week.days[(day + 6) % 7];
  if (!yesterday.closed) {
    const o = toMinutes(yesterday.open);
    const c = toMinutes(yesterday.close);
    if (c <= o && minute < c) return yesterday;
  }
  return null;
}

export interface OpenStatus {
  isOpen: boolean;
  label: string;
}

export function getOpenStatus(week: WeeklyHours, now = new Date()): OpenStatus {
  const { day, minute } = nowInEcuador(now);
  const shift = isOpenAt(week, day, minute);
  if (shift) return { isOpen: true, label: `Abierto · cierra ${formatTime(shift.close)}` };

  // Proxima apertura en los siguientes 7 dias
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7;
    const info = week.days[d];
    if (info.closed) continue;
    if (i === 0 && toMinutes(info.open) <= minute) continue;
    const when = i === 0 ? "hoy" : i === 1 ? "mañana" : `el ${DAY_NAMES[d].toLowerCase()}`;
    return { isOpen: false, label: `Cerrado · abre ${when} ${formatTime(info.open)}` };
  }
  return { isOpen: false, label: "Cerrado por ahora" };
}

// Lineas para mostrar el horario agrupando dias iguales: "Lunes a Viernes: 9:00 a.m. - 10:00 p.m."
export function describeWeek(week: WeeklyHours): string[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const text = (d: DayHours) => (d.closed ? "Cerrado" : `${formatTime(d.open)} - ${formatTime(d.close)}`);
  const lines: string[] = [];
  let start = 0;
  for (let i = 1; i <= order.length; i++) {
    const prev = week.days[order[i - 1]];
    const cur = i < order.length ? week.days[order[i]] : null;
    if (!cur || text(cur) !== text(prev)) {
      const a = DAY_NAMES[order[start]];
      const b = DAY_NAMES[order[i - 1]];
      lines.push(`${start === i - 1 ? a : `${a} a ${b}`}: ${text(prev)}`);
      start = i;
    }
  }
  return lines;
}
