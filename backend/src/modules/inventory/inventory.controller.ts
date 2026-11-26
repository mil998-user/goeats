import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";

// SUPPLIES CRUD

export async function getSupplies(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const supplies = await prisma.supply.findMany({
      where: { restaurantId },
      include: {
        category: true,
        unit: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({ success: true, supplies });
  } catch (error) {
    next(error);
  }
}

export async function createSupply(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name, code, categoryId, unitId, stock, minStock, cost } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name || !categoryId || !unitId) {
      return res.status(400).json({ success: false, message: "Name, categoryId, and unitId are required" });
    }

    // Verify category exists
    const category = await prisma.supplyCategory.findUnique({
      where: { id: parseInt(categoryId, 10) },
    });
    if (!category) {
      return res.status(404).json({ success: false, message: "Supply category not found" });
    }

    // Verify unit exists
    const unit = await prisma.unitOfMeasure.findUnique({
      where: { id: parseInt(unitId, 10) },
    });
    if (!unit) {
      return res.status(404).json({ success: false, message: "Unit of measure not found" });
    }

    const initialStock = stock ? parseFloat(stock) : 0.0;
    const initialCost = cost ? parseFloat(cost) : 0.0;

    const supply = await prisma.$transaction(async (tx) => {
      const newSupply = await tx.supply.create({
        data: {
          name,
          code,
          categoryId: category.id,
          unitId: unit.id,
          stock: initialStock,
          minStock: minStock ? parseFloat(minStock) : 0.0,
          cost: initialCost,
          restaurantId,
        },
      });

      // If initial stock is greater than 0, create an entry movement in Kardex
      if (initialStock > 0) {
        await tx.inventoryMovement.create({
          data: {
            supplyId: newSupply.id,
            type: "IN",
            quantity: initialStock,
            costUnit: initialCost,
            reason: "AJUSTE_MANUAL",
          },
        });
      }

      return newSupply;
    });

    return res.status(201).json({ success: true, message: "Supply created successfully", supply });
  } catch (error) {
    next(error);
  }
}

export async function updateSupply(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, code, categoryId, unitId, minStock, cost } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const supply = await prisma.supply.findFirst({ where: { id, restaurantId } });
    if (!supply) {
      return res.status(404).json({ success: false, message: "Supply not found" });
    }

    if (categoryId) {
      const category = await prisma.supplyCategory.findUnique({ where: { id: parseInt(categoryId, 10) } });
      if (!category) {
        return res.status(404).json({ success: false, message: "Supply category not found" });
      }
    }

    if (unitId) {
      const unit = await prisma.unitOfMeasure.findUnique({ where: { id: parseInt(unitId, 10) } });
      if (!unit) {
        return res.status(404).json({ success: false, message: "Unit of measure not found" });
      }
    }

    const updated = await prisma.supply.update({
      where: { id },
      data: {
        name,
        code,
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        unitId: unitId ? parseInt(unitId, 10) : undefined,
        minStock: minStock ? parseFloat(minStock) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
      },
    });

    return res.status(200).json({ success: true, message: "Supply updated successfully", supply: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteSupply(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const supply = await prisma.supply.findFirst({ where: { id, restaurantId } });
    if (!supply) {
      return res.status(404).json({ success: false, message: "Supply not found" });
    }

    await prisma.supply.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Supply deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// KARDEX MOVEMENTS

export async function getInventoryMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        supply: { restaurantId },
      },
      include: {
        supply: {
          include: { unit: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, movements });
  } catch (error) {
    next(error);
  }
}

export async function logManualMovement(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { supplyId, type, quantity, reason, costUnit } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!supplyId || !type || !quantity || !reason) {
      return res.status(400).json({ success: false, message: "supplyId, type, quantity, and reason are required" });
    }

    if (type !== "IN" && type !== "OUT") {
      return res.status(400).json({ success: false, message: "Type must be either IN or OUT" });
    }

    const parsedSupplyId = parseInt(supplyId, 10);
    const parsedQuantity = parseFloat(quantity);
    const parsedCostUnit = costUnit ? parseFloat(costUnit) : 0.0;
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity > 100000) {
      return res.status(400).json({ success: false, message: "La cantidad debe ser mayor a 0." });
    }
    if (!Number.isFinite(parsedCostUnit) || parsedCostUnit < 0) {
      return res.status(400).json({ success: false, message: "El costo no puede ser negativo." });
    }

    // Verify supply belongs to restaurant
    const supply = await prisma.supply.findFirst({
      where: { id: parsedSupplyId, restaurantId },
    });

    if (!supply) {
      return res.status(404).json({ success: false, message: "Supply not found in this restaurant" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Log the Kardex movement
      const movement = await tx.inventoryMovement.create({
        data: {
          supplyId: parsedSupplyId,
          type,
          quantity: parsedQuantity,
          reason,
          costUnit: parsedCostUnit,
        },
      });

      // 2. Adjust supply stock
      await tx.supply.update({
        where: { id: parsedSupplyId },
        data: {
          stock: {
            [type === "IN" ? "increment" : "decrement"]: parsedQuantity,
          },
          cost: type === "IN" ? parsedCostUnit : undefined, // update cost on input
        },
      });

      return movement;
    });

    return res.status(201).json({ success: true, message: "Inventory adjusted successfully", movement: result });
  } catch (error) {
    next(error);
  }
}

// METADATA LISTS

export async function getSupplyCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.supplyCategory.findMany({ orderBy: { name: "asc" } });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function getUnitsOfMeasure(req: Request, res: Response, next: NextFunction) {
  try {
    const units = await prisma.unitOfMeasure.findMany({ orderBy: { name: "asc" } });
    return res.status(200).json({ success: true, units });
  } catch (error) {
    next(error);
  }
}
