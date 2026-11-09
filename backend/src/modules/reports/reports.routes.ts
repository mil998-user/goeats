import { Router } from "express";
import {
  getDashboardData,
  getSalesReport,
  getProductSalesReport,
  getWaiterReport,
} from "./reports.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/dashboard", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getDashboardData);
router.get("/sales", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getSalesReport);
router.get("/products", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getProductSalesReport);
router.get("/waiters", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getWaiterReport);

export default router;
