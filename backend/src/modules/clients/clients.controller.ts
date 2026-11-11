import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { Role } from "@prisma/client";

export async function getClients(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { search } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const clients = await prisma.client.findMany({
      where: {
        restaurantId,
        OR: search
          ? [
              { name: { contains: search as string } },
              { identification: { contains: search as string } },
            ]
          : undefined,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({ success: true, clients });
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name, typeId, identification, address, email, phone } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name || !typeId || !identification || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, typeId, identification, email, and phone are required",
      });
    }

    // Check if client already exists by identification in this restaurant
    const existing = await prisma.client.findFirst({
      where: { identification, restaurantId },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Client already exists with this identification" });
    }

    const client = await prisma.client.create({
      data: {
        name,
        typeId,
        identification,
        address: address || "S/N",
        email,
        phone,
        restaurantId,
      },
    });

    return res.status(201).json({ success: true, message: "Client registered successfully", client });
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, typeId, identification, address, email, phone } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const client = await prisma.client.findFirst({ where: { id, restaurantId } });
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: { name, typeId, identification, address, email, phone },
    });

    return res.status(200).json({ success: true, message: "Client updated successfully", client: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const client = await prisma.client.findFirst({ where: { id, restaurantId } });
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    await prisma.client.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getPlatformCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const customers = await prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
        customerOrders: {
          some: {
            restaurantId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        cedula: true,
        isPlus: true,
        customerOrders: {
          where: {
            restaurantId,
          },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                variant: {
                  select: {
                    name: true,
                    menuItem: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Clientes facturados en caja (sin cuenta en la app). "Consumidor final" (07) no es una persona
    const billedClients = await prisma.client.findMany({
      where: { restaurantId, typeId: { not: "07" }, sales: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        identification: true,
        sales: {
          select: {
            order: {
              select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
                items: {
                  select: {
                    id: true,
                    quantity: true,
                    price: true,
                    variant: { select: { name: true, menuItem: { select: { name: true } } } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const knownCedulas = new Set(customers.map((c) => c.cedula).filter(Boolean));
    const fromCashier = billedClients
      .filter((client) => !knownCedulas.has(client.identification))
      .map((client) => ({
        // Id negativo: no choca con los usuarios de la app
        id: -client.id,
        name: client.name,
        email: client.email,
        cedula: client.identification,
        isPlus: false,
        source: "CAJA",
        customerOrders: client.sales.map((sale) => sale.order),
      }));

    const allCustomers = [...customers, ...fromCashier].sort((x, y) => x.name.localeCompare(y.name));

    return res.status(200).json({ success: true, customers: allCustomers });
  } catch (error) {
    next(error);
  }
}
