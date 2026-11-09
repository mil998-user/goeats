import { getEffectivePrice } from "../../utils/promotions";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderType, OrderStatus, OrderItemStatus, Prisma, Role } from "@prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { parseAmount } from "../../utils/validation";
import { canEditOrder, getCancelError, getStatusChangeError, hideDeliveryPin, isOrderPaid } from "../../utils/orderRules";
import { refundTakeCommission } from "../delivery/deliveryWallet";
import { OPEN_TABLE_STATUSES, releaseTable, resolveOrderTable } from "../../utils/tables";


export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }

    const { type, tableId, customerName, comments, items, deliveryAddress, deliveryReference, deliveryObservation, deliveryPhone, shippingCost } = req.body;

    if (!type || !customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Type, customerName, and non-empty items are required" });
    }

    if (!Object.values(OrderType).includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid order type" });
    }

    const costEnvio = type === OrderType.DELIVERY ? parseAmount(shippingCost ?? 0, { allowZero: true }) : 0;
    if (costEnvio === null) {
      return res.status(400).json({ success: false, message: "Costo de envío no válido" });
    }

    // Restaurants that charge first leave table orders waiting for the register
    const settings = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { payBeforeEating: true } });
    const startStatus = type === OrderType.DINE_IN && settings?.payBeforeEating ? OrderStatus.PENDING : OrderStatus.PREPARING;

    // Run transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Calculate total and validate items
      let calculatedTotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const variantId = parseInt(item.variantId, 10);
        const quantity = parseFloat(item.quantity);

        if (isNaN(quantity) || quantity <= 0) {
          throw new Error("Item quantity must be a positive number greater than 0");
        }

        const variant = await tx.menuItemVariant.findFirst({
          where: { id: variantId, menuItem: { isActive: true, category: { restaurantId } } },
        });

        if (!variant) {
          throw new Error("Uno de los platos ya no está disponible. Actualiza el menú e inténtalo de nuevo.");
        }

        // The server charges the promotion while it lasts
        const price = getEffectivePrice(variant);
        const subtotal = price * quantity;
        calculatedTotal += subtotal;

        orderItemsData.push({
          variantId,
          quantity,
          price,
          comments: item.comments || null,
          status: OrderItemStatus.PENDING,
        });
      }

      // 2. Dine-in table handling. A joined table sends the order to the main table of the group
      let orderTableId: number | null = null;
      if (type === OrderType.DINE_IN && tableId) {
        const parsedTableId = parseInt(tableId, 10);
        orderTableId = await resolveOrderTable(tx, parsedTableId, restaurantId);

        if (!orderTableId) {
          throw new Error(`Table ID ${parsedTableId} not found`);
        }

        // Set table status to occupied
        await tx.table.update({
          where: { id: orderTableId },
          data: { status: "OCCUPIED" },
        });
      }

      // 3. Create the order
      const newOrder = await tx.order.create({
        data: {
          type,
          status: startStatus,
          tableId: orderTableId,
          mozoId: userId,
          customerName,
          comments,
          shippingCost: costEnvio,
          total: calculatedTotal + costEnvio,
          deliveryAddress: type === OrderType.DELIVERY 
            ? (deliveryReference && !deliveryAddress?.includes("Ref:") ? `${deliveryAddress} (Ref: ${deliveryReference})` : deliveryAddress)
            : null,
          deliveryObservation: type === OrderType.DELIVERY 
            ? (deliveryReference || deliveryObservation || null)
            : null,
          deliveryPhone: type === OrderType.DELIVERY ? deliveryPhone : null,
          restaurantId,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { menuItem: true },
              },
            },
          },
          table: true,
          mozo: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return newOrder;
    });

    // Send real-time Socket notification to kitchen and cashiers
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurantId}`).emit("new-order", hideDeliveryPin(order));
      console.log(`[Socket] Emitted new-order for restaurant-${restaurantId}`);
    }

    return res.status(201).json({ success: true, message: "Order created successfully", order: hideDeliveryPin(order) });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to create order" });
  }
}

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { status, type } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: status ? (status as OrderStatus) : undefined,
        type: type ? (type as OrderType) : undefined,
      },
      include: {
        items: {
          include: {
            variant: {
              include: { menuItem: true },
            },
            preparedBy: { select: { id: true, name: true } },
          },
        },
        table: true,
        mozo: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, orders: orders.map(hideDeliveryPin) });
  } catch (error) {
    next(error);
  }
}

// Only the customer of an order from this restaurant, never a free search across all platform users
export async function getBillingCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
      select: {
        customer: { select: { name: true, cedula: true, email: true, phone: true, deliveryAddress: true } },
      },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado" });
    }

    const customer = order.customer;
    if (!customer?.cedula) {
      return res.json({ success: true, customer: null });
    }
    return res.json({
      success: true,
      customer: {
        name: customer.name,
        typeId: customer.cedula.length === 13 ? "04" : "05",
        identification: customer.cedula,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.deliveryAddress || "",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
      include: {
        items: {
          include: {
            variant: {
              include: { menuItem: true },
            },
            preparedBy: { select: { id: true, name: true } },
          },
        },
        table: true,
        mozo: {
          select: { id: true, name: true, role: true },
        },
        sale: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order: hideDeliveryPin(order) });
  } catch (error) {
    next(error);
  }
}

// Cancels the order, frees its table and gives back what the driver paid to take it
async function cancelOrderAndNotify(
  req: Request,
  order: { id: number; type: OrderType; status: OrderStatus; tableId: number | null; deliveryDriverId: number | null; paymentStatus: string; payphoneTransactionId: string | null },
  rejectedPayment = false
) {
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: rejectedPayment ? "REJECTED" : isOrderPaid(order) ? "REFUND_PENDING" : order.paymentStatus,
      },
    });
    if (claimed.count === 0) return null;

    if (order.type === OrderType.DINE_IN && order.tableId) {
      await releaseTable(tx, order.tableId, order.id);
    }

    if (order.status === OrderStatus.DELIVERING && order.deliveryDriverId) {
      await refundTakeCommission(tx, order.id, order.deliveryDriverId, `Devolución por cancelación de Pedido #${order.id}`);
    }

    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        table: true,
        items: { include: { variant: { include: { menuItem: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  });

  if (!updatedOrder) return null;

  const safeOrder = hideDeliveryPin(updatedOrder);
  const io = req.app.get("io");
  if (io) {
    io.to(`restaurant-${updatedOrder.restaurantId}`).to(`order-${order.id}`).emit("order-cancelled", safeOrder);
    io.to(`restaurant-${updatedOrder.restaurantId}`).to(`order-${order.id}`).emit("order-status-updated", safeOrder);
  }

  if (updatedOrder.customer?.email) {
    NotificationService.notifyOrderCancelled(
      { id: order.id },
      { id: updatedOrder.customer.id, name: updatedOrder.customer.name, email: updatedOrder.customer.email },
      req.body?.cancelReason
    ).catch((e) => console.warn("[Email] Error order cancelled notification:", e));
  }

  return safeOrder;
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { status, paymentStatus } = req.body;

    if (isNaN(id) || !restaurantId || !status) {
      return res.status(400).json({ success: false, message: "Invalid inputs" });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
      include: { sale: { select: { id: true } }, restaurant: { select: { payBeforeEating: true } } },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const statusError = getStatusChangeError(
      order,
      status,
      req.user?.role as Role | undefined,
      paymentStatus,
      order.restaurant.payBeforeEating
    );
    if (statusError) {
      return res.status(statusError.code).json({ success: false, message: statusError.message });
    }

    if (status === OrderStatus.CANCELLED) {
      const cancelError = getCancelError(order, !!order.sale);
      if (cancelError) {
        return res.status(409).json({ success: false, message: cancelError });
      }

      const cancelledOrder = await cancelOrderAndNotify(req, order, paymentStatus === "REJECTED");
      if (!cancelledOrder) {
        return res.status(409).json({ success: false, message: "El pedido cambió. Revísalo e intenta de nuevo." });
      }
      return res.status(200).json({ success: true, message: "Pedido cancelado", order: cancelledOrder });
    }

    const updateData: Prisma.OrderUncheckedUpdateManyInput = { status };
    // Starts the timer that offers a delivery to the nearest drivers first
    if (status === OrderStatus.READY) {
      updateData.readyAt = new Date();
    }
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    // A QR order gets the first waiter who handles it
    if (!order.mozoId && req.user?.role === Role.MOZO) {
      updateData.mozoId = req.user.userId;
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({ where: { id, status: order.status }, data: updateData });
      if (claimed.count === 0) return null;

      if (status === OrderStatus.READY) {
        // Whoever closes the whole order in the kitchen prepared the dishes nobody had taken
        if (req.user?.userId) {
          await tx.orderItem.updateMany({
            where: { orderId: id, preparedById: null, status: { in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING] } },
            data: { preparedById: req.user.userId },
          });
        }
        await tx.orderItem.updateMany({
          where: { orderId: id, status: { in: [OrderItemStatus.PENDING, OrderItemStatus.PREPARING] } },
          data: { status: OrderItemStatus.READY, readyAt: new Date() },
        });
      }

      if (status === OrderStatus.DELIVERED && order.type === OrderType.DINE_IN && order.tableId) {
        await releaseTable(tx, order.tableId, order.id);
      }

      return tx.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              variant: {
                include: { menuItem: true },
              },
            },
          },
          table: true,
          customer: { select: { id: true, name: true, email: true } },
          restaurant: { select: { id: true, name: true } },
        },
      });
    });

    if (!updatedOrder) {
      return res.status(409).json({ success: false, message: "El pedido cambió. Revísalo e intenta de nuevo." });
    }

    const safeOrder = hideDeliveryPin(updatedOrder);

    // Notify kitchen/front-desk
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurantId}`).to(`order-${id}`).emit("order-status-updated", safeOrder);
    }

    // Disparar correos al cliente según cambio de estado (Sección 2 del Plan)
    if (updatedOrder.customer?.email) {
      if (status === OrderStatus.PREPARING) {
        NotificationService.notifyOrderPreparing(
          { id: updatedOrder.id, restaurant: { name: updatedOrder.restaurant.name } },
          { id: updatedOrder.customer.id, name: updatedOrder.customer.name, email: updatedOrder.customer.email }
        ).catch((e) => console.warn("[Email] Error order preparing notification:", e));
      }
    }

    return res.status(200).json({ success: true, message: `Order status updated to ${status}`, order: safeOrder });
  } catch (error) {
    next(error);
  }
}

export async function changeTable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const parsedNewTableId = parseInt(req.body?.newTableId, 10);

    if (isNaN(id) || !restaurantId || isNaN(parsedNewTableId)) {
      return res.status(400).json({ success: false, message: "Elige la mesa nueva." });
    }

    const order = await prisma.order.findFirst({
      where: { id, restaurantId, type: OrderType.DINE_IN, status: { in: OPEN_TABLE_STATUSES } },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Pedido de mesa abierto no encontrado." });
    }
    if (order.tableId === parsedNewTableId) {
      return res.status(400).json({ success: false, message: "El pedido ya está en esa mesa." });
    }

    const newTable = await prisma.table.findFirst({
      where: { id: parsedNewTableId, diningArea: { restaurantId } },
    });
    if (!newTable) {
      return res.status(404).json({ success: false, message: "Mesa no encontrada en este restaurante." });
    }
    if (newTable.joinedToId) {
      return res.status(400).json({ success: false, message: "Esa mesa está unida a otra. Elige la mesa principal del grupo." });
    }
    if (newTable.status === "OCCUPIED") {
      return res.status(400).json({ success: false, message: "Esa mesa está ocupada. Para juntar los pedidos, une las mesas." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { tableId: parsedNewTableId } });
      await tx.table.update({ where: { id: parsedNewTableId }, data: { status: "OCCUPIED" } });
      if (order.tableId) {
        await releaseTable(tx, order.tableId);
      }
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { table: true, items: true },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurantId}`).emit("order-table-changed", hideDeliveryPin(updatedOrder!));
    }

    return res.status(200).json({ success: true, message: `Pedido cambiado a la mesa ${newTable.number}.`, order: hideDeliveryPin(updatedOrder!) });
  } catch (error) {
    next(error);
  }
}

