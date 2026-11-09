import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth";
import { authorize } from "../../middlewares/rbac";
import { tenantMiddleware } from "../../middlewares/tenant";
import { limitRequests } from "../../utils/rateLimit";
import {
  cancelMyReservation,
  createCustomerReservation,
  createStaffReservation,
  getMyReservations,
  getRestaurantReservations,
  updateReservation,
} from "./reservations.controller";

const router = Router();
const limitReservations = limitRequests(20, 60 * 60 * 1000, "Demasiadas reservas seguidas. Espera un momento.");
const STAFF = [Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO];

router.use(authMiddleware);

// Customer
router.post("/public/:slug", authorize([Role.CUSTOMER]), limitReservations, createCustomerReservation);
router.get("/mine", authorize([Role.CUSTOMER]), getMyReservations);
router.post("/mine/:id(\\d+)/cancel", authorize([Role.CUSTOMER]), cancelMyReservation);

// Restaurant staff
router.get("/", tenantMiddleware, authorize(STAFF), getRestaurantReservations);
router.post("/", tenantMiddleware, authorize(STAFF), createStaffReservation);
router.put("/:id(\\d+)", tenantMiddleware, authorize(STAFF), updateReservation);

export default router;
