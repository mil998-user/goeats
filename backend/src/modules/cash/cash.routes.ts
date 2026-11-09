import { Router } from "express";
import {
  getCashRegisters,
  createCashRegister,
  updateCashRegister,
  deleteCashRegister,
  getActiveSession,
  openCashSession,
  closeCashSession,
  createExpense,
  createIncome,
  getSessionTransactions,
} from "./cash.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// Cash registers CRUD
router.get("/registers", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getCashRegisters);
router.post("/registers", authorize([Role.RESTAURANT_OWNER]), createCashRegister);
router.put("/registers/:id", authorize([Role.RESTAURANT_OWNER]), updateCashRegister);
router.delete("/registers/:id", authorize([Role.RESTAURANT_OWNER]), deleteCashRegister);

// Sessions
router.get("/sessions/active", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getActiveSession);
router.post("/sessions/open", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), openCashSession);
router.post("/sessions/close", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), closeCashSession);

// Expenses / Incomes
router.post("/expenses", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), createExpense);
router.post("/incomes", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), createIncome);

// Transactions details
router.get("/sessions/:id/transactions", authorize([Role.RESTAURANT_OWNER, Role.CAJERO]), getSessionTransactions);

export default router;
