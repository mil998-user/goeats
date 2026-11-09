import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth";
import { authorize } from "../../middlewares/rbac";
import { tenantMiddleware } from "../../middlewares/tenant";
import {
  getMyDriverRating,
  getMyRestaurantRatings,
  rateCustomerAsDriver,
  rateOrderAsCustomer,
} from "./ratings.controller";

const router = Router();

router.use(authMiddleware);

router.post("/orders/:id(\\d+)", authorize([Role.CUSTOMER]), rateOrderAsCustomer);
router.post("/orders/:id(\\d+)/customer", authorize([Role.MOTORIZADO]), rateCustomerAsDriver);
router.get("/driver/me", authorize([Role.MOTORIZADO]), getMyDriverRating);
router.get(
  "/restaurant",
  tenantMiddleware,
  authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO, Role.PRODUCCION]),
  getMyRestaurantRatings
);

export default router;
