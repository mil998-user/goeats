import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";

// The owner picks whole days of Ecuador (UTC-5, no daylight saving).
// "2026-11-08" goes from 00:00 to 23:59:59.999 of that day there, whatever the server time zone
const ECUADOR_OFFSET = "-05:00";
const DAY_RE = /^d{4}-d{2}-d{2}$/;
function getReportRange(startDate: unknown, endDate: unknown) {
  const day = (value: unknown, time: string) =>
    typeof value === "string" && DAY_RE.test(value) ? new Date(`${value}T${time}${ECUADOR_OFFSET}`) : null;
  const start = day(startDate, "00:00:00.000") ?? new Date(0);
  const end = day(endDate, "23:59:59.999") ?? new Date();
  return { start, end };
}

export async function getDashboardData(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Sales last 7 days
    const salesLast7Days = await prisma.sale.findMany({
      where: {
        restaurantId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group sales by day of week
    const salesByDay = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay(); // 0 (Sun) - 6 (Sat)
      const dayName = d.toLocaleDateString("es-EC", { weekday: "short" });

      const total = salesLast7Days
        .filter((s) => s.createdAt.toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.total, 0);

      return {
        dayName,
        dayOfWeek,
        dateString: d.toLocaleDateString("es-EC"),
        total,
      };
    }).reverse();

    // 2. Load daily sales targets (goals)
    const targets = await prisma.salesTarget.findMany({
      where: { restaurantId },
    });

    const salesByDayWithTarget = salesByDay.map((day) => {
      const target = targets.find((t) => t.dayOfWeek === day.dayOfWeek);
      return {
        ...day,
        targetAmount: target ? target.targetAmount : 0.0,
      };
    });

    // 3. Key indicators (today's sales, active tables count, pending orders)
    const todaySales = salesLast7Days
      .filter((s) => s.createdAt.toDateString() === today.toDateString())
      .reduce((sum, s) => sum + s.total, 0);

    const activeTablesCount = await prisma.table.count({
      where: { diningArea: { restaurantId }, status: "OCCUPIED" },
    });

    const pendingOrdersCount = await prisma.order.count({
      where: { restaurantId, status: "PENDING" },
    });

    // 4. Top selling items today
    const orderItemsToday = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: today },
          status: { not: "CANCELLED" },
        },
      },
      include: {
        variant: {
          include: { menuItem: true },
        },
      },
    });

    const topItemsTodayMap = new Map<string, { name: string; quantity: number; total: number }>();
    for (const item of orderItemsToday) {
      const key = `${item.variantId}`;
      const name = `${item.variant.menuItem.name} (${item.variant.name})`;
      const existing = topItemsTodayMap.get(key) || { name, quantity: 0, total: 0 };
      topItemsTodayMap.set(key, {
        name,
        quantity: existing.quantity + item.quantity,
        total: existing.total + item.price * item.quantity,
      });
    }

    const topItemsToday = Array.from(topItemsTodayMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      dashboard: {
        salesHistory: salesByDayWithTarget,
        indicators: {
          todaySales,
          activeTables: activeTablesCount,
          pendingOrders: pendingOrdersCount,
        },
        topSellingToday: topItemsToday,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesReport(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { startDate, endDate } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const { start, end } = getReportRange(startDate, endDate);

    const sales = await prisma.sale.findMany({
      where: {
        restaurantId,
        createdAt: { gte: start, lte: end },
      },
      include: {
        client: true,
        docType: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + s.discount, 0);
    const totalTaxes = sales.reduce((sum, s) => sum + s.taxValue, 0);

    return res.status(200).json({
      success: true,
      summary: {
        count: sales.length,
        total: totalSales,
        discounts: totalDiscounts,
        taxes: totalTaxes,
      },
      sales,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductSalesReport(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { startDate, endDate } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const { start, end } = getReportRange(startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: start, lte: end },
          status: { not: "CANCELLED" },
        },
      },
      include: {
        variant: {
          include: { menuItem: true },
        },
      },
    });

    const productMap = new Map<string, { id: number; name: string; quantity: number; salesTotal: number }>();
    for (const item of orderItems) {
      const key = `${item.variantId}`;
      const name = `${item.variant.menuItem.name} (${item.variant.name})`;
      const existing = productMap.get(key) || { id: item.variantId, name, quantity: 0, salesTotal: 0 };
      productMap.set(key, {
        id: item.variantId,
        name,
        quantity: existing.quantity + item.quantity,
        salesTotal: existing.salesTotal + item.price * item.quantity,
      });
    }

    const products = Array.from(productMap.values()).sort((a, b) => b.salesTotal - a.salesTotal);

    return res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
}

export async function getWaiterReport(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { startDate, endDate } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const { start, end } = getReportRange(startDate, endDate);

    // Get DINE_IN orders grouped by mozo
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        type: OrderType.DINE_IN,
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      include: {
        mozo: { select: { id: true, name: true, role: true } },
      },
    });

    const mozoMap = new Map<string, { id: number; name: string; orderCount: number; salesTotal: number; tipsTotal: number }>();
    for (const order of orders) {
      if (!order.mozo) continue;
      const key = `${order.mozoId}`;
      const existing = mozoMap.get(key) || { id: order.mozo.id, name: order.mozo.name, orderCount: 0, salesTotal: 0, tipsTotal: 0 };
      mozoMap.set(key, {
        id: order.mozo.id,
        name: order.mozo.name,
        orderCount: existing.orderCount + 1,
        salesTotal: existing.salesTotal + order.total,
        // Tips charged at the register for this waiter's tables
        tipsTotal: Math.round((existing.tipsTotal + (order.tipAmount || 0)) * 100) / 100,
      });
    }

    const waiters = Array.from(mozoMap.values()).sort((a, b) => b.salesTotal - a.salesTotal);

    // Dishes each person prepared in the kitchen, in the same dates
    const prepared = await prisma.orderItem.groupBy({
      by: ["preparedById"],
      where: {
        preparedById: { not: null },
        order: { restaurantId, createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
      },
      _sum: { quantity: true },
    });
    const cookIds = prepared.map((row) => row.preparedById as number);
    const cookUsers = await prisma.user.findMany({
      where: { id: { in: cookIds }, restaurantId },
      select: { id: true, name: true },
    });
    const cooks = cookUsers
      .map((cook) => ({
        id: cook.id,
        name: cook.name,
        dishCount: prepared.find((row) => row.preparedById === cook.id)?._sum.quantity || 0,
      }))
      .sort((a, b) => b.dishCount - a.dishCount);

    return res.status(200).json({ success: true, waiters, cooks });
  } catch (error) {
    next(error);
  }
}
export enum OrderType {
  DINE_IN = "DINE_IN",
  TAKEOUT = "TAKEOUT",
  DELIVERY = "DELIVERY",
}
