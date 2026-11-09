import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { parseAmount } from "../../utils/validation";
import { readPromo, toSaleVariant } from "../../utils/promotions";

// CATEGORIES

export async function getMenuCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    // The menu editor asks for hidden dishes too; the POS only gets what can be sold
    const includeHidden = req.query.includeHidden === "true";
    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        items: {
          where: includeHidden ? undefined : { isActive: true },
          include: {
            variants: {
              include: {
                recipeIngredients: {
                  include: { supply: true },
                },
              },
            },
            productionArea: true,
          },
        },
      },
    });

    if (includeHidden) {
      return res.status(200).json({ success: true, categories });
    }

    // The POS sells at the price of today, promotion included
    const now = new Date();
    const forSale = categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        variants: item.variants.map((variant) => toSaleVariant(variant, now)),
      })),
    }));
    return res.status(200).json({ success: true, categories: forSale });
  } catch (error) {
    next(error);
  }
}

export async function createMenuCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name, description } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        description,
        restaurantId,
      },
    });

    return res.status(201).json({ success: true, message: "Menu category created successfully", category });
  } catch (error) {
    next(error);
  }
}

export async function updateMenuCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, description } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const category = await prisma.menuCategory.findFirst({ where: { id, restaurantId } });
    if (!category) {
      return res.status(404).json({ success: false, message: "Menu category not found" });
    }

    const updatedCategory = await prisma.menuCategory.update({
      where: { id },
      data: { name, description },
    });

    return res.status(200).json({ success: true, message: "Menu category updated", category: updatedCategory });
  } catch (error) {
    next(error);
  }
}

// Deleting a dish erases it from every past order (A13), so dishes already ordered stay
async function hasOrderHistory(where: { variantId?: number; menuItemId?: number; categoryId?: number }) {
  const count = await prisma.orderItem.count({
    where: {
      variant: where.variantId
        ? { id: where.variantId }
        : where.menuItemId
        ? { menuItemId: where.menuItemId }
        : { menuItem: { categoryId: where.categoryId } },
    },
  });
  return count > 0;
}

const ORDER_HISTORY_MESSAGE =
  "Ya hay pedidos con este plato, así que no se borra para no dañar el historial. Usa \"Ocultar\" para quitarlo del menú.";

export async function deleteMenuCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const category = await prisma.menuCategory.findFirst({ where: { id, restaurantId } });
    if (!category) {
      return res.status(404).json({ success: false, message: "Menu category not found" });
    }

    if (await hasOrderHistory({ categoryId: id })) {
      return res.status(409).json({ success: false, message: "Esta categoría tiene platos que ya se pidieron y no se puede borrar." });
    }

    await prisma.menuCategory.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Menu category and all its items deleted" });
  } catch (error) {
    next(error);
  }
}

// MENU ITEMS

export async function createMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name, description, image, categoryId, productionAreaId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name || !categoryId) {
      return res.status(400).json({ success: false, message: "Name and categoryId are required" });
    }

    // Verify category belongs to restaurant
    const category = await prisma.menuCategory.findFirst({
      where: { id: parseInt(categoryId, 10), restaurantId },
    });
    if (!category) {
      return res.status(404).json({ success: false, message: "Menu category not found" });
    }

    // Verify production area if specified
    if (productionAreaId) {
      const area = await prisma.productionArea.findFirst({
        where: { id: parseInt(productionAreaId, 10), restaurantId },
      });
      if (!area) {
        return res.status(404).json({ success: false, message: "Production area not found" });
      }
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        image,
        categoryId: category.id,
        productionAreaId: productionAreaId ? parseInt(productionAreaId, 10) : null,
      },
    });

    return res.status(201).json({ success: true, message: "Menu item created successfully", menuItem: item });
  } catch (error) {
    next(error);
  }
}

