import { Router } from "express";
import { SupportController } from "./support.controller";
import { limitRequests } from "../../utils/rateLimit";

const router = Router();

const limitTickets = limitRequests(5, 60 * 60 * 1000, "Ya recibimos varios mensajes desde esta conexión. Intenta más tarde.");

router.post("/ticket", limitTickets, SupportController.createTicket);

export default router;
