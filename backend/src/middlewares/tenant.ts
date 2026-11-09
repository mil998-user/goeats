import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const requestedTenant = req.headers["x-restaurant-id"];

  // Only SuperAdmin can choose a restaurant; it may also operate without one on some endpoints
  if (user.role === Role.SUPER_ADMIN) {
    if (!requestedTenant) {
      return next();
    }

    const restaurantId = Number(requestedTenant);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid x-restaurant-id header value" });
    }

    req.restaurantId = restaurantId;
    return next();
  }

  // Customers and drivers don't belong to a restaurant, so these routes are not for them
  if (user.role === Role.CUSTOMER || user.role === Role.MOTORIZADO || !user.restaurantId) {
    return res.status(403).json({ success: false, message: "Forbidden: Restaurant access required" });
  }

  // The restaurant always comes from the signed token, the header can't change it
  if (requestedTenant && requestedTenant !== user.restaurantId.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden: Access denied to this restaurant" });
  }

  req.restaurantId = user.restaurantId;
  next();
}
