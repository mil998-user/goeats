import { Router } from "express";
import {
  joinTable,
  separateTable,
  getDiningAreas,
  createDiningArea,
  updateDiningArea,
  deleteDiningArea,
  createTable,
  updateTable,
  deleteTable,
} from "./tables.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

// Dining Areas routes
router.get("/dining-areas", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getDiningAreas);
router.post("/dining-areas", authorize([Role.RESTAURANT_OWNER]), createDiningArea);
router.put("/dining-areas/:id", authorize([Role.RESTAURANT_OWNER]), updateDiningArea);
router.delete("/dining-areas/:id", authorize([Role.RESTAURANT_OWNER]), deleteDiningArea);

// Tables routes
router.post("/", authorize([Role.RESTAURANT_OWNER]), createTable);
router.put("/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), updateTable);
router.post("/:id(\\d+)/join", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), joinTable);
router.post("/:id(\\d+)/separate", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), separateTable);
router.delete("/:id", authorize([Role.RESTAURANT_OWNER]), deleteTable);

export default router;
