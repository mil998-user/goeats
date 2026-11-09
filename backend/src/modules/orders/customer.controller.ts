import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";

// 1. Get order history for the logged-in customer
export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      // Driver pay and commissions are internal; the receipt image is heavy and the customer already has it
      omit: {
        providerPayAmount: true,
        driverEarnings: true,
        appCommissionFromProvider: true,
        paymentReceipt: true,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            address: true,
            phone: true,
            mapLatitude: true,
            mapLongitude: true,
          },
        },
        items: {
          include: {
            variant: {
              include: {
                menuItem: { select: { id: true, name: true } },
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            number: true,
          },
        },
        deliveryDriver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        // What the customer already rated; the driver rating of the customer stays internal
        rating: { select: { restaurantStars: true, driverStars: true, comment: true } },
      },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
}

// 2. Get stats for the customer
export async function getCustomerStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get all non-cancelled orders for stats
    const orders = await prisma.order.findMany({
      where: {
        customerId: userId,
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
        restaurantId: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

    // Calculate favorite restaurant
    const restCounts: Record<number, { count: number; name: string }> = {};
    orders.forEach((o) => {
      if (!restCounts[o.restaurantId]) {
        restCounts[o.restaurantId] = { count: 0, name: o.restaurant.name };
      }
      restCounts[o.restaurantId].count++;
    });

    let favoriteRestaurant = "Ninguno";
    let maxCount = 0;
    for (const key in restCounts) {
      if (restCounts[key].count > maxCount) {
        maxCount = restCounts[key].count;
        favoriteRestaurant = restCounts[key].name;
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        favoriteRestaurant,
      },
    });
  } catch (error) {
    next(error);
  }
}

// 3. Toggle GoEats Plus subscription status
export async function togglePlusSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Plus is only activated through a paid plan, this route can only cancel it
    if (!user.isPlus) {
      return res.status(403).json({ success: false, message: "Para activar Plus debes comprar un plan." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isPlus: false },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isPlus: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Has cancelado tu suscripción a GoEats Plus.",
      isPlus: updatedUser.isPlus,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}
