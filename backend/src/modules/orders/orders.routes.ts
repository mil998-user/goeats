import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  changeTable,
  cancelOrder,
  attendOrder,
  updateOrder,
  getBillingCustomer,
} from "./orders.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getOrders);
router.post("/", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), createOrder);
// Billing data of the app customer who placed this order, so the cashier does not retype it
router.get("/:id/billing-customer", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getBillingCustomer);
router.get("/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getOrderById);
router.put("/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), updateOrder);
router.put("/:id/status", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.PRODUCCION, Role.MOZO]), updateOrderStatus);
router.post("/:id/change-table", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), changeTable);
router.post("/:id/attend", authorize([Role.MOZO]), attendOrder);
router.post("/:id/cancel", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), cancelOrder);

export default router;
