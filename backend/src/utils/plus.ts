import { prisma } from "../config/database";

// Plus lasts what the plan paid for (engineers' answer pending; provisional, 25 nov):
// monthly 1 month, six-monthly 6, yearly 12. Plus given by hand by the administrator has no end.
export function planMonths(plan: { planName: string; period?: string | null }) {
  const text = `${plan.period || ""} ${plan.planName}`.toLowerCase();
  if (/anual|año|12/.test(text)) return 12;
  if (/semestral|6 meses|seis/.test(text)) return 6;
  if (/trimestral|3 meses/.test(text)) return 3;
  return 1;
}

export function addMonths(date: Date, months: number) {
  const end = new Date(date);
  end.setMonth(end.getMonth() + months);
  return end;
}

// When the Plus of this customer ends, or null when it has no end (or the customer has no Plus)
export async function getPlusEnd(userId: number) {
  const last = await prisma.saaSOrder.findFirst({
    where: { userId, type: "PLUS_SUBSCRIPTION", status: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    select: { planName: true, updatedAt: true },
  });
  if (!last) return null;
  const plan = await prisma.saaSPlan.findFirst({ where: { name: last.planName }, select: { period: true } });
  return addMonths(last.updatedAt, planMonths({ planName: last.planName, period: plan?.period }));
}

// Switches Plus off when its time is over. Returns true when it was switched off
export async function expirePlusIfDue(userId: number, now = new Date()) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPlus: true } });
  if (!user?.isPlus) return false;
  const end = await getPlusEnd(userId);
  if (!end || end.getTime() > now.getTime()) return false;
  await prisma.user.updateMany({ where: { id: userId, isPlus: true }, data: { isPlus: false } });
  return true;
}

// Every hour, all the customers whose Plus is over
export function startPlusWatcher() {
  const run = async () => {
    const users = await prisma.user.findMany({ where: { isPlus: true, role: "CUSTOMER" }, select: { id: true }, take: 2000 });
    for (const user of users) await expirePlusIfDue(user.id);
  };
  run().catch((error) => console.error("[Plus] Could not check expired plans:", error));
  const timer = setInterval(() => run().catch((error) => console.error("[Plus] Could not check expired plans:", error)), 60 * 60 * 1000);
  timer.unref();
  return timer;
}
