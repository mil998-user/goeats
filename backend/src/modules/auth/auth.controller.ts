import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { isLocalDatabase } from "../../config/databaseUrl";
import { Role } from "@prisma/client";
import { sendWelcomeEmail } from "../../services/email";
import { NotificationService } from "../notifications/notification.service";
import { verifyGoogleToken, verifyFacebookToken } from "../../services/oauth";
import { safeDeleteUser } from "./user-cleanup.service";
import { AttemptLimiter, sendTooManyAttempts } from "../../utils/rateLimit";
import {
  getAccountError,
  getPasswordError,
  getSameIdentityValues,
  isValidEmail,
  isValidIdentification,
  normalizeIdentification,
} from "../../utils/validation";
import { saveProfileAddressAsDefault } from "../orders/addresses.controller";

// One account per person: an ID and the RUC built from it count as the same person
async function isIdentificationTaken(identification: string, exceptUserId?: number) {
  const taken = await prisma.user.findFirst({
    where: {
      cedula: { in: getSameIdentityValues(identification) },
      ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}),
    },
    select: { id: true },
  });
  return !!taken;
}
import { hideRestaurantSecrets } from "../../utils/safeRestaurant";


const SALT_ROUNDS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginByConnectionAndUser = new AttemptLimiter(8, LOGIN_WINDOW_MS);
const loginByUser = new AttemptLimiter(30, LOGIN_WINDOW_MS);
const loginByConnection = new AttemptLimiter(50, LOGIN_WINDOW_MS);

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const connectionKey = req.ip || "unknown";
    const userKey = username.toLowerCase();
    const connectionAndUserKey = `${connectionKey}|${userKey}`;
    const retryAfter = Math.max(
      loginByConnectionAndUser.retryAfter(connectionAndUserKey),
      loginByUser.retryAfter(userKey),
      loginByConnection.retryAfter(connectionKey)
    );
    if (retryAfter > 0) {
      return sendTooManyAttempts(res, retryAfter, "Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.");
    }

    // Counted before checking the password, so parallel attempts can't slip through
    loginByConnectionAndUser.hit(connectionAndUserKey);
    loginByUser.hit(userKey);
    loginByConnection.hit(connectionKey);

    const user = await prisma.user.findUnique({
      where: { username },
      include: { restaurant: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
    }

    loginByConnectionAndUser.reset(connectionAndUserKey);
    loginByUser.reset(userKey);
    loginByConnection.forgive(connectionKey);

    // Verificación de aprobación según el rol
    if (!user.isActive) {
      if (user.role === Role.MOTORIZADO) {
        return res.status(403).json({
          success: false,
          pendingApproval: true,
          message: "Tu cuenta de repartidor está en proceso de revisión por el equipo administrativo. Te notificaremos por correo electrónico una vez aprobada.",
        });
      }
      if (user.role === Role.RESTAURANT_OWNER) {
        return res.status(403).json({
          success: false,
          pendingApproval: true,
          message: "La solicitud de tu restaurante está en proceso de revisión por el equipo administrativo. Te notificaremos por correo electrónico una vez aprobada.",
        });
      }
      return res.status(403).json({
        success: false,
        message: "Tu cuenta se encuentra inactiva o suspendida. Por favor, comunícate con el administrador.",
      });
    }

    if (user.role === Role.RESTAURANT_OWNER && user.restaurant) {
      if (user.restaurant.status === "PENDING" || user.restaurant.status === "UNDER_REVIEW") {
        return res.status(403).json({
          success: false,
          pendingApproval: true,
          message: "La solicitud de tu restaurante está en proceso de revisión por el equipo administrativo. Te notificaremos por correo electrónico una vez aprobada.",
        });
      }
      if (user.restaurant.status === "REJECTED") {
        return res.status(403).json({
          success: false,
          message: "La solicitud de tu restaurante fue rechazada por el equipo administrativo.",
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const rawPreferences = (user as any).preferencesJson;
    let preferences: string[] = [];
    if (rawPreferences) {
      try {
        preferences = JSON.parse(rawPreferences);
      } catch (e) {
        preferences = [];
      }
    }

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        cedula: user.cedula || null,
        walletBalance: user.walletBalance,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurant?.name || null,
        restaurantSlug: user.restaurant?.slug || null,
        isPlus: user.isPlus,
        preferences,
        phone: user.phone,
        deliveryAddress: user.deliveryAddress,
        deliveryLatitude: user.deliveryLatitude,
        deliveryLongitude: user.deliveryLongitude,
        deliveryFloorApartment: user.deliveryFloorApartment,
        deliverySecondaryStreet: user.deliverySecondaryStreet,
        deliveryReferences: user.deliveryReferences,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, name, email, phone, restaurantName, slug, address } = req.body;

    if (!username || !password || !name || !restaurantName || !slug) {
      return res.status(400).json({
        success: false,
        message: "Username, password, name, restaurantName, and slug are required",
      });
    }

    const accountError = getAccountError({ username, password, name, email, phone });
    if (accountError) {
      return res.status(400).json({ success: false, message: accountError });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username is already taken" });
    }

    // Check if restaurant slug already exists
    const existingRestaurant = await prisma.restaurant.findUnique({ where: { slug } });
    if (existingRestaurant) {
      return res.status(400).json({ success: false, message: "Restaurant slug is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Run in a transaction to create both the restaurant and the owner user
    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          slug: slug.toLowerCase().trim(),
          address: address || null,
          phone: phone || null,
          status: "PENDING", // Queda pendiente de aprobación por el SuperAdmin
        },
      });

      const user = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          email,
          phone: phone || null,
          role: Role.RESTAURANT_OWNER,
          restaurantId: restaurant.id,
          isActive: false, // RESTAURANTE: Requiere aprobación previa del SuperAdmin
        },
      });

      // 1. Create Default Dining Area & Tables
      const diningArea = await tx.diningArea.create({
        data: {
          name: "Salón Principal",
          restaurantId: restaurant.id,
        },
      });

      await tx.table.createMany({
        data: [
          { number: "1", capacity: 4, diningAreaId: diningArea.id },
          { number: "2", capacity: 4, diningAreaId: diningArea.id },
          { number: "3", capacity: 4, diningAreaId: diningArea.id },
        ],
      });

      // 2. Create Default Cash Register
      await tx.cashRegister.create({
        data: {
          name: "Caja Principal POS",
          restaurantId: restaurant.id,
          isActive: true,
        },
      });

      // 3. Create Default Client (Consumidor Final)
      await tx.client.create({
        data: {
          name: "CONSUMIDOR FINAL",
          typeId: "07",
          identification: "9999999999999",
          address: "S/N",
          email: "cf@gmail.com",
          phone: "0999999999",
          restaurantId: restaurant.id,
        },
      });

      // 4. Create Production Areas (Cocina, Bar)
      await tx.productionArea.createMany({
        data: [
          { name: "Cocina", restaurantId: restaurant.id },
          { name: "Bar", restaurantId: restaurant.id },
        ],
      });

      // 5. Create default menu categories
      await tx.menuCategory.create({
        data: {
          name: "General",
          description: "Categoría inicial de platos",
          restaurantId: restaurant.id,
        },
      });

      return { user, restaurant };
    });

    if (result.user.email) {
      NotificationService.notifyRestaurantApplicationReceived(
        { id: result.restaurant.id, name: result.restaurant.name },
        { id: result.user.id, name: result.user.name, email: result.user.email }
      ).catch((err) => console.warn("[Notification] Error restaurante recibido:", err));
    }

    return res.status(201).json({
      success: true,
      message: "Restaurant and owner registered successfully",
      restaurant: result.restaurant,
      user: {
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        role: result.user.role,
        restaurantId: result.user.restaurantId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, name, email, role } = req.body;
    const currentRestaurantId = req.restaurantId;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: "Username, password, name, and role are required" });
    }

    const accountError = getAccountError({ username, password, name, email });
    if (accountError) {
      return res.status(400).json({ success: false, message: accountError });
    }

    if (!Object.values(Role).includes(role) || role === Role.SUPER_ADMIN || role === Role.RESTAURANT_OWNER) {
      return res.status(400).json({ success: false, message: "Invalid staff role specified" });
    }

    if (!currentRestaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is missing" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role,
        restaurantId: currentRestaurantId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Staff member registered successfully",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { restaurant: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const rawPreferences = (user as any).preferencesJson;
    let preferences: string[] = [];
    if (rawPreferences) {
      try {
        preferences = JSON.parse(rawPreferences);
      } catch (e) {
        preferences = [];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: (user as any).phone || null,
        role: user.role,
        cedula: user.cedula || null,
        walletBalance: user.walletBalance,
        restaurantId: user.restaurantId,
        restaurant: user.restaurant ? hideRestaurantSecrets(user.restaurant) : null,
        isPlus: user.isPlus,
        createdAt: user.createdAt,
        preferences,
        deliveryAddress: user.deliveryAddress,
        deliveryLatitude: user.deliveryLatitude,
        deliveryLongitude: user.deliveryLongitude,
        deliveryFloorApartment: user.deliveryFloorApartment,
        deliverySecondaryStreet: user.deliverySecondaryStreet,
        deliveryReferences: user.deliveryReferences,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const userId = req.user.userId;
    const {
      name,
      phone,
      cedula,
      password,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryFloorApartment,
      deliverySecondaryStreet,
      deliveryReferences,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const cleanCedula = normalizeIdentification(cedula);
    if (cedula && !isValidIdentification(cleanCedula, existingUser.role === Role.CUSTOMER)) {
      return res.status(400).json({ success: false, message: "La cédula o el RUC no es válido." });
    }
    if (password) {
      const passwordError = getPasswordError(password);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
    }

    // Validar unicidad de cédula si se proporciona una nueva
    if (cleanCedula && cleanCedula !== existingUser.cedula) {
      if (await isIdentificationTaken(cleanCedula, userId)) {
        return res.status(409).json({
          success: false,
          message: "El número de identificación o cédula ya se encuentra registrado con otra cuenta.",
        });
      }
    }

    const dataToUpdate: any = {};
    if (name !== undefined && name.trim() !== "") {
      dataToUpdate.name = name.trim();
    }
    if (phone !== undefined) {
      dataToUpdate.phone = phone ? phone.trim() : null;
    }
    if (cedula !== undefined) {
      dataToUpdate.cedula = cleanCedula || null;
    }
    if (password && password.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }
    if (deliveryAddress !== undefined) {
      if (typeof deliveryAddress !== "string" || !deliveryAddress.trim()) {
        return res.status(400).json({ success: false, message: "La dirección de entrega es requerida." });
      }
      dataToUpdate.deliveryAddress = deliveryAddress.trim();
    }
    if (deliveryLatitude !== undefined || deliveryLongitude !== undefined) {
      if (!Number.isFinite(deliveryLatitude) || !Number.isFinite(deliveryLongitude)) {
        return res.status(400).json({ success: false, message: "La ubicación del domicilio no es válida." });
      }
      dataToUpdate.deliveryLatitude = deliveryLatitude;
      dataToUpdate.deliveryLongitude = deliveryLongitude;
    }
    if (deliveryFloorApartment !== undefined) {
      dataToUpdate.deliveryFloorApartment = deliveryFloorApartment?.trim() || null;
    }
    if (deliverySecondaryStreet !== undefined) {
      dataToUpdate.deliverySecondaryStreet = deliverySecondaryStreet?.trim() || null;
    }
    if (deliveryReferences !== undefined) {
      dataToUpdate.deliveryReferences = deliveryReferences?.trim() || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { restaurant: true },
    });

    if (updatedUser.role === Role.CUSTOMER && deliveryAddress !== undefined) {
      await saveProfileAddressAsDefault(userId);
    }

    const rawPreferences = (updatedUser as any).preferencesJson;
    let preferences: string[] = [];
    if (rawPreferences) {
      try {
        preferences = JSON.parse(rawPreferences);
      } catch (e) {
        preferences = [];
      }
    }

    return res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: (updatedUser as any).phone || null,
        cedula: updatedUser.cedula || null,
        role: updatedUser.role,
        walletBalance: updatedUser.walletBalance,
        restaurantId: updatedUser.restaurantId,
        restaurantName: updatedUser.restaurant?.name || null,
        restaurantSlug: updatedUser.restaurant?.slug || null,
        isPlus: updatedUser.isPlus,
        createdAt: updatedUser.createdAt,
        preferences,
        deliveryAddress: updatedUser.deliveryAddress,
        deliveryLatitude: updatedUser.deliveryLatitude,
        deliveryLongitude: updatedUser.deliveryLongitude,
        deliveryFloorApartment: updatedUser.deliveryFloorApartment,
        deliverySecondaryStreet: updatedUser.deliverySecondaryStreet,
        deliveryReferences: updatedUser.deliveryReferences,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, name, email, cedula, phone } = req.body;

    if (!username || !password || !name || !cedula) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario, contraseña, nombre y cédula son requeridos.",
      });
    }

    const accountError = getAccountError({ username, password, name, email, phone });
    if (accountError) {
      return res.status(400).json({ success: false, message: accountError });
    }

    const cleanCedula = normalizeIdentification(cedula);
    if (!isValidIdentification(cleanCedula)) {
      return res.status(400).json({ success: false, message: "La cédula o el RUC no es válido." });
    }

    if (await isIdentificationTaken(cleanCedula)) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una cuenta con esta cédula o RUC. Inicia sesión o recupera tu contraseña.",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "El nombre de usuario ya está en uso." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        phone: phone || null,
        cedula: cleanCedula,
        role: Role.CUSTOMER,
        walletBalance: 0.0,
        isActive: true, // CLIENTE: Activo inmediatamente sin requerir aprobación
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    if (user.email) {
      NotificationService.notifyCustomerWelcome({ id: user.id, name: user.name, email: user.email })
        .catch((err) => console.warn("[Notification] Error bienvenida cliente:", err));
    }

    return res.status(201).json({
      success: true,
      message: "Cliente registrado exitosamente",
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        cedula: user.cedula,
        phone: user.phone,
        deliveryAddress: user.deliveryAddress,
        deliveryLatitude: user.deliveryLatitude,
        deliveryLongitude: user.deliveryLongitude,
        deliveryFloorApartment: user.deliveryFloorApartment,
        deliverySecondaryStreet: user.deliverySecondaryStreet,
        deliveryReferences: user.deliveryReferences,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password, name, email, cedula, phone, vehicleType, vehiclePlate } = req.body;

    if (!username || !password || !name || !cedula) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario, contraseña, nombre y cédula son requeridos.",
      });
    }

    const accountError = getAccountError({ username, password, name, email, phone });
    if (accountError) {
      return res.status(400).json({ success: false, message: accountError });
    }

    const cleanCedula = normalizeIdentification(cedula);
    if (!isValidIdentification(cleanCedula, false)) {
      return res.status(400).json({ success: false, message: "La cédula no es válida." });
    }

    if (await isIdentificationTaken(cleanCedula)) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un usuario registrado con esta cédula.",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "El nombre de usuario ya está en uso." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        phone: phone || null,
        vehicleType: vehicleType || "MOTO",
        vehiclePlate: vehiclePlate ? vehiclePlate.toUpperCase().trim() : null,
        cedula: cleanCedula,
        role: Role.MOTORIZADO,
        walletBalance: 0.0,
        isActive: false, // REPARTIDOR: Requiere aprobación previa del SuperAdmin
      },
    });

    if (user.email) {
      NotificationService.notifyDriverWelcome({ id: user.id, name: user.name, email: user.email })
        .catch((err) => console.warn("[Notification] Error bienvenida repartidor:", err));
    }

    return res.status(201).json({
      success: true,
      message: "Motorizado registrado exitosamente",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        cedula: user.cedula,
        phone: user.phone,
        vehicleType: user.vehicleType,
        vehiclePlate: user.vehiclePlate,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
}



export async function resetDatabase(req: any, res: any, next: any) {
  try {
    if (process.env.ALLOW_DATABASE_RESET !== "true") {
      return res.status(403).json({ success: false, message: "El vaciado del sistema está desactivado en este entorno." });
    }

    // La base compartida del equipo nunca se vacía desde el panel, aunque alguien active el permiso.
    if (!isLocalDatabase(env.DATABASE_URL)) {
      return res.status(403).json({ success: false, message: "El vaciado solo se permite con una base local." });
    }

    if (req.body?.confirm !== "VACIAR") {
      return res.status(400).json({ success: false, message: "Debes confirmar escribiendo VACIAR." });
    }

    // Delete transactions in dependency order
    await prisma.$transaction([
      prisma.walletTransaction.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.invoiceItem.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.expense.deleteMany(),
      prisma.income.deleteMany(),
      prisma.cashSession.deleteMany(),
      prisma.inventoryMovement.deleteMany(),
      prisma.purchaseCredit.deleteMany(),
      prisma.purchaseItem.deleteMany(),
      prisma.purchase.deleteMany(),
      
      // Reset statuses
      prisma.table.updateMany({
        data: { status: "FREE" }
      }),
      prisma.user.updateMany({
        data: { walletBalance: 0.0 }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: "El sistema ha sido vaciado por completo de transacciones y estados."
    });
  } catch (error: any) {
    next(error);
  }
}

export async function getStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurantId = req.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant context is missing" });
    }
    const staff = await prisma.user.findMany({
      where: {
        restaurantId,
        role: {
          in: [Role.CAJERO, Role.PRODUCCION, Role.MOZO]
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { name: "asc" }
    });
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    next(error);
  }
}

export async function updateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;
    const { name, email, role, password, isActive } = req.body;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const staff = await prisma.user.findFirst({
      where: {
        id,
        restaurantId,
        role: { in: [Role.CAJERO, Role.PRODUCCION, Role.MOZO] }
      }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    const dataToUpdate: any = {
      name,
      email,
      isActive: isActive !== undefined ? isActive : undefined
    };

    if (role) {
      if (![Role.CAJERO, Role.PRODUCCION, Role.MOZO].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role for staff member" });
      }
      dataToUpdate.role = role;
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "El correo no es válido." });
    }

    if (password && password.trim() !== "") {
      const passwordError = getPasswordError(password);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
      dataToUpdate.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return res.status(200).json({ success: true, message: "Staff member updated successfully", user: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const restaurantId = req.restaurantId;

    if (isNaN(id) || !restaurantId) {
      return res.status(400).json({ success: false, message: "Invalid ID or restaurant context missing" });
    }

    const staff = await prisma.user.findFirst({
      where: {
        id,
        restaurantId,
        role: { in: [Role.CAJERO, Role.PRODUCCION, Role.MOZO] }
      }
    });

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // Someone who already worked keeps their name on orders, dishes and cash: they are deactivated
    const [orders, dishes, sessions, expenses, incomes, purchases] = await Promise.all([
      prisma.order.count({ where: { mozoId: id } }),
      prisma.orderItem.count({ where: { preparedById: id } }),
      prisma.cashSession.count({ where: { userId: id } }),
      prisma.expense.count({ where: { userId: id } }),
      prisma.income.count({ where: { userId: id } }),
      prisma.purchase.count({ where: { userId: id } }),
    ]);
    if (orders + dishes + sessions + expenses + incomes + purchases > 0) {
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { isActive: false } }),
        prisma.cashRegister.updateMany({ where: { assignedUserId: id }, data: { assignedUserId: null } }),
      ]);
      return res.status(200).json({
        success: true,
        deactivated: true,
        message: "Se desactivó la cuenta. Su historial de pedidos y caja se conserva.",
      });
    }

    await prisma.$transaction([
      prisma.cashRegister.updateMany({ where: { assignedUserId: id }, data: { assignedUserId: null } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return res.status(200).json({ success: true, message: "Se eliminó la cuenta." });
  } catch (error) {
    next(error);
  }
}

export async function socialLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { provider, idToken, credential, accessToken, token: socialToken } = req.body;
    const finalProvider = (provider || "").toLowerCase();

    // 1. Principio de seguridad estricta: Requerir OBLIGATORIAMENTE token criptográfico del proveedor
    let profile: { email: string; name: string; avatar?: string; provider: "google" | "facebook" };

    if (finalProvider === "google") {
      const token = idToken || credential || socialToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Acceso no autorizado: Se requiere un Google ID Token válido y firmado para verificar tu identidad.",
        });
      }
      profile = await verifyGoogleToken(token);
    } else if (finalProvider === "facebook") {
      const token = accessToken || socialToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Acceso no autorizado: Se requiere un User Access Token de Facebook emitido por Meta para verificar tu identidad.",
        });
      }
      profile = await verifyFacebookToken(token);
    } else {
      return res.status(400).json({
        success: false,
        message: "Proveedor no soportado. Debe ser 'google' o 'facebook'.",
      });
    }

    // 2. Extraer datos exclusivamente del perfil certificado por el proveedor oficial (evita spoofing)
    const { email, name, avatar } = profile;

    // 3. Protección contra secuestro de cuentas privilegiadas (Account Takeover Prevention)
    // Si ya existe una cuenta con este correo pero con rol administrativo o empleado,
    // bloquear el acceso social y exigir credenciales directas.
    let user = await prisma.user.findFirst({
      where: { email },
      include: { restaurant: true },
    });

    if (user && user.role !== Role.CUSTOMER) {
      return res.status(403).json({
        success: false,
        message: `Esta cuenta pertenece a un perfil con rol ${user.role}. Por principios de seguridad de la plataforma, el personal administrativo y empleados deben ingresar con su usuario y contraseña.`,
      });
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;

      // Generar nombre de usuario seguro y no predecible
      let baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || `comensal_${Date.now()}`;
      let username = baseUsername;

      const existingWithUsername = await prisma.user.findUnique({ where: { username } });
      if (existingWithUsername) {
        username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Generar contraseña criptográfica aleatoria segura (evita contraseñas predecibles)
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const securePassword = await bcrypt.hash(randomSecret, SALT_ROUNDS);

      user = await prisma.user.create({
        data: {
          username,
          password: securePassword,
          name: name || username,
          email,
          role: Role.CUSTOMER,
          walletBalance: 0.0,
        },
        include: { restaurant: true },
      });
    }

    if (isNewUser && user.email) {
      NotificationService.notifyCustomerWelcome({ id: user.id, name: user.name, email: user.email }).catch(() => {});
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const rawPreferences = (user as any).preferencesJson;
    let preferences: string[] = [];
    if (rawPreferences) {
      try {
        preferences = JSON.parse(rawPreferences);
      } catch (e) {
        preferences = [];
      }
    }

    return res.status(200).json({
      success: true,
      isNewUser,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        cedula: user.cedula || null,
        walletBalance: user.walletBalance,
        isPlus: user.isPlus,
        avatar: avatar || null,
        provider: finalProvider,
        preferences,
        phone: user.phone,
        deliveryAddress: user.deliveryAddress,
        deliveryLatitude: user.deliveryLatitude,
        deliveryLongitude: user.deliveryLongitude,
        deliveryFloorApartment: user.deliveryFloorApartment,
        deliverySecondaryStreet: user.deliverySecondaryStreet,
        deliveryReferences: user.deliveryReferences,
      },
    });
  } catch (error: any) {
    console.error("Fallo de seguridad en autenticación social:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Error al verificar credenciales con el proveedor.",
    });
  }
}

