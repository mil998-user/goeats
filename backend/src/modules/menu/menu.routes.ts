import { Router } from "express";
import {
  getMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createVariant,
  updateVariant,
  deleteVariant,
  getRecipe,
  setRecipe,
} from "./menu.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// Categories routes
router.get("/categories", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getMenuCategories);
router.post("/categories", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), createMenuCategory);
router.put("/categories/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), updateMenuCategory);
router.delete("/categories/:id", authorize([Role.RESTAURANT_OWNER]), deleteMenuCategory);

// Menu Items routes
router.post("/items", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), createMenuItem);
router.put("/items/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), updateMenuItem);
router.delete("/items/:id", authorize([Role.RESTAURANT_OWNER]), deleteMenuItem);

// Variants routes
router.post("/variants", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), createVariant);
router.put("/variants/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), updateVariant);
router.delete("/variants/:id", authorize([Role.RESTAURANT_OWNER]), deleteVariant);

// Recipe routes
router.get("/variants/:variantId/recipe", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getRecipe);
router.post("/variants/:variantId/recipe", authorize([Role.RESTAURANT_OWNER]), setRecipe);

export default router;