// A waiter takes a QR order that nobody is attending yet
export async function attendOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;
    if (isNaN(id) || !restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Invalid inputs" });
    }

    const claimed = await prisma.order.updateMany({
      where: { id, restaurantId, mozoId: null, status: { notIn: [OrderStatus.CANCELLED, OrderStatus.DELIVERED] } },
      data: { mozoId: userId },
    });
    if (claimed.count === 0) {
      const exists = await prisma.order.findFirst({ where: { id, restaurantId }, select: { id: true } });
      return exists
        ? res.status(409).json({ success: false, message: "Este pedido ya tiene mesero o ya terminó." })
        : res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { variant: { include: { menuItem: true } }, preparedBy: { select: { id: true, name: true } } } },
        table: true,
        mozo: { select: { id: true, name: true, role: true } },
      },
    });
    const io = req.app.get("io");
    if (io && order) {
      io.to(`restaurant-${restaurantId}`).emit("order-status-updated", hideDeliveryPin(order));
    }
    return res.status(200).json({ success: true, message: "Ahora atiendes este pedido.", order: order && hideDeliveryPin(order) });
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
      include: { sale: { select: { id: true } } },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const cancelError = getCancelError(order, !!order.sale);
    if (cancelError) {
      return res.status(409).json({ success: false, message: cancelError });
    }

    const updatedOrder = await cancelOrderAndNotify(req, order);
    if (!updatedOrder) {
      return res.status(409).json({ success: false, message: "El pedido cambió. Revísalo e intenta de nuevo." });
    }

    return res.status(200).json({ success: true, message: "Order cancelled successfully", order: updatedOrder });
  } catch (error) {
    next(error);
  }
}

