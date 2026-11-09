import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Two requests saving the same unique value at once: the second one gets a clear answer
  if ((err as any).code === "P2002") {
    return res.status(409).json({ success: false, message: "Ese dato ya está registrado en otra cuenta." });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${req.method} ${req.url} - Status ${statusCode} - Message: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    // Internal details stay in the server log
    message: statusCode >= 500 && process.env.NODE_ENV !== "development" ? "Error interno del servidor" : message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
