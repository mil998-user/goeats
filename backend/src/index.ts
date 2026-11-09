import dotenv from "dotenv";
dotenv.config({ override: true });

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { env } from "./config/env";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./middlewares/errorHandler";
import { prisma } from "./config/database";
import { setupSocket } from "./config/socket";
import { startDispatchWatcher } from "./modules/delivery/dispatch";

const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: corsOptions,
});

// Middlewares
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(cors(corsOptions));

// Public routes take small bodies, the 50mb limit below is for image uploads with a session
const PUBLIC_FORM_ROUTES = [
  "/api/support",
  "/api/auth/login",
  "/api/auth/social-login",
  "/api/auth/register-owner",
  "/api/auth/register-customer",
  "/api/auth/register-driver",
];
app.use(PUBLIC_FORM_ROUTES, express.json({ limit: "100kb" }));
app.use("/api/restaurants/public", express.json({ limit: "10mb" })); // Carries the transfer receipt
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Socket.io connection handling
setupSocket(io);
// Warns the administrator when a ready delivery waits longer than the configured time
startDispatchWatcher(io);

// Share socket io instance with routers/controllers
app.set("io", io);

// Health check route
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "GoEats API is running and database is connected successfully!",
      environment: env.NODE_ENV,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

import authRouter from "./modules/auth/auth.routes";
import restaurantsRouter from "./modules/restaurants/restaurants.routes";
import tablesRouter from "./modules/tables/tables.routes";
import menuRouter from "./modules/menu/menu.routes";
import ordersRouter from "./modules/orders/orders.routes";
import customerOrdersRouter from "./modules/orders/customer.routes";
import kitchenRouter from "./modules/kitchen/kitchen.routes";
import cashRouter from "./modules/cash/cash.routes";
import salesRouter from "./modules/sales/sales.routes";
import clientsRouter from "./modules/clients/clients.routes";
import inventoryRouter from "./modules/inventory/inventory.routes";
import purchasesRouter from "./modules/purchases/purchases.routes";
import reportsRouter from "./modules/reports/reports.routes";
import deliveryRouter from "./modules/delivery/delivery.routes";
import saasRouter from "./modules/saas/saas.routes";
import saasCategoriesRouter from "./modules/saas-categories/saas-categories.routes";
import notificationsRouter from "./modules/notifications/notification.routes";
import supportRouter from "./modules/support/support.routes";
import ratingsRouter from "./modules/ratings/ratings.routes";
import reservationsRouter from "./modules/reservations/reservations.routes";

// API routes
app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantsRouter);
app.use("/api/tables", tablesRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders/customer", customerOrdersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/kitchen", kitchenRouter);
app.use("/api/cash", cashRouter);
app.use("/api/sales", salesRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/saas", saasRouter);
app.use("/api/saas-categories", saasCategoriesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/support", supportRouter);
app.use("/api/ratings", ratingsRouter);
app.use("/api/reservations", reservationsRouter);


// Global Error Handler
app.use(errorHandler);

// Start server
server.listen(env.PORT, () => {
  console.log(`=============================================`);
  console.log(` GoEats SaaS Backend running on port ${env.PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(`=============================================`);
});