export async function updateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const { items, customerName, comments } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items array is required" });
    }

    const existingOrder = await prisma.order.findFirst({
      where: { id, restaurantId },
      include: { items: true, sale: { select: { id: true } } },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!canEditOrder(existingOrder) || existingOrder.sale || isOrderPaid(existingOrder)) {
      return res.status(409).json({ success: false, message: "Este pedido ya no se puede modificar" });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Delete existing items
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      // 2. Calculate new total and validate/create new items
      let calculatedTotal = 0;
      const orderItemsData = [];
      const previousItems = [...existingOrder.items];

      for (const item of items) {
        const variantId = parseInt(item.variantId, 10);
        const quantity = parseFloat(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("Item quantity must be a positive number greater than 0");
        }

        const alreadyInOrder = previousItems.some((previous) => previous.variantId === variantId);
        const variant = await tx.menuItemVariant.findFirst({
          where: {
            id: variantId,
            menuItem: { category: { restaurantId }, ...(alreadyInOrder ? {} : { isActive: true }) },
          },
        });

        if (!variant) {
          throw new Error("Uno de los platos ya no está disponible. Actualiza el menú e inténtalo de nuevo.");
        }

        // A dish that didn't change keeps its price, its kitchen progress and who prepared it
        const comments = item.comments || null;
        const sameIndex = previousItems.findIndex(
          (previous) => previous.variantId === variantId && previous.quantity === quantity && previous.comments === comments
        );
        const [sameItem] = sameIndex >= 0 ? previousItems.splice(sameIndex, 1) : [];

        const price = sameItem ? sameItem.price : getEffectivePrice(variant);
        const subtotal = price * quantity;
        calculatedTotal += subtotal;

        orderItemsData.push({
          variantId,
          quantity,
          price,
          comments,
          status: sameItem?.status ?? OrderItemStatus.PENDING,
          preparedById: sameItem?.preparedById ?? null,
        });
      }

      const costEnvio = existingOrder.shippingCost || 0;
      const allReady = orderItemsData.every(
        (item) => item.status === OrderItemStatus.READY || item.status === OrderItemStatus.SERVED
      );

      // 3. Update order
      return await tx.order.update({
        where: { id },
        data: {
          // New dishes send a finished order back to the kitchen
          status: existingOrder.status === OrderStatus.READY && !allReady ? OrderStatus.PREPARING : existingOrder.status,
          customerName: customerName || existingOrder.customerName,
          mozoId: existingOrder.mozoId ?? (req.user?.role === Role.MOZO ? req.user.userId : undefined),
          comments: comments !== undefined ? comments : existingOrder.comments,
          total: calculatedTotal + costEnvio,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { menuItem: true },
              },
            },
          },
          table: true,
          mozo: {
            select: { id: true, name: true, role: true },
          },
        },
      });
    });

    // Send real-time Socket notification to kitchen and cashiers
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurantId}`).to(`order-${id}`).emit("order-status-updated", hideDeliveryPin(updatedOrder));
      console.log(`[Socket] Emitted order-status-updated for restaurant-${restaurantId}`);
    }

    return res.status(200).json({ success: true, message: "Order updated successfully", order: hideDeliveryPin(updatedOrder) });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to update order" });
  }
}
