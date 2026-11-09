import { Router } from "express";
import {
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  getPublicRestaurantCatalog,
  getPublicRestaurantList,
  createPublicOrder,
  callWaiterFromTable,
  resolveMapsUrl,
  approveRestaurant,
  rejectRestaurant,
  reviewRestaurant,
} from "./restaurants.controller";
import { authMiddleware } from "../../middlewares/auth";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";
import { limitRequests } from "../../utils/rateLimit";

const router = Router();

const MINUTE_MS = 60 * 1000;
const limitPublicOrders = limitRequests(60, 15 * MINUTE_MS, "Demasiados pedidos desde esta conexión. Espera unos minutos.");
const limitWaiterCalls = limitRequests(30, 5 * MINUTE_MS, "Demasiados llamados desde esta conexión. Espera unos minutos.");
const limitMapLookups = limitRequests(30, 15 * MINUTE_MS, "Demasiadas búsquedas de ubicación. Espera unos minutos.");

// Public routes for aggregator and client ordering
router.get("/public/list", getPublicRestaurantList);
router.get("/public/catalog/:slug", getPublicRestaurantCatalog);
router.post("/public/catalog/:slug/order", limitPublicOrders, createPublicOrder);
router.post("/public/catalog/:slug/call-waiter", limitWaiterCalls, callWaiterFromTable);

// Private routes
router.post("/resolve-maps-url", authMiddleware, authorize([Role.RESTAURANT_OWNER]), limitMapLookups, resolveMapsUrl);
router.get("/", authMiddleware, authorize([Role.SUPER_ADMIN]), getAllRestaurants);
router.get("/:id", authMiddleware, getRestaurantById);
router.put("/:id", authMiddleware, authorize([Role.SUPER_ADMIN, Role.RESTAURANT_OWNER]), updateRestaurant);

// Restaurant approval management (Super Admin only)
router.post("/:id/approve", authMiddleware, authorize([Role.SUPER_ADMIN]), approveRestaurant);
router.post("/:id/reject", authMiddleware, authorize([Role.SUPER_ADMIN]), rejectRestaurant);
router.post("/:id/review", authMiddleware, authorize([Role.SUPER_ADMIN]), reviewRestaurant);

export default router;
