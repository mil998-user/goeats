import { Router } from "express";
import { getMyOrders, getCustomerStats, togglePlusSubscription } from "./customer.controller";
import { createAddress, deleteAddress, getMyAddresses, setDefaultAddress, updateAddress } from "./addresses.controller";
import { authMiddleware } from "../../middlewares/auth";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Secure these endpoints with authentication and customer role auth
router.use(authMiddleware);
router.use(authorize([Role.CUSTOMER]));

router.get("/my-orders", getMyOrders);
router.get("/stats", getCustomerStats);
router.post("/toggle-plus", togglePlusSubscription);

router.get("/addresses", getMyAddresses);
router.post("/addresses", createAddress);
router.put("/addresses/:id(\\d+)", updateAddress);
router.post("/addresses/:id(\\d+)/default", setDefaultAddress);
router.delete("/addresses/:id(\\d+)", deleteAddress);

export default router;
