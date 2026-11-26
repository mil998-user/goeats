import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";
import {
  submitSaaSOrder,
  getSaaSOrders,
  approveSaaSOrder,
  rejectSaaSOrder,
  getCustomers,
  toggleCustomerPlus,
  getMySaaSOrders,
  cancelMySaaSOrder,
  getSaaSPlans,
  createSaaSPlan,
  updateSaaSPlan,
  deleteSaaSPlan,
  deleteCustomer,
} from "./saas.controller";

const router = Router();

// Apply auth middleware to all SaaS routes
router.use(authMiddleware);

// Customer or driver submits a purchase request
router.post("/purchase", authorize([Role.CUSTOMER, Role.MOTORIZADO]), submitSaaSOrder);

// Retrieve logged-in user's orders
router.get("/my", authorize([Role.CUSTOMER, Role.MOTORIZADO]), getMySaaSOrders);
router.post("/my/:id/cancel", authorize([Role.CUSTOMER, Role.MOTORIZADO]), cancelMySaaSOrder);

// SaaS plans routes
router.get("/plans", getSaaSPlans); // Read access for all logged in users
router.post("/plans", authorize([Role.SUPER_ADMIN]), createSaaSPlan);
router.put("/plans/:id", authorize([Role.SUPER_ADMIN]), updateSaaSPlan);
router.delete("/plans/:id", authorize([Role.SUPER_ADMIN]), deleteSaaSPlan);

// SuperAdmin endpoints
router.get("/orders", authorize([Role.SUPER_ADMIN]), getSaaSOrders);
router.post("/orders/:id/approve", authorize([Role.SUPER_ADMIN]), approveSaaSOrder);
router.post("/orders/:id/reject", authorize([Role.SUPER_ADMIN]), rejectSaaSOrder);
router.get("/customers", authorize([Role.SUPER_ADMIN]), getCustomers);
router.post("/customers/:id/toggle-plus", authorize([Role.SUPER_ADMIN]), toggleCustomerPlus);
router.delete("/customers/:id", authorize([Role.SUPER_ADMIN]), deleteCustomer);

export default router;