export async function updateMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, description, image, categoryId, productionAreaId, isActive } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive debe ser verdadero o falso" });
    }

    // Verify item belongs to restaurant
    const item = await prisma.menuItem.findFirst({
      where: { id, category: { restaurantId } },
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    if (categoryId) {
      const category = await prisma.menuCategory.findFirst({
        where: { id: parseInt(categoryId, 10), restaurantId },
      });
      if (!category) {
        return res.status(404).json({ success: false, message: "Menu category not found" });
      }
    }

    if (productionAreaId) {
      const area = await prisma.productionArea.findFirst({
        where: { id: parseInt(productionAreaId, 10), restaurantId },
      });
      if (!area) {
        return res.status(404).json({ success: false, message: "Production area not found" });
      }
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        image,
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        productionAreaId: productionAreaId !== undefined ? (productionAreaId ? parseInt(productionAreaId, 10) : null) : undefined,
        isActive,
      },
    });

    return res.status(200).json({ success: true, message: "Menu item updated successfully", menuItem: updatedItem });
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const item = await prisma.menuItem.findFirst({
      where: { id, category: { restaurantId } },
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    if (await hasOrderHistory({ menuItemId: id })) {
      return res.status(409).json({ success: false, message: ORDER_HISTORY_MESSAGE });
    }

    await prisma.menuItem.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Menu item deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// ITEM VARIANTS (PRESENTATIONS)

export async function createVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name, code, price, stockLimit, options, menuItemId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name || !price || !menuItemId) {
      return res.status(400).json({ success: false, message: "Name, price, and menuItemId are required" });
    }

    const parsedPrice = parseAmount(price);
    if (parsedPrice === null) {
      return res.status(400).json({ success: false, message: "Price must be a valid amount" });
    }

    const promo = readPromo(req.body, parsedPrice);
    if (promo && "error" in promo) {
      return res.status(400).json({ success: false, message: promo.error });
    }

    // Verify menu item belongs to restaurant
    const item = await prisma.menuItem.findFirst({
      where: { id: parseInt(menuItemId, 10), category: { restaurantId } },
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    const variant = await prisma.menuItemVariant.create({
      data: {
        name,
        code,
        price: parsedPrice,
        promoPrice: promo ? promo.promoPrice : null,
        promoEndsAt: promo ? promo.promoEndsAt : null,
        stockLimit: stockLimit ? parseInt(stockLimit, 10) : null,
        options: options ? (typeof options === "string" ? options : JSON.stringify(options)) : null,
        menuItemId: item.id,
      },
    });

    return res.status(201).json({ success: true, message: "Variant created successfully", variant });
  } catch (error) {
    next(error);
  }
}

export async function updateVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, code, price, stockLimit, options } = req.body;

    if (price !== undefined && price !== null && price !== "" && parseAmount(price) === null) {
      return res.status(400).json({ success: false, message: "Price must be a valid amount" });
    }

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const variant = await prisma.menuItemVariant.findFirst({
      where: { id, menuItem: { category: { restaurantId } } },
    });
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    const newPrice = price ? Number(price) : variant.price;
    const promo = readPromo(req.body, newPrice);
    if (promo && "error" in promo) {
      return res.status(400).json({ success: false, message: promo.error });
    }

    const updatedVariant = await prisma.menuItemVariant.update({
      where: { id },
      data: {
        name,
        code,
        price: price ? parseFloat(price) : undefined,
        promoPrice: promo ? promo.promoPrice : undefined,
        promoEndsAt: promo ? promo.promoEndsAt : undefined,
        stockLimit: stockLimit !== undefined ? (stockLimit ? parseInt(stockLimit, 10) : null) : undefined,
        options: options !== undefined ? (options ? (typeof options === "string" ? options : JSON.stringify(options)) : null) : undefined,
      },
    });

    return res.status(200).json({ success: true, message: "Variant updated successfully", variant: updatedVariant });
  } catch (error) {
    next(error);
  }
}

export async function deleteVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const variant = await prisma.menuItemVariant.findFirst({
      where: { id, menuItem: { category: { restaurantId } } },
    });
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    if (await hasOrderHistory({ variantId: id })) {
      return res.status(409).json({ success: false, message: ORDER_HISTORY_MESSAGE });
    }

    await prisma.menuItemVariant.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Variant deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// RECIPE INGREDIENTS

export async function getRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const variantId = parseInt(req.params.variantId, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(variantId) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid variantId or restaurant context missing" });
    }

    // Verify variant belongs to restaurant
    const variant = await prisma.menuItemVariant.findFirst({
      where: { id: variantId, menuItem: { category: { restaurantId } } },
    });
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found in this restaurant" });
    }

    const recipe = await prisma.recipeIngredient.findMany({
      where: { variantId },
      include: {
        supply: {
          include: { unit: true },
        },
      },
    });

    return res.status(200).json({ success: true, recipe });
  } catch (error) {
    next(error);
  }
}

export async function setRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const variantId = parseInt(req.params.variantId, 10);
    const restaurantId = req.restaurantId;
    const { ingredients } = req.body; // Array of { supplyId: number, quantity: number }

    if (isNaN(variantId) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid variantId or restaurant context missing" });
    }
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ success: false, message: "Ingredients array is required" });
    }

    // Verify variant belongs to restaurant
    const variant = await prisma.menuItemVariant.findFirst({
      where: { id: variantId, menuItem: { category: { restaurantId } } },
    });
    if (!variant) {
      return res.status(404).json({ success: false, message: "Variant not found in this restaurant" });
    }

    // Run in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing recipe ingredients
      await tx.recipeIngredient.deleteMany({ where: { variantId } });

      // 2. Validate and insert new recipe ingredients
      for (const ing of ingredients) {
        const supplyId = parseInt(ing.supplyId, 10);
        const quantity = parseFloat(ing.quantity);

        // Verify supply exists and belongs to restaurant
        const supply = await tx.supply.findFirst({
          where: { id: supplyId, restaurantId },
        });

        if (!supply) {
          throw new Error(`Supply ID ${supplyId} not found or does not belong to this restaurant`);
        }

        await tx.recipeIngredient.create({
          data: {
            variantId,
            supplyId,
            quantity,
          },
        });
      }
    });

    return res.status(200).json({ success: true, message: "Recipe updated successfully" });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to set recipe" });
  }
}
