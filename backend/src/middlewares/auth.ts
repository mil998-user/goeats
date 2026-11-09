import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { Role } from "@prisma/client";

export interface TokenPayload {
  userId: number;
  username: string;
  role: Role;
  restaurantId: number | null;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      restaurantId?: number; // Injected for multi-tenant
    }
  }
}

// A valid signature isn't enough: the account must still exist and be active.
// Role and restaurant come from the database, so changes apply right away.
export async function getSessionUser(token: string): Promise<TokenPayload | null> {
  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, username: true, role: true, restaurantId: true, isActive: true },
  });
  if (!user || !user.isActive) return null;

  return { userId: user.id, username: user.username, role: user.role, restaurantId: user.restaurantId };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = await getSessionUser(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Token is invalid or expired" });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
