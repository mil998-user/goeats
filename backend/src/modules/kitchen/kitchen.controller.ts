import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderItemStatus, OrderStatus } from "@prisma/client";

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
        order: {
          include: {
            table: true,
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

    const updatedItem = await prisma.$transaction(async (tx) => {
      // 1. Update item status
      const item = await tx.orderItem.update({
        where: { id },
        data: { status },
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
        // If the order was PENDING and we start preparing an item, change order status to PREPARING
        if (status === OrderItemStatus.PREPARING && order.status === OrderStatus.PENDING) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PREPARING },
          });
        }
        // If all items are READY or SERVED, mark order status as READY
        else {
          const allItemsReady = order.items.every(
            (i) => i.status === OrderItemStatus.READY || i.status === OrderItemStatus.SERVED
          );
          if (allItemsReady && order.status !== OrderStatus.READY) {
            await tx.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.READY },
            });
          }
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
          io.emit("waiter-order-notification", allReadyPayload);
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
          io.emit("waiter-order-notification", almostReadyPayload);
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
      io.emit("waiter-order-notification", notifPayload);
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
