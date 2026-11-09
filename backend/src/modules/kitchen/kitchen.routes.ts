import { Router } from "express";
import { getPendingKitchenItems, updateItemStatus, getProductionAreas, callWaiter, getKitchenHistory } from "./kitchen.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/pending", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.PRODUCCION, Role.MOZO]), getPendingKitchenItems);
router.put("/items/:id/status", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.PRODUCCION]), updateItemStatus);
router.post("/orders/:orderId/call-waiter", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.PRODUCCION]), callWaiter);
router.get("/history", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.PRODUCCION]), getKitchenHistory);
router.get("/areas", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.PRODUCCION, Role.MOZO]), getProductionAreas);

export default router;
