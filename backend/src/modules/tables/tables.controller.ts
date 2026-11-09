import { Request, Response, NextFunction } from "express";
import os from "os";
import { prisma } from "../../config/database";
import { OrderType } from "@prisma/client";
import { OPEN_TABLE_STATUSES, releaseTable } from "../../utils/tables";

function getLocalIpAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidateIps: { ip: string; priority: number }[] = [];

    for (const name of Object.keys(interfaces)) {
      const lowerName = name.toLowerCase();
      // Skip virtual / internal / container adapters
      const isVirtual =
        lowerName.includes("virtual") ||
        lowerName.includes("vbox") ||
        lowerName.includes("vmware") ||
        lowerName.includes("loopback") ||
        lowerName.includes("pseudo") ||
        lowerName.includes("vethernet") ||
        lowerName.includes("tap") ||
        lowerName.includes("tun") ||
        lowerName.includes("docker") ||
        lowerName.includes("wsl");

      for (const net of interfaces[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          // Exclude APIPA (169.254.x.x) and VirtualBox default host-only (192.168.56.x)
          if (net.address.startsWith("169.254.") || net.address.startsWith("192.168.56.")) {
            continue;
          }

          let priority = 1;
          // Priority to Wi-Fi / WLAN interfaces
          if (
            lowerName.includes("wi-fi") ||
            lowerName.includes("wifi") ||
            lowerName.includes("wlan") ||
            lowerName.includes("wireless")
          ) {
            priority = 10;
          } else if (lowerName.includes("ethernet") && !isVirtual) {
            priority = 5;
          } else if (isVirtual) {
            priority = 0;
          }

          candidateIps.push({ ip: net.address, priority });
        }
      }
    }

    if (candidateIps.length > 0) {
      candidateIps.sort((a, b) => b.priority - a.priority);
      return candidateIps[0].ip;
    }
  } catch (e) {
    // fallback
  }
  return "localhost";
}

// DINING AREAS

export async function getDiningAreas(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }

    const diningAreas = await prisma.diningArea.findMany({
      where: { restaurantId },
      include: {
        tables: true,
      },
    });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        wifiSsid: true,
        wifiPassword: true,
      },
    });

    const localIp = getLocalIpAddress();

    return res.status(200).json({
      success: true,
      diningAreas,
      restaurant,
      serverNetwork: {
        localIp,
        frontendPort: 5173,
        backendPort: 5000,
        suggestedBaseUrl: localIp !== "localhost" ? `http://${localIp}:5173` : `http://localhost:5173`
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createDiningArea(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { name } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!name) {
      return res.status(400).json({ success: false, message: "Dining area name is required" });
    }

    const diningArea = await prisma.diningArea.create({
      data: {
        name,
        restaurantId,
      },
    });

    return res.status(201).json({ success: true, message: "Dining area created successfully", diningArea });
  } catch (error) {
    next(error);
  }
}

export async function updateDiningArea(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const area = await prisma.diningArea.findFirst({ where: { id, restaurantId } });
    if (!area) {
      return res.status(404).json({ success: false, message: "Dining area not found in this restaurant" });
    }

    const updatedArea = await prisma.diningArea.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json({ success: true, message: "Dining area updated", diningArea: updatedArea });
  } catch (error) {
    next(error);
  }
}

export async function deleteDiningArea(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const area = await prisma.diningArea.findFirst({ where: { id, restaurantId } });
    if (!area) {
      return res.status(404).json({ success: false, message: "Dining area not found in this restaurant" });
    }

    await prisma.diningArea.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Dining area and all its tables deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// TABLES

export async function createTable(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    const { number, capacity, diningAreaId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is required" });
    }
    if (!number || !diningAreaId) {
      return res.status(400).json({ success: false, message: "Table number and diningAreaId are required" });
    }

    // Verify dining area belongs to restaurant
    const area = await prisma.diningArea.findFirst({
      where: { id: parseInt(diningAreaId, 10), restaurantId },
    });
    if (!area) {
      return res.status(404).json({ success: false, message: "Dining area not found in this restaurant" });
    }

    const table = await prisma.table.create({
      data: {
        number,
        capacity: capacity ? parseInt(capacity, 10) : 4,
        diningAreaId: area.id,
      },
    });

    return res.status(201).json({ success: true, message: "Table created successfully", table });
  } catch (error) {
    next(error);
  }
}

