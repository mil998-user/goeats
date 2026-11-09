import { Router } from "express";
import {
  login,
  registerOwner,
  registerStaff,
  getProfile,
  updateProfile,
  registerCustomer,
  registerDriver,
  resetDatabase,
  getStaff,
  updateStaff,
  deleteStaff,
  socialLogin,
  completeProfile,
  savePreferences,
  deleteMyAccount,
} from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";
import { limitRequests } from "../../utils/rateLimit";

const router = Router();

const HOUR_MS = 60 * 60 * 1000;
const limitRegistrations = limitRequests(20, HOUR_MS, "Demasiados registros desde esta conexión. Intenta más tarde.");
const limitSocialLogin = limitRequests(30, HOUR_MS / 4, "Demasiados intentos. Espera unos minutos.");

router.post("/login", login);
router.post("/social-login", limitSocialLogin, socialLogin);
router.post("/complete-profile", completeProfile);
router.post("/preferences", authMiddleware, savePreferences);
router.post("/register-owner", limitRegistrations, registerOwner);
router.post("/register-customer", limitRegistrations, registerCustomer);
router.post("/register-driver", limitRegistrations, registerDriver);

// Protected staff routes
router.post(
  "/register-staff",
  authMiddleware,
  tenantMiddleware,
  authorize([Role.RESTAURANT_OWNER]),
  registerStaff
);
router.get(
  "/staff",
  authMiddleware,
  tenantMiddleware,
  authorize([Role.RESTAURANT_OWNER]),
  getStaff
);
router.put(
  "/staff/:id",
  authMiddleware,
  tenantMiddleware,
  authorize([Role.RESTAURANT_OWNER]),
  updateStaff
);
router.delete(
  "/staff/:id",
  authMiddleware,
  tenantMiddleware,
  authorize([Role.RESTAURANT_OWNER]),
  deleteStaff
);

// Get logged-in user profile
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/profile", authMiddleware, deleteMyAccount);
router.delete("/account", authMiddleware, deleteMyAccount);

// Reset database transactions (superadmin only, off unless enabled in .env)
router.post("/reset-database", authMiddleware, authorize([Role.SUPER_ADMIN]), resetDatabase);

export default router;