export async function savePreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const { preferences } = req.body;
    const userId = req.user?.userId;

    if (userId && preferences && Array.isArray(preferences)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferencesJson: JSON.stringify(preferences),
        } as any,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Preferencias gastronómicas guardadas exitosamente",
      preferences: preferences || [],
    });
  } catch (error) {
    next(error);
  }
}

export async function completeProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { preferences } = req.body;
    const userId = (req as any).user?.userId;

    if (userId && preferences && Array.isArray(preferences)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferencesJson: JSON.stringify(preferences),
        } as any,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Preferencias guardadas con éxito",
      preferences: preferences || [],
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, restaurantId: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // A17: a restaurant can't be left open without an owner
    if (user.role === Role.RESTAURANT_OWNER && user.restaurantId) {
      const otherOwners = await prisma.user.count({
        where: { restaurantId: user.restaurantId, role: Role.RESTAURANT_OWNER, isActive: true, id: { not: user.id } },
      });
      if (otherOwners === 0) {
        return res.status(409).json({
          success: false,
          message: "Tu local quedaría sin dueño. Pide al administrador de GoEats que lo dé de baja o lo pase a otra persona.",
        });
      }
    }

    // Proteger cuenta SUPER_ADMIN para evitar dejar el sistema sin administrador
    if (user.role === Role.SUPER_ADMIN) {
      const superAdminCount = await prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
      if (superAdminCount <= 1) {
        return res.status(403).json({
          success: false,
          message: "No puedes eliminar la única cuenta de Super Administrador del sistema.",
        });
      }
    }

    const result = await safeDeleteUser(userId);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error || "Error al eliminar la cuenta" });
    }

    return res.status(200).json({
      success: true,
      message: "Tu cuenta ha sido eliminada permanentemente.",
    });
  } catch (error) {
    next(error);
  }
}
