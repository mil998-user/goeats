import { Router } from "express";
import { getClients, createClient, updateClient, deleteClient, getPlatformCustomers } from "./clients.controller";
import { authMiddleware } from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { authorize } from "../../middlewares/rbac";
import { Role } from "@prisma/client";

const router = Router();

// Apply auth and tenant middlewares to all routes
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), getClients);
router.get("/platform-customers", authorize([Role.RESTAURANT_OWNER]), getPlatformCustomers);
router.post("/", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), createClient);
router.put("/:id", authorize([Role.RESTAURANT_OWNER, Role.CAJERO, Role.MOZO]), updateClient);
router.delete("/:id", authorize([Role.RESTAURANT_OWNER]), deleteClient);

export default router;
