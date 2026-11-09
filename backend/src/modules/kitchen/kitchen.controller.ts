import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderItemStatus, OrderStatus } from "@prisma/client";
import { canEditOrder, isTransferUnverified } from "../../utils/orderRules";

export async function getPendingKitchenItems(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { productionAreaId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const areaId = productionAreaId ? parseInt(productionAreaId as string, 10) : undefined;

    // Get order items that are not yet served, and their parent orders are not cancelled/delivered
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: {
            in: [OrderStatus.PREPARING, OrderStatus.READY],
          },
        },
        status: {
          in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING, OrderItemStatus.READY],
        },
        variant: areaId
          ? {
              menuItem: {
                productionAreaId: areaId,
              },
            }
          : undefined,
      },
      include: {
        preparedBy: { select: { id: true, name: true } },
        order: {
          include: {
            table: true,
            mozo: { select: { id: true, name: true } },
          },
        },
        variant: {
          include: {
            menuItem: {
              include: {
                productionArea: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ success: true, items: orderItems });
  } catch (error) {
    next(error);
  }
}

export async function updateItemStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { status } = req.body;

    if (isNaN(id) || !restaurantId || !status) {
      return res.status(400).json({ success: false, message: "Invalid inputs" });
    }

    if (!Object.values(OrderItemStatus).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid item status value" });
    }

    // Verify order item belongs to restaurant
    const orderItem = await prisma.orderItem.findFirst({
      where: { id, order: { restaurantId } },
      include: { order: { include: { items: true } } },
    });

    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    if (!canEditOrder(orderItem.order) || isTransferUnverified(orderItem.order)) {
      return res.status(409).json({ success: false, message: "Este pedido no está en cocina" });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // 1. Update item status
      // The first person who starts or finishes the dish is who prepared it
      const takesDish = status === OrderItemStatus.PREPARING || status === OrderItemStatus.READY;
      const item = await tx.orderItem.update({
        where: { id },
        data: {
          status,
          preparedById: takesDish && !orderItem.preparedById && req.user?.userId ? req.user.userId : undefined,
          // Kitchen history and times: when the dish was finished
          readyAt: status === OrderItemStatus.READY ? new Date() : status === OrderItemStatus.SERVED ? undefined : null,
        },
        include: {
          variant: {
            include: { menuItem: true },
          },
        },
      });

      // 2. Load all sibling items of the order to check if we need to auto-promote order status
      const order = await tx.order.findUnique({
        where: { id: orderItem.orderId },
        include: { items: true },
      });

      if (order) {
        const allItemsReady = order.items.every(
          (i) => i.status === OrderItemStatus.READY || i.status === OrderItemStatus.SERVED
        );

        let nextStatus: OrderStatus = order.status;
        if (allItemsReady) {
          nextStatus = OrderStatus.READY;
        } else if (order.status === OrderStatus.READY || status === OrderItemStatus.PREPARING) {
          nextStatus = OrderStatus.PREPARING;
        }

        // Only orders still in the kitchen move, whatever happened since the item was loaded
        if (nextStatus !== order.status) {
          await tx.order.updateMany({
            where: { id: order.id, status: order.status },
            data: { status: nextStatus, readyAt: nextStatus === OrderStatus.READY ? new Date() : null },
          });
        }
      }

      return item;
    });

    // Load full order to broadcast
    const freshOrder = await prisma.order.findUnique({
      where: { id: orderItem.orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { menuItem: true },
            },
          },
        },
        table: true,
      },
    });

    // Notify real-time clients (POS and Kitchen screens)
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurantId}`).emit("kitchen-item-status-updated", {
        item: updatedItem,
        order: freshOrder,
      });

      // If item was marked as READY, check order readiness to notify the waiter
      if (status === OrderItemStatus.READY && freshOrder && freshOrder.items) {
        const totalItems = freshOrder.items.length;
        const readyItems = freshOrder.items.filter(
          (i) => i.status === OrderItemStatus.READY || i.status === OrderItemStatus.SERVED
        ).length;
        const tableName = freshOrder.table ? `Mesa ${freshOrder.table.number}` : (freshOrder.type === "DINE_IN" ? "Mesa" : freshOrder.customerName);

        if (readyItems === totalItems) {
          // All items for this order are ready!
          const allReadyPayload = {
            restaurantId,
            type: "ALL_READY",
            orderId: freshOrder.id,
            tableId: freshOrder.tableId,
            tableNumber: freshOrder.table?.number,
            tableName,
            mozoId: freshOrder.mozoId,
            readyItems,
            totalItems,
            title: ` ¡${tableName} - Todos los Pedidos Listos!`,
            message: `¡Cocina ha terminado de preparar todos los platos de la ${tableName}! Ya pueden ser servidos.`,
            timestamp: new Date().toISOString(),
          };
          io.to(`restaurant-${restaurantId}`).emit("waiter-order-notification", allReadyPayload);
          console.log(`[KDS] Emitted ALL_READY notification for ${tableName}`);
        } else if (readyItems > 0 && readyItems < totalItems) {
          // Partially ready (almost ready)
          const almostReadyPayload = {
            restaurantId,
            type: "ALMOST_READY",
            orderId: freshOrder.id,
            tableId: freshOrder.tableId,
            tableNumber: freshOrder.table?.number,
            tableName,
            mozoId: freshOrder.mozoId,
            readyItems,
            totalItems,
            itemJustReady: updatedItem.variant.menuItem.name,
            title: ` ${tableName} - Pedido Casi Listo`,
            message: `El pedido de la ${tableName} está casi listo (${readyItems}/${totalItems} platos preparados). Plato listo: ${updatedItem.variant.menuItem.name}.`,
            timestamp: new Date().toISOString(),
          };
          io.to(`restaurant-${restaurantId}`).emit("waiter-order-notification", almostReadyPayload);
          console.log(`[KDS] Emitted ALMOST_READY notification for ${tableName}`);
        }
      }
    }

    return res.status(200).json({ success: true, message: `Item status updated to ${status}`, item: updatedItem, order: freshOrder });
  } catch (error) {
    next(error);
  }
}

export async function callWaiter(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(orderId) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid orderId or restaurant context" });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: {
        table: true,
        items: {
          include: {
            variant: { include: { menuItem: true } },
          },
        },
        mozo: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }

    const tableName = order.table ? `Mesa ${order.table.number}` : (order.type === "DINE_IN" ? "Mesa" : order.customerName);
    const readyItems = order.items.filter(
      (i) => i.status === OrderItemStatus.READY || i.status === OrderItemStatus.SERVED
    ).length;
    const totalItems = order.items.length;

    const io = req.app.get("io");
    if (io) {
      const notifPayload = {
        restaurantId,
        type: "CALL_WAITER",
        orderId: order.id,
        tableId: order.tableId,
        tableNumber: order.table?.number,
        tableName,
        mozoId: order.mozoId,
        readyItems,
        totalItems,
        title: ` ¡Llamada de Cocina - ${tableName}!`,
        message: `El cocinero solicita al mesero para retirar los pedidos de la ${tableName} (${readyItems}/${totalItems} platos listos).`,
        timestamp: new Date().toISOString(),
      };
      io.to(`restaurant-${restaurantId}`).emit("waiter-order-notification", notifPayload);
      console.log(`[KDS] Cook called waiter for ${tableName}`);
    }

    return res.status(200).json({
      success: true,
      message: `Llamada enviada al mesero para la ${tableName}`,
    });
  } catch (error) {
    next(error);
  }
}

const HISTORY_MAX_HOURS = 72;

// Dishes already finished, newest first, with who prepared them and how long they took
export async function getKitchenHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const requestedHours = Number(req.query.hours);
    const hours = Number.isFinite(requestedHours) && requestedHours > 0 ? Math.min(requestedHours, HISTORY_MAX_HOURS) : 12;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const items = await prisma.orderItem.findMany({
      where: {
        order: { restaurantId },
        status: { in: [OrderItemStatus.READY, OrderItemStatus.SERVED] },
        readyAt: { gte: since },
      },
      orderBy: { readyAt: "desc" },
      take: 300,
      select: {
        id: true,
        quantity: true,
        comments: true,
        status: true,
        createdAt: true,
        readyAt: true,
        preparedBy: { select: { id: true, name: true } },
        variant: { select: { name: true, menuItem: { select: { name: true } } } },
        order: { select: { id: true, type: true, customerName: true, table: { select: { number: true } } } },
      },
    });

    const rows = items.map((item) => {
      const minutes = item.readyAt ? Math.max(0, Math.round((item.readyAt.getTime() - item.createdAt.getTime()) / 60000)) : null;
      return {
        id: item.id,
        dish: item.variant.menuItem.name,
        variant: item.variant.name,
        quantity: item.quantity,
        comments: item.comments,
        status: item.status,
        orderedAt: item.createdAt,
        readyAt: item.readyAt,
        minutes,
        preparedBy: item.preparedBy?.name || null,
        orderId: item.order.id,
        place: item.order.table ? `Mesa ${item.order.table.number}` : item.order.type === "DELIVERY" ? "Domicilio" : item.order.type === "TAKEOUT" ? "Para llevar" : item.order.customerName,
      };
    });
    const timed = rows.filter((row) => row.minutes !== null).map((row) => row.minutes as number);
    const averageMinutes = timed.length ? Math.round(timed.reduce((sum, value) => sum + value, 0) / timed.length) : null;

    return res.status(200).json({ success: true, hours, averageMinutes, items: rows });
  } catch (error) {
    next(error);
  }
}

export async function getProductionAreas(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    const areas = await prisma.productionArea.findMany({
      where: { restaurantId },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ success: true, areas });
  } catch (error) {
    next(error);
  }
}