export async function updateTable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { number, capacity, status } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    // Verify table belongs to restaurant
    const table = await prisma.table.findFirst({
      where: {
        id,
        diningArea: { restaurantId },
      },
    });
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found in this restaurant" });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        number,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        status,
      },
    });

    return res.status(200).json({ success: true, message: "Table updated successfully", table: updatedTable });
  } catch (error) {
    next(error);
  }
}

export async function deleteTable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    // Verify table belongs to restaurant
    const table = await prisma.table.findFirst({
      where: {
        id,
        diningArea: { restaurantId },
      },
    });
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found in this restaurant" });
    }

    await prisma.table.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    next(error);
  }
}


// JOIN TABLES
// A group that needs more seats: the table joins a main table and its open orders move there.
// The bill is charged once at the main table, and paying it frees the whole group
export async function joinTable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const mainId = parseInt(req.body?.intoTableId, 10);
    const restaurantId = req.restaurantId;
    if (isNaN(id) || isNaN(mainId) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Elige la mesa principal." });
    }
    if (id === mainId) {
      return res.status(400).json({ success: false, message: "Una mesa no se puede unir consigo misma." });
    }

    const [table, main] = await Promise.all([
      prisma.table.findFirst({ where: { id, diningArea: { restaurantId } }, include: { joinedTables: { select: { id: true } } } }),
      prisma.table.findFirst({ where: { id: mainId, diningArea: { restaurantId } } }),
    ]);
    if (!table || !main) {
      return res.status(404).json({ success: false, message: "Mesa no encontrada en este restaurante." });
    }
    if (main.joinedToId) {
      return res.status(400).json({ success: false, message: "La mesa principal ya está unida a otra. Elige la principal del grupo." });
    }
    if (table.joinedToId) {
      return res.status(400).json({ success: false, message: "Esta mesa ya está unida a otra. Sepárala primero." });
    }
    if (table.joinedTables.length > 0) {
      return res.status(400).json({ success: false, message: "Esta mesa es principal de un grupo. Une las otras mesas a ella." });
    }

    const moved = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { tableId: id, type: OrderType.DINE_IN, status: { in: OPEN_TABLE_STATUSES } },
        data: { tableId: mainId },
      });
      await tx.table.update({ where: { id }, data: { joinedToId: mainId, status: "OCCUPIED" } });
      await tx.table.update({ where: { id: mainId }, data: { status: "OCCUPIED" } });
      return result.count;
    });

    const io = req.app.get("io");
    if (io) io.to(`restaurant-${restaurantId}`).emit("tables-updated", { tableId: id, mainTableId: mainId });

    return res.status(200).json({
      success: true,
      message: moved > 0
        ? `Mesa ${table.number} unida a la mesa ${main.number}. Sus pedidos pasaron a la mesa ${main.number}.`
        : `Mesa ${table.number} unida a la mesa ${main.number}.`,
      movedOrders: moved,
    });
  } catch (error) {
    next(error);
  }
}

// The joined table goes back to being its own table. Its orders stay on the main table's bill
export async function separateTable(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Mesa no válida." });
    }
    const table = await prisma.table.findFirst({ where: { id, diningArea: { restaurantId } } });
    if (!table) {
      return res.status(404).json({ success: false, message: "Mesa no encontrada en este restaurante." });
    }
    if (!table.joinedToId) {
      return res.status(400).json({ success: false, message: "Esta mesa no está unida a otra." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.table.update({ where: { id }, data: { joinedToId: null } });
      await releaseTable(tx, id);
    });

    const io = req.app.get("io");
    if (io) io.to(`restaurant-${restaurantId}`).emit("tables-updated", { tableId: id });

    return res.status(200).json({ success: true, message: `Mesa ${table.number} separada.` });
  } catch (error) {
    next(error);
  }
}
