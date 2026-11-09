import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { parseAmount } from "../../utils/validation";

// SUPPLIERS

export async function getSuppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const suppliers = await prisma.supplier.findMany({
      where: { restaurantId },
      orderBy: { businessName: "asc" },
    });

    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { ruc, businessName, address, phone, email, contactName } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!ruc || !businessName) {
      return res.status(400).json({ success: false, message: "RUC and businessName are required" });
    }

    // Check if supplier already exists in this restaurant
    const existing = await prisma.supplier.findFirst({
      where: { ruc, restaurantId },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Supplier already registered with this RUC" });
    }

    const supplier = await prisma.supplier.create({
      data: {
        ruc,
        businessName,
        address,
        phone,
        email,
        contactName,
        restaurantId,
      },
    });

    return res.status(201).json({ success: true, message: "Supplier registered successfully", supplier });
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { ruc, businessName, address, phone, email, contactName } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const supplier = await prisma.supplier.findFirst({ where: { id, restaurantId } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: { ruc, businessName, address, phone, email, contactName },
    });

    return res.status(200).json({ success: true, message: "Supplier updated successfully", supplier: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const supplier = await prisma.supplier.findFirst({ where: { id, restaurantId } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    await prisma.supplier.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// PURCHASES

export async function getPurchases(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const purchases = await prisma.purchase.findMany({
      where: { restaurantId },
      include: {
        supplier: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const purchase = await prisma.purchase.findFirst({
      where: { id, restaurantId },
      include: {
        supplier: true,
        user: { select: { name: true } },
        items: true,
        credits: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // Load supply names for items
    const itemsWithSupplies = await Promise.all(
      purchase.items.map(async (item) => {
        const supply = await prisma.supply.findUnique({
          where: { id: item.supplyId },
          select: { name: true, unit: { select: { name: true } } },
        });
        return {
          ...item,
          supplyName: supply?.name || "Desconocido",
          unitName: supply?.unit.name || "",
        };
      })
    );

    return res.status(200).json({
      success: true,
      purchase: {
        ...purchase,
        items: itemsWithSupplies,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createPurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;

    if (!restaurantId || !userId) {
      return res.status(400).json({ success: false, message: "Restaurant context and user auth required" });
    }

    const { supplierId, docNumber, type, discount, items, interest, dueDate } = req.body;

    if (!supplierId || !type || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "supplierId, type, and non-empty items are required" });
    }

    if (type !== "CONTADO" && type !== "CREDITO") {
      return res.status(400).json({ success: false, message: "Type must be either CONTADO or CREDITO" });
    }

    const parsedSupplierId = parseInt(supplierId, 10);
    const disc = parseAmount(discount || 0, { allowZero: true });
    if (disc === null) {
      return res.status(400).json({ success: false, message: "Discount must be a valid amount" });
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findFirst({
      where: { id: parsedSupplierId, restaurantId },
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // Run transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Calculate totals and validate items
      let purchaseTotal = 0;
      const purchaseItemsData = [];

      for (const item of items) {
        const supplyId = parseInt(item.supplyId, 10);
        const quantity = parseAmount(item.quantity);
        const price = parseAmount(item.price, { allowZero: true });

        if (quantity === null || price === null) {
          throw new Error("Item quantity and price must be valid amounts");
        }

        const supply = await tx.supply.findFirst({
          where: { id: supplyId, restaurantId },
        });

        if (!supply) {
          throw new Error(`Supply ID ${supplyId} not found`);
        }

        purchaseTotal += price * quantity;

        purchaseItemsData.push({
          supplyId,
          quantity,
          price,
        });
      }

      const netTotal = purchaseTotal - disc;

      // 2. Create purchase
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId: parsedSupplierId,
          userId,
          docNumber,
          type,
          total: netTotal,
          discount: disc,
          restaurantId,
          items: {
            create: purchaseItemsData,
          },
        },
      });

      // 3. Update stock, cost and register Kardex entries for each item
      for (const item of purchaseItemsData) {
        await tx.supply.update({
          where: { id: item.supplyId },
          data: {
            stock: { increment: item.quantity },
            cost: item.price, // update supply cost to purchase unit price
          },
        });

        await tx.inventoryMovement.create({
          data: {
            supplyId: item.supplyId,
            type: "IN",
            quantity: item.quantity,
            costUnit: item.price,
            reason: "COMPRA",
          },
        });
      }

      // 4. Handle Credits if it is on credit
      if (type === "CREDITO") {
        await tx.purchaseCredit.create({
          data: {
            purchaseId: newPurchase.id,
            totalAmount: netTotal,
            interest: interest ? parseFloat(interest) : 0.0,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: "PENDING",
          },
        });
      } else {
        // If it's cash purchase (CONTADO), we can automatically log it as an expense in the active cashSession
        const session = await tx.cashSession.findFirst({
          where: { status: "OPEN", cashRegister: { restaurantId } },
          orderBy: { openTime: "desc" },
        });

        if (session) {
          await tx.expense.create({
            data: {
              cashSessionId: session.id,
              userId,
              amount: netTotal,
              description: `COMPRA A PROVEEDOR ${supplier.businessName} - DOC: ${docNumber || "S/N"}`,
              category: "Compras",
              restaurantId,
            },
          });
        }
      }

      return newPurchase;
    });

    return res.status(201).json({ success: true, message: "Purchase completed successfully", purchase });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to complete purchase" });
  }
}

// PURCHASE CREDITS (CUOTAS)

export async function getPurchaseCredits(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const credits = await prisma.purchaseCredit.findMany({
      where: {
        purchase: { restaurantId },
      },
      include: {
        purchase: {
          include: { supplier: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, credits });
  } catch (error) {
    next(error);
  }
}

export async function payCreditInstallment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const userId = req.user?.userId;
    const { amount } = req.body; // Amount paid in this installment

    const parsedAmount = parseAmount(amount);
    if (isNaN(id) || !restaurantId || !userId || parsedAmount === null) {
      return res.status(400).json({ success: false, message: "Invalid inputs" });
    }

    const credit = await prisma.purchaseCredit.findFirst({
      where: { id, purchase: { restaurantId } },
      include: { purchase: { include: { supplier: true } } },
    });

    if (!credit) {
      return res.status(404).json({ success: false, message: "Credit record not found" });
    }

    if (credit.status === "PAID") {
      return res.status(400).json({ success: false, message: "This credit is already fully paid" });
    }

    // Must have an open cash session in the restaurant to register the expense
    const session = await prisma.cashSession.findFirst({
      where: { status: "OPEN", cashRegister: { restaurantId } },
      orderBy: { openTime: "desc" },
    });
    if (!session) {
      return res.status(400).json({ success: false, message: "You must open a cash session to pay credits" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const newPaidAmount = credit.paidAmount + parsedAmount;
      const isFullyPaid = newPaidAmount >= credit.totalAmount;

      // 1. Update the credit amount
      const updatedCredit = await tx.purchaseCredit.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? "PAID" : "PENDING",
        },
      });

      // 2. Create the cash expense entry
      await tx.expense.create({
        data: {
          cashSessionId: session.id,
          userId,
          amount: parsedAmount,
          description: `PAGO CREDITO DE COMPRA #${credit.purchaseId} - PROV: ${credit.purchase.supplier.businessName}`,
          category: "Crédito",
          restaurantId,
        },
      });

      return updatedCredit;
    });

    return res.status(200).json({ success: true, message: "Payment registered successfully", credit: updated });
  } catch (error) {
    next(error);
  }
}
