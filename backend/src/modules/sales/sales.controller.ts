import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderStatus, OrderType } from "@prisma/client";
import { emitElectronicInvoice } from "../../services/sri/sri-billing.service";
import { parseAmount } from "../../utils/validation";
import { getChargeError, MAX_TIP } from "../../utils/orderRules";
import { releaseTable } from "../../utils/tables";

const PAYMENT_METHODS = ["01", "20"];
const roundMoney = (value: number) => Math.round(value * 100) / 100;

export async function emitSale(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }

    const {
      orderId,
      clientId,
      clientData, // Optional: { name, typeId, identification, address, email, phone }
      paymentCash,
      paymentCard,
      discount,
      paymentMethod, // "01" (cash), "20" (card)
      docTypeId, // ID from DocumentType model
      fiscalEmit, // boolean: emit electronic invoice
      tip, // Optional tip for the waiter: charged with the bill, outside the invoice and the IVA
    } = req.body;

    if (!orderId || !docTypeId || !paymentMethod) {
      return res.status(400).json({ success: false, message: "orderId, docTypeId, and paymentMethod are required" });
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Forma de pago no válida" });
    }

    const disc = parseAmount(discount ?? 0, { allowZero: true });
    if (disc === null) {
      return res.status(400).json({ success: false, message: "Descuento no válido" });
    }

    const tipValue = parseAmount(tip ?? 0, { allowZero: true });
    if (tipValue === null || tipValue > MAX_TIP) {
      return res.status(400).json({ success: false, message: `La propina debe ser de $0 a ${MAX_TIP}.` });
    }

    // 1. Verify restaurant has an active open cash session
    let cashSession = await prisma.cashSession.findFirst({
      where: { userId, status: "OPEN", cashRegister: { restaurantId } },
    });
    if (!cashSession) {
      cashSession = await prisma.cashSession.findFirst({
        where: { status: "OPEN", cashRegister: { restaurantId } },
        orderBy: { openTime: "desc" },
      });
    }
    if (!cashSession) {
      return res.status(400).json({ success: false, message: "Debe haber una sesión de caja abierta en el restaurante antes de emitir ventas" });
    }

    // 2. Load order and items
    const order = await prisma.order.findFirst({
      where: { id: parseInt(orderId, 10), restaurantId },
      include: {
        sale: { select: { id: true } },
        restaurant: { select: { payBeforeEating: true } },
        items: {
          include: {
            variant: {
              include: {
                recipeIngredients: true,
                menuItem: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const payBeforeEating = order.restaurant.payBeforeEating;
    const chargeError = getChargeError(order, !!order.sale, payBeforeEating);
    if (chargeError) {
      return res.status(409).json({ success: false, message: chargeError });
    }

    const saleTotal = roundMoney(order.total - disc);
    if (saleTotal < 0) {
      return res.status(400).json({ success: false, message: "El descuento no puede superar el total del pedido" });
    }

    // The register always records the amount owed, never what the browser says
    const receivedAmount = (parseAmount(paymentCash ?? 0, { allowZero: true }) ?? -1) + (parseAmount(paymentCard ?? 0, { allowZero: true }) ?? -1);
    if (tipValue > 0 && order.type === OrderType.DELIVERY) {
      return res.status(400).json({ success: false, message: "La propina de un domicilio la recibe el motorizado." });
    }
    const amountDue = roundMoney(saleTotal + tipValue);
    if (Math.abs(receivedAmount - amountDue) > 0.01) {
      return res.status(409).json({
        success: false,
        message: tipValue > 0
          ? `El total con propina es ${amountDue.toFixed(2)}. Revisa el pedido antes de cobrar.`
          : `El total del pedido es ${saleTotal.toFixed(2)}. Revisa el pedido antes de cobrar.`,
      });
    }

    // 3. Load or create Client
    let finalClientId: number;

    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: parseInt(clientId, 10), restaurantId },
      });
      if (!client) {
        return res.status(404).json({ success: false, message: "Specified client not found" });
      }
      finalClientId = client.id;
    } else if (clientData) {
      if (!clientData.name || !clientData.typeId || !clientData.identification) {
        return res.status(400).json({ success: false, message: "Faltan datos del cliente" });
      }

      // Find if client already exists by identification in this restaurant
      const existingClient = await prisma.client.findFirst({
        where: { identification: clientData.identification, restaurantId },
      });

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: {
            name: clientData.name,
            typeId: clientData.typeId,
            identification: clientData.identification,
            address: clientData.address || "S/N",
            email: clientData.email || "consumidorfinal@gmail.com",
            phone: clientData.phone || "0999999999",
            restaurantId,
          },
        });
        finalClientId = newClient.id;
      }
    } else {
      // Default to Consumidor Final
      const cfClient = await prisma.client.findFirst({
        where: { identification: "9999999999999", restaurantId },
      });

      if (cfClient) {
        finalClientId = cfClient.id;
      } else {
        const newCf = await prisma.client.create({
          data: {
            name: "CONSUMIDOR FINAL",
            typeId: "07",
            identification: "9999999999999",
            address: "S/N",
            email: "cf@gmail.com",
            phone: "0999999999",
            restaurantId,
          },
        });
        finalClientId = newCf.id;
      }
    }

    // 4. Verify Document Type exists
    const docType = await prisma.documentType.findUnique({
      where: { id: parseInt(docTypeId, 10) },
    });
    if (!docType) {
      return res.status(404).json({ success: false, message: "Document type not found" });
    }

    // 5. The issuer is only needed to invoice, not to charge
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { issuer: true },
    });
    const issuer = restaurant?.issuer;
    const serialDoc = `${issuer?.establecimiento ?? "001"}-${issuer?.puntoEmision ?? "001"}`;

    // 6. Calculate subtotal & tax totals
    // IVA chosen by the restaurant (15 % by default). Menu prices already include it
    const taxRate = restaurant?.taxRate ?? 15;

    // In GoEats: We assume prices include tax, or exclude tax.
    // Let's assume prices in Menu items already include tax, so we calculate backward.
    // Price = Subtotal + Tax
    // Subtotal = Price / (1 + TaxRate/100)
    // Tax = Price - Subtotal
    let subtotalTaxTotal = 0;
    let subtotal0Total = 0;
    let taxValueTotal = 0;

    for (const item of order.items) {
      // Food served by a restaurant pays IVA; a restaurant at 0 % leaves everything without it
      const isTaxable = taxRate > 0;
      const itemTotal = item.price * item.quantity;

      if (isTaxable) {
        const subtotal = itemTotal / (1 + taxRate / 100);
        const tax = itemTotal - subtotal;
        subtotalTaxTotal += subtotal;
        taxValueTotal += tax;
      } else {
        subtotal0Total += itemTotal;
      }
    }

    subtotalTaxTotal = roundMoney(subtotalTaxTotal);
    subtotal0Total = roundMoney(subtotal0Total);
    taxValueTotal = roundMoney(taxValueTotal);

    // 7. Execute Transaction: inventory deduction + sale + order update
    const sale = await prisma.$transaction(async (tx) => {
      // Charges of one restaurant go one at a time: same order or same number never repeat
      await tx.$queryRaw`SELECT id FROM Restaurant WHERE id = ${restaurantId} FOR UPDATE`;

      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { sale: { select: { id: true } } },
      });
      if (!currentOrder || getChargeError(currentOrder, !!currentOrder.sale, payBeforeEating) || roundMoney(currentOrder.total - disc) !== saleTotal) {
        return null;
      }

      const lastSale = await tx.sale.findFirst({
        where: { restaurantId, docTypeId: docType.id },
        orderBy: { id: "desc" },
      });
      const nextNumber = lastSale ? parseInt(lastSale.numberDoc, 10) + 1 : parseInt(issuer?.startSecuencial ?? "1", 10);
      const numberDoc = nextNumber.toString().padStart(9, "0");

      // A. Inventory deduction based on recipe
      for (const item of order.items) {
        for (const recipe of item.variant.recipeIngredients) {
          const totalDeduction = recipe.quantity * item.quantity;

          // Decrement Supply stock
          await tx.supply.update({
            where: { id: recipe.supplyId },
            data: {
              stock: {
                decrement: totalDeduction,
              },
            },
          });

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              supplyId: recipe.supplyId,
              type: "OUT",
              quantity: totalDeduction,
              reason: "VENTA",
              costUnit: 0.0, // Can link cost from supply later
            },
          });
        }
      }

      // B. Create Sale
      const newSale = await tx.sale.create({
        data: {
          orderId: order.id,
          clientId: finalClientId,
          docTypeId: docType.id,
          cashSessionId: cashSession.id,
          serialDoc,
          numberDoc,
          paymentCash: paymentMethod === "01" ? saleTotal : 0,
          paymentCard: paymentMethod === "20" ? saleTotal : 0,
          discount: disc,
          taxRate,
          subtotal0: subtotal0Total,
          subtotalTax: subtotalTaxTotal,
          taxValue: taxValueTotal,
          total: saleTotal,
          paymentMethod,
          restaurantId,
        },
      });

      // C. Update Order status
      // A served table and a ready takeout are finished once paid.
      // Paid before eating: the table order goes to the kitchen and the table stays occupied
      const paidBeforeCooking = order.type === OrderType.DINE_IN && order.status === OrderStatus.PENDING;
      let targetStatus = order.status;
      if (paidBeforeCooking) {
        targetStatus = OrderStatus.PREPARING;
      } else if (order.type === OrderType.DINE_IN || order.status === OrderStatus.READY) {
        targetStatus = OrderStatus.DELIVERED;
      } else if (order.status === OrderStatus.PENDING) {
        targetStatus = OrderStatus.PREPARING;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          paymentStatus: "APPROVED",
          tipAmount: tipValue,
        },
      });

      // D. Free table if dine-in, unless the customers are still about to eat
      if (order.type === OrderType.DINE_IN && order.tableId && !paidBeforeCooking) {
        await releaseTable(tx, order.tableId, order.id);
      }

      return newSale;
    });

    if (!sale) {
      return res.status(409).json({ success: false, message: "El pedido cambió mientras se cobraba. Revísalo e intenta de nuevo." });
    }

    // Notify real-time clients (POS) that order is finalized and table is free
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurantId}`).emit("sale-emitted", {
        sale,
        orderId: order.id,
        tableId: order.tableId,
      });
    }

    // 8. Electronic Invoice emission
    let fiscalResult = null;
    if (docType.code === "01" && fiscalEmit) {
      console.log(`[Billing] Emitting electronic invoice for sale ${sale.id}...`);
      fiscalResult = await emitElectronicInvoice(sale.id);
    }

    return res.status(201).json({
      success: true,
      message: "Sale processed successfully",
      sale,
      fiscal: fiscalResult,
    });
  } catch (error: any) {
    next(error);
  }
}

export async function getSales(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const sales = await prisma.sale.findMany({
      where: { restaurantId },
      include: {
        order: true,
        client: true,
        docType: true,
        invoice: {
          select: { id: true, estado: true, claveAcceso: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, sales });
  } catch (error) {
    next(error);
  }
}

export async function getSaleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const sale = await prisma.sale.findFirst({
      where: { id, restaurantId },
      include: {
        order: {
          include: {
            items: {
              include: {
                variant: {
                  include: { menuItem: true },
                },
              },
            },
            table: true,
            mozo: { select: { name: true } },
          },
        },
        client: true,
        docType: true,
        invoice: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    return res.status(200).json({ success: true, sale });
  } catch (error) {
    next(error);
  }
}

export async function getInvoicePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, sale: { restaurantId } },
    });

    if (!invoice || !invoice.pdfRIDE) {
      return res.status(404).json({ success: false, message: "RIDE PDF representation not found for this invoice" });
    }

    const pdfBuffer = Buffer.from(invoice.pdfRIDE, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Factura_${invoice.secuencial}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function retryBilling(req: Request, res: Response, next: NextFunction) {
  try {
    const saleId = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(saleId) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const sale = await prisma.sale.findFirst({
      where: { id: saleId, restaurantId },
      include: { invoice: true },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    // If an invoice exists and is already authorized, don't retry
    if (sale.invoice && sale.invoice.estado === "AUTORIZADA") {
      return res.status(400).json({ success: false, message: "Invoice is already successfully authorized by SRI" });
    }

    // Delete failed/stale invoice record first to avoid double entries
    if (sale.invoice) {
      await prisma.invoice.delete({ where: { id: sale.invoice.id } });
    }

    console.log(`[Billing] Retrying electronic invoice for sale ${sale.id}...`);
    const fiscalResult = await emitElectronicInvoice(sale.id);

    return res.status(200).json({
      success: fiscalResult.success,
      message: fiscalResult.success ? "Invoice processed successfully" : "Invoice failed",
      fiscal: fiscalResult,
    });
  } catch (error) {
    next(error);
  }
}
