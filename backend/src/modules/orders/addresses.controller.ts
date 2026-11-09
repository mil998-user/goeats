import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

const MAX_ADDRESSES = 10;

type AddressFields = {
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  floorApartment: string | null;
  secondaryStreet: string | null;
  references: string | null;
};

type Db = Prisma.TransactionClient | typeof prisma;

const optionalText = (value: unknown, max: number) => {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" || value.trim().length > max) return { ok: false, value: null };
  return { ok: true, value: value.trim() || null };
};

// Returns the clean fields, or the message to show
function readAddress(body: any): AddressFields | string {
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label || label.length > 40) return "Ponle un nombre corto a la dirección, por ejemplo Casa o Trabajo.";

  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (address.length < 3 || address.length > 300) return "Escribe la dirección completa.";

  const hasLat = body.latitude !== undefined && body.latitude !== null;
  const hasLng = body.longitude !== undefined && body.longitude !== null;
  if (hasLat !== hasLng) return "La ubicación del mapa no es válida.";
  if (hasLat) {
    const lat = body.latitude;
    const lng = body.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return "La ubicación del mapa no es válida.";
    }
  }

  const floor = optionalText(body.floorApartment, 120);
  const street = optionalText(body.secondaryStreet, 160);
  const references = optionalText(body.references, 500);
  if (!floor.ok || !street.ok || !references.ok) return "Algún dato de la dirección es demasiado largo.";

  return {
    label,
    address,
    latitude: hasLat ? body.latitude : null,
    longitude: hasLng ? body.longitude : null,
    floorApartment: floor.value,
    secondaryStreet: street.value,
    references: references.value,
  };
}

// Checkout and the driver still read the address stored on the user: keep it equal to the default one
async function copyDefaultToUser(db: Db, userId: number) {
  const current = await db.customerAddress.findFirst({
    where: { userId, isDefault: true },
  });
  const user = await db.user.update({
    where: { id: userId },
    data: {
      deliveryAddress: current?.address ?? null,
      deliveryLatitude: current?.latitude ?? null,
      deliveryLongitude: current?.longitude ?? null,
      deliveryFloorApartment: current?.floorApartment ?? null,
      deliverySecondaryStreet: current?.secondaryStreet ?? null,
      deliveryReferences: current?.references ?? null,
    },
  });
  return {
    deliveryAddress: user.deliveryAddress,
    deliveryLatitude: user.deliveryLatitude,
    deliveryLongitude: user.deliveryLongitude,
    deliveryFloorApartment: user.deliveryFloorApartment,
    deliverySecondaryStreet: user.deliverySecondaryStreet,
    deliveryReferences: user.deliveryReferences,
  };
}

const listFor = (db: Db, userId: number) =>
  db.customerAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

// Lock the user's row so two saves at once can't pass the limit or leave two defaults
const lockUser = (tx: Prisma.TransactionClient, userId: number) =>
  tx.$queryRaw`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`;

async function answer(res: Response, status: number, userId: number, profile: Awaited<ReturnType<typeof copyDefaultToUser>>) {
  const addresses = await listFor(prisma, userId);
  return res.status(status).json({ success: true, addresses, profile });
}

export async function getMyAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    const addresses = await listFor(prisma, req.user!.userId);
    return res.status(200).json({ success: true, addresses });
  } catch (error) {
    next(error);
  }
}

export async function createAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const fields = readAddress(req.body);
    if (typeof fields === "string") return res.status(400).json({ success: false, message: fields });

    const result = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);
      const count = await tx.customerAddress.count({ where: { userId } });
      if (count >= MAX_ADDRESSES) return null;

      const makeDefault = count === 0 || req.body.isDefault === true;
      if (makeDefault) {
        await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      }
      await tx.customerAddress.create({ data: { ...fields, userId, isDefault: makeDefault } });
      return copyDefaultToUser(tx, userId);
    });

    if (!result) {
      return res.status(409).json({ success: false, message: `Puedes guardar hasta ${MAX_ADDRESSES} direcciones.` });
    }
    return answer(res, 201, userId, result);
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    const fields = readAddress(req.body);
    if (typeof fields === "string") return res.status(400).json({ success: false, message: fields });

    const updated = await prisma.customerAddress.updateMany({ where: { id, userId }, data: fields });
    if (updated.count === 0) return res.status(404).json({ success: false, message: "Dirección no encontrada" });

    const profile = await copyDefaultToUser(prisma, userId);
    return answer(res, 200, userId, profile);
  } catch (error) {
    next(error);
  }
}

export async function setDefaultAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);

    const profile = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);
      const owned = await tx.customerAddress.findFirst({ where: { id, userId }, select: { id: true } });
      if (!owned) return null;
      await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      await tx.customerAddress.update({ where: { id }, data: { isDefault: true } });
      return copyDefaultToUser(tx, userId);
    });

    if (!profile) return res.status(404).json({ success: false, message: "Dirección no encontrada" });
    return answer(res, 200, userId, profile);
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);

    const profile = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);
      const target = await tx.customerAddress.findFirst({ where: { id, userId } });
      if (!target) return null;
      await tx.customerAddress.delete({ where: { id } });

      // The oldest remaining address takes over as default
      if (target.isDefault) {
        const next = await tx.customerAddress.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
        if (next) await tx.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
      return copyDefaultToUser(tx, userId);
    });

    if (!profile) return res.status(404).json({ success: false, message: "Dirección no encontrada" });
    return answer(res, 200, userId, profile);
  } catch (error) {
    next(error);
  }
}

// The location setup and the profile still save one address: keep it as the default saved one
export async function saveProfileAddressAsDefault(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.deliveryAddress) return;

  const data = {
    address: user.deliveryAddress,
    latitude: user.deliveryLatitude,
    longitude: user.deliveryLongitude,
    floorApartment: user.deliveryFloorApartment?.slice(0, 120) ?? null,
    secondaryStreet: user.deliverySecondaryStreet?.slice(0, 160) ?? null,
    references: user.deliveryReferences,
  };

  await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const current = await tx.customerAddress.findFirst({ where: { userId, isDefault: true } });
    if (current) {
      await tx.customerAddress.update({ where: { id: current.id }, data });
    } else {
      await tx.customerAddress.create({ data: { ...data, userId, label: "Casa", isDefault: true } });
    }
  });
}
