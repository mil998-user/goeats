import { getEffectivePrice, isPromoActive, toSaleVariant } from "../../utils/promotions";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { OrderType, OrderStatus, OrderItemStatus, RestaurantStatus } from "@prisma/client";

// Only approved, active restaurants are visible to the public (marketplace, catalog, QR)
const PUBLIC_RESTAURANT = { isActive: true, status: { in: [RestaurantStatus.APPROVED, RestaurantStatus.ACTIVE] } };
import { getSessionUser } from "../../middlewares/auth";
import { NotificationService } from "../notifications/notification.service";
import { getActiveDeliveryRate } from "../delivery/delivery.controller";
import { calculateShippingCost, getShippingDistanceKm } from "../../utils/shipping";
import { getRestaurantAverages } from "../ratings/ratings.controller";
import { parseAmount, simulatedPaymentsAllowed } from "../../utils/validation";
import { hideRestaurantSecrets } from "../../utils/safeRestaurant";
import { hideDeliveryPin, MAX_TIP } from "../../utils/orderRules";
import { resolveOrderTable } from "../../utils/tables";
import { canEncryptSecrets, encryptSecret } from "../../utils/secrets";
import { buildMapIframe, getMapEmbedUrl, isGoogleMapsLink } from "../../utils/maps";

const MAX_MAP_REDIRECTS = 5;
const MAP_LOOKUP_TIMEOUT_MS = 8000;

// Every hop is checked, so a link can't redirect the server to another host
async function followMapsLink(startUrl: string) {
  let currentUrl = startUrl;

  for (let hop = 0; hop <= MAX_MAP_REDIRECTS; hop += 1) {
    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(MAP_LOOKUP_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es,en;q=0.9",
      },
    });

    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) {
      return { resolvedUrl: currentUrl, htmlBody: await response.text() };
    }

    const nextUrl = new URL(location, currentUrl).toString();
    if (!isGoogleMapsLink(nextUrl)) {
      return { resolvedUrl: currentUrl, htmlBody: "" };
    }
    currentUrl = nextUrl;
  }

  return { resolvedUrl: currentUrl, htmlBody: "" };
}

// Only Google Maps links and embeds are stored, always rebuilt by the server
function normalizeMapValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  if (/<iframe\b/i.test(trimmed)) {
    const embedUrl = getMapEmbedUrl(trimmed);
    return embedUrl ? { value: buildMapIframe(embedUrl) } : { error: true };
  }
  return isGoogleMapsLink(trimmed) ? { value: trimmed } : { error: true };
}


// IVA rates a restaurant can choose. 15 % is the general rate in Ecuador
export const TAX_RATES = [0, 5, 12, 15] as const;

export async function getAllRestaurants(req: Request, res: Response, next: NextFunction) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: { id: true, username: true, name: true, role: true, email: true, phone: true, isActive: true },
        },
        issuer: true,
      },
    });

    return res.status(200).json({ success: true, restaurants: restaurants.map(hideRestaurantSecrets) });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID" });
    }

    // Tenant check: staff can only view their own restaurant
    if (req.user && req.user.role !== "SUPER_ADMIN" && req.user.restaurantId !== id) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied to this restaurant" });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        issuer: true,
        categories: true,
        subcategories: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    return res.status(200).json({ success: true, restaurant: hideRestaurantSecrets(restaurant) });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurant(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant ID" });
    }

    // Tenant check
    if (req.user && req.user.role !== "SUPER_ADMIN" && req.user.restaurantId !== id) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied to this restaurant" });
    }

    const {
      name,
      logo,
      address,
      phone,
      wifiSsid,
      wifiPassword,
      qrOrderingEnabled,
      isActive,
      payphoneToken,
      bankAccountsJson,
      coverImage,
      description,
      mapLatitude,
      mapLongitude,
      mapIframe,
      reference,
      openingHours,
      faqsJson,
      samePriceAsLocal,
      promoText,
      taxRate,
      waiterCallEnabled,
      waiterCallWaitMin,
      payBeforeEating,
      reservationsEnabled,
      categoryIds,
      subcategoryIds,
    } = req.body;

    // Restaurant options: only real booleans, and a waiter call wait from 0 to 30 minutes
    for (const [label, value] of [["llamado al mesero", waiterCallEnabled], ["pagar antes de comer", payBeforeEating], ["reservas", reservationsEnabled]] as const) {
      if (value !== undefined && typeof value !== "boolean") {
        return res.status(400).json({ success: false, message: `La opción de ${label} no es válida.` });
      }
    }
    if (waiterCallWaitMin !== undefined && !(Number.isInteger(waiterCallWaitMin) && waiterCallWaitMin >= 0 && waiterCallWaitMin <= 30)) {
      return res.status(400).json({ success: false, message: "La espera entre llamados debe ser de 0 a 30 minutos." });
    }

    if (typeof promoText === "string" && promoText.length > 191) {
      return res.status(400).json({ success: false, message: "La oferta no puede superar 191 caracteres." });
    }

    if (taxRate !== undefined && !(typeof taxRate === "number" && (TAX_RATES as readonly number[]).includes(taxRate))) {
      return res.status(400).json({ success: false, message: "La tasa de IVA debe ser 0, 5, 12 o 15 %." });
    }

    const parsedLat = (mapLatitude !== undefined && mapLatitude !== null && mapLatitude !== "") ? parseFloat(mapLatitude) : null;
    const parsedLng = (mapLongitude !== undefined && mapLongitude !== null && mapLongitude !== "") ? parseFloat(mapLongitude) : null;
    const hasInvalidCoordinates =
      (parsedLat !== null && (!Number.isFinite(parsedLat) || Math.abs(parsedLat) > 90)) ||
      (parsedLng !== null && (!Number.isFinite(parsedLng) || Math.abs(parsedLng) > 180));
    if (hasInvalidCoordinates) {
      return res.status(400).json({ success: false, message: "Las coordenadas del mapa no son válidas." });
    }

    let finalMapIframe: string | null | undefined = undefined;
    if (typeof mapIframe === "string") {
      const normalized = normalizeMapValue(mapIframe);
      if (normalized.error) {
        return res.status(400).json({ success: false, message: "El mapa debe ser un enlace o iframe de Google Maps." });
      }
      finalMapIframe = normalized.value;
    }
    if (parsedLat && parsedLng && (!finalMapIframe || !finalMapIframe.includes("<iframe"))) {
      finalMapIframe = buildMapIframe(`https://maps.google.com/maps?q=${parsedLat},${parsedLng}&z=16&output=embed`);
    }

    // The field comes empty when the owner doesn't replace the saved token
    const newPayphoneToken = typeof payphoneToken === "string" ? payphoneToken.trim() : "";
    if (newPayphoneToken && !canEncryptSecrets()) {
      return res.status(400).json({
        success: false,
        message: "No se puede guardar el token: falta configurar DATA_ENCRYPTION_KEY en el servidor.",
      });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name,
        logo,
        address,
        phone,
        wifiSsid,
        wifiPassword,
        qrOrderingEnabled,
        payphoneToken: newPayphoneToken ? encryptSecret(newPayphoneToken) : undefined,
        bankAccountsJson,
        coverImage,
        description,
        // A partial update (for example, only one option) keeps the saved location
        mapLatitude: mapLatitude === undefined ? undefined : parsedLat,
        mapLongitude: mapLongitude === undefined ? undefined : parsedLng,
        mapIframe: finalMapIframe,
        reference,
        openingHours,
        faqsJson,
        samePriceAsLocal: typeof samePriceAsLocal === "boolean" ? samePriceAsLocal : undefined,
        promoText: typeof promoText === "string" ? (promoText.trim() || null) : undefined,
        taxRate,
        waiterCallEnabled,
        waiterCallWaitMin,
        payBeforeEating,
        reservationsEnabled,
        categories: categoryIds ? { set: categoryIds.map((cid: number) => ({ id: cid })) } : undefined,
        subcategories: subcategoryIds ? { set: subcategoryIds.map((sid: number) => ({ id: sid })) } : undefined,
        isActive: req.user?.role === "SUPER_ADMIN" ? isActive : undefined, // Only SuperAdmin can activate/deactivate
        status: (req.user?.role === "SUPER_ADMIN" && req.body.status) ? req.body.status : undefined,
      },
      include: {
        users: {
          where: { role: "RESTAURANT_OWNER" },
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Notificaciones por cambio de estado del restaurante (Sección 4 y 5 del Plan)
    if (req.user?.role === "SUPER_ADMIN" && (req.body.status === "APPROVED" || req.body.status === "ACTIVE")) {
      await prisma.user.updateMany({ where: { restaurantId: restaurant.id, role: "RESTAURANT_OWNER" }, data: { isActive: true } });
    }
    if (req.body.status && restaurant.users.length > 0) {
      const owner = restaurant.users[0];
      if (owner.email) {
        if (req.body.status === "APPROVED") {
          NotificationService.notifyRestaurantApproved(
            { id: restaurant.id, name: restaurant.name },
            { id: owner.id, name: owner.name, email: owner.email }
          ).catch((e) => console.warn("[Email] Error approved restaurant:", e));
        } else if (req.body.status === "REJECTED") {
          await prisma.user.updateMany({
            where: { restaurantId: restaurant.id, role: "RESTAURANT_OWNER" },
            data: { isActive: false },
          });
          NotificationService.notifyRestaurantRejected(
            { id: restaurant.id, name: restaurant.name },
            { id: owner.id, name: owner.name, email: owner.email },
            req.body.rejectReason
          ).catch((e) => console.warn("[Email] Error rejected restaurant:", e));
        } else if (req.body.status === "UNDER_REVIEW") {
          NotificationService.notifyRestaurantUnderReview(
            { id: restaurant.id, name: restaurant.name },
            { id: owner.id, name: owner.name, email: owner.email }
          ).catch((e) => console.warn("[Email] Error under review restaurant:", e));
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant configuration updated successfully",
      restaurant: hideRestaurantSecrets(restaurant),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicRestaurantCatalog(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: slug.toLowerCase().trim(), ...PUBLIC_RESTAURANT },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        phone: true,
        wifiSsid: true,
        wifiPassword: true,
        qrOrderingEnabled: true,
        waiterCallEnabled: true,
        waiterCallWaitMin: true,
        payBeforeEating: true,
        reservationsEnabled: true,
        bankAccountsJson: true,
        coverImage: true,
        description: true,
        mapLatitude: true,
        mapLongitude: true,
        mapIframe: true,
        reference: true,
        openingHours: true,
        faqsJson: true,
        categories: {
          select: { id: true, name: true }
        },
        subcategories: {
          select: { id: true, name: true }
        }
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found or inactive" });
    }

    // The four lookups below do not depend on each other, so they run together:
    // with a remote database each one costs a full round trip
    const [diningAreas, menuCategories, deliveryRate, ratings] = await Promise.all([
    // Load active dining areas & tables
    prisma.diningArea.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        tables: {
          select: { id: true, number: true, status: true },
        },
      },
    }),

    // Load menu categories and items (excluding recipes & internal cost detail)
    prisma.menuCategory.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        items: {
          where: { isActive: true },
          include: {
            variants: {
              select: { id: true, name: true, price: true, promoPrice: true, promoEndsAt: true, stockLimit: true, options: true },
            },
          },
        },
      },
    }),
      getActiveDeliveryRate(),
      getRestaurantAverages([restaurant.id]),
    ]);

    // The Wi-Fi password is only for people at a table of this restaurant
    const tableId = Number(req.query.tableId);
    const isAtTable = diningAreas.some((area) => area.tables.some((table) => table.id === tableId));
    const { basePrice, pricePerKm } = deliveryRate;
    const now = new Date();
    const rating = ratings.get(restaurant.id);

    return res.status(200).json({
      success: true,
      restaurant: {
        ...restaurant,
        wifiPassword: isAtTable ? restaurant.wifiPassword : null,
        ratingAverage: rating?.average ?? null,
        ratingCount: rating?.count ?? 0,
      },
      diningAreas,
      // Buyers see the price of today; during a promotion, also the normal one
      menuCategories: menuCategories.map((category) => ({
        ...category,
        // Un plato sin presentación de precio no se puede vender: no se muestra
        items: category.items
          .filter((item) => item.variants.length > 0)
          .map((item) => ({
            ...item,
            variants: item.variants.map((variant) => toSaleVariant(variant, now)),
          })),
      })),
      deliveryRate: { basePrice, pricePerKm },
    });
  } catch (error) {
    next(error);
  }
}

// The public list is the same for every visitor and changes rarely, so it is kept for a few seconds
// instead of asking the database on every visit. PUBLIC_LIST_CACHE_SECONDS=0 turns it off.
const PUBLIC_LIST_CACHE_MS = Math.max(0, Number(process.env.PUBLIC_LIST_CACHE_SECONDS ?? 30)) * 1000 || 0;
let publicListCache: { expiresAt: number; restaurants: unknown[] } | null = null;

export async function getPublicRestaurantList(req: Request, res: Response, next: NextFunction) {
  try {
    if (publicListCache && publicListCache.expiresAt > Date.now()) {
      return res.status(200).json({ success: true, restaurants: publicListCache.restaurants });
    }

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const restaurants = await prisma.restaurant.findMany({
      where: PUBLIC_RESTAURANT,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        coverImage: true,
        description: true,
        address: true,
        phone: true,
        createdAt: true,
        samePriceAsLocal: true,
        promoText: true,
        categories: {
          select: { id: true, name: true }
        },
        subcategories: {
          select: { id: true, name: true }
        }
      },
    });

    const restaurantIds = restaurants.map((restaurant) => restaurant.id);
    const now = new Date();
    // Independent lookups run together to save round trips to the database
    const [weeklyOrderCounts, promoDishes, ratings] = await Promise.all([
      prisma.order.groupBy({
        by: ["restaurantId"],
        where: {
          restaurantId: { in: restaurantIds },
          createdAt: { gte: startOfWeek },
          status: { not: OrderStatus.CANCELLED },
        },
        _count: { _all: true },
      }),
      // Restaurants with a dish on promotion today appear among the offers
      prisma.menuItemVariant.findMany({
        where: {
          promoPrice: { not: null },
          promoEndsAt: { gt: now },
          menuItem: { isActive: true, category: { restaurantId: { in: restaurantIds } } },
        },
        select: { price: true, promoPrice: true, promoEndsAt: true, menuItem: { select: { category: { select: { restaurantId: true } } } } },
      }),
      getRestaurantAverages(restaurantIds),
    ]);
    const orderCountByRestaurantId = new Map(
      weeklyOrderCounts.map((entry) => [entry.restaurantId, entry._count._all])
    );
    const withPromo = new Set(
      promoDishes.filter((dish) => isPromoActive(dish, now)).map((dish) => dish.menuItem.category.restaurantId)
    );

    const list = restaurants.map((restaurant) => ({
      ...restaurant,
      ratingAverage: ratings.get(restaurant.id)?.average ?? null,
      ratingCount: ratings.get(restaurant.id)?.count ?? 0,
      promoText: restaurant.promoText || (withPromo.has(restaurant.id) ? "Platos en promoción" : null),
      ordersThisWeek: orderCountByRestaurantId.get(restaurant.id) || 0,
    }));
    if (PUBLIC_LIST_CACHE_MS > 0) {
      publicListCache = { expiresAt: Date.now() + PUBLIC_LIST_CACHE_MS, restaurants: list };
    }

    return res.status(200).json({ success: true, restaurants: list });
  } catch (error) {
    next(error);
  }
}

export async function createPublicOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { 
      type, 
      tableId, 
      customerName, 
      comments, 
      items, 
      deliveryAddress, 
      deliveryReference,
      deliveryObservation,
      deliveryPhone, 
      deliveryLat, 
      deliveryLng, 
      paymentMethod, 
      paymentReceipt, 
      payphoneTransactionId,
      tipAmount 
    } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: slug.toLowerCase().trim(), ...PUBLIC_RESTAURANT }
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found or inactive" });
    }

    if (!type || !customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Type, customerName, and non-empty items are required" });
    }

    if (type !== "DINE_IN" && type !== "TAKEOUT" && type !== "DELIVERY") {
      return res.status(400).json({ success: false, message: "Invalid order type" });
    }

    const typeEnum = type === "DINE_IN" ? OrderType.DINE_IN : (type === "TAKEOUT" ? OrderType.TAKEOUT : OrderType.DELIVERY);
    const method = paymentMethod || "CASH";

    if (method !== "CASH" && method !== "CARD" && method !== "TRANSFER") {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    if (typeEnum === OrderType.DELIVERY && (!deliveryAddress || !deliveryPhone)) {
      return res.status(400).json({ success: false, message: "Delivery address and phone are required" });
    }

    const parsedDeliveryLat = typeEnum === OrderType.DELIVERY && deliveryLat != null ? Number(deliveryLat) : null;
    const parsedDeliveryLng = typeEnum === OrderType.DELIVERY && deliveryLng != null ? Number(deliveryLng) : null;
    const hasInvalidCoordinates =
      (parsedDeliveryLat !== null && !(Math.abs(parsedDeliveryLat) <= 90)) ||
      (parsedDeliveryLng !== null && !(Math.abs(parsedDeliveryLng) <= 180));

    if (hasInvalidCoordinates) {
      return res.status(400).json({ success: false, message: "Invalid delivery coordinates" });
    }

    if (typeEnum !== OrderType.DINE_IN && method === "CARD") {
      if (!simulatedPaymentsAllowed()) {
        return res.status(400).json({ success: false, message: "El pago con tarjeta aún no está disponible." });
      }
      if (!payphoneTransactionId) {
        return res.status(400).json({ success: false, message: "Card transaction ID is required" });
      }
    }

    if (typeEnum !== OrderType.DINE_IN && method === "TRANSFER" && !paymentReceipt) {
      return res.status(400).json({ success: false, message: "Payment receipt is required" });
    }

    if (typeEnum === OrderType.DINE_IN) {
      if (!restaurant.qrOrderingEnabled) {
        return res.status(400).json({ success: false, message: "Dine-in QR ordering is disabled for this restaurant" });
      }
      if (!tableId) {
        return res.status(400).json({ success: false, message: "Table ID is required for dine-in orders" });
      }
    }

    // Optional tip for the driver, only on deliveries. It is not part of the total nor of the IVA
    let tip = 0;
    if (typeEnum === OrderType.DELIVERY && tipAmount !== undefined && tipAmount !== null && tipAmount !== "" && Number(tipAmount) !== 0) {
      const parsedTip = parseAmount(tipAmount);
      if (parsedTip === null || parsedTip > MAX_TIP) {
        return res.status(400).json({ success: false, message: `La propina debe ser de $0 a ${MAX_TIP}.` });
      }
      tip = parsedTip;
    }

    let initialStatus: OrderStatus = OrderStatus.PENDING;
    let finalPaymentStatus = "PENDING";

    if (typeEnum === OrderType.DINE_IN) {
      // A restaurant that charges first keeps the table order waiting for the register
      initialStatus = restaurant.payBeforeEating ? OrderStatus.PENDING : OrderStatus.PREPARING;
    } else {
      if (method === "CASH" || method === "CARD") {
        initialStatus = OrderStatus.PREPARING;
        if (method === "CARD") {
          finalPaymentStatus = "APPROVED";
        }
      } else if (method === "TRANSFER") {
        initialStatus = OrderStatus.PENDING;
        finalPaymentStatus = "PENDING";
      }
    }

    // Optional customer token check
    let customerId: number | null = null;
    let isPlusClient = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const session = await getSessionUser(authHeader.split(" ")[1]);
      if (session) {
        customerId = session.userId;

        const orderingUser = await prisma.user.findUnique({
          where: { id: customerId }
        });
        if (orderingUser && orderingUser.isPlus) {
          isPlusClient = true;
        }
      }
    }

    // The server decides the shipping price, the browser only shows it
    let costEnvio = 0;
    if (typeEnum === OrderType.DELIVERY && !isPlusClient) {
      const rate = await getActiveDeliveryRate();
      const distanceKm = getShippingDistanceKm(
        restaurant.mapLatitude,
        restaurant.mapLongitude,
        parsedDeliveryLat,
        parsedDeliveryLng
      );
      costEnvio = calculateShippingCost(rate, distanceKm);
    }

    // Run transaction
    const order = await prisma.$transaction(async (tx) => {
      let calculatedTotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const variantId = parseInt(item.variantId, 10);
        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
          throw new Error("Item quantity must be a whole number between 1 and 99");
        }

        const variant = await tx.menuItemVariant.findFirst({
          where: { id: variantId, menuItem: { isActive: true, category: { restaurantId: restaurant.id } } },
        });

        if (!variant) {
          throw new Error("Uno de los platos ya no está disponible. Actualiza el menú e inténtalo de nuevo.");
        }

        // The server charges the promotion while it lasts
        const price = getEffectivePrice(variant);
        const subtotal = price * quantity;
        calculatedTotal += subtotal;

        orderItemsData.push({
          variantId,
          quantity,
          price,
          comments: item.comments || null,
          status: OrderItemStatus.PENDING,
        });
      }

      // Dine-in table handling. A joined table sends the order to the main table of the group
      let orderTableId: number | null = null;
      if (typeEnum === OrderType.DINE_IN && tableId) {
        const parsedTableId = parseInt(tableId, 10);
        orderTableId = await resolveOrderTable(tx, parsedTableId, restaurant.id);

        if (!orderTableId) {
          throw new Error(`Table ID ${parsedTableId} not found`);
        }

        // Set table status to occupied
        await tx.table.update({
          where: { id: orderTableId },
          data: { status: "OCCUPIED" },
        });
      }

      // Create the order
      const generatedPin = typeEnum === OrderType.DELIVERY ? Math.floor(1000 + Math.random() * 9000).toString() : null;

      const newOrder = await tx.order.create({
        data: {
          type: typeEnum,
          status: initialStatus,
          tableId: orderTableId,
          mozoId: null, // public order has no waiter
          customerId: customerId, // link to customer if authenticated
          customerName,
          comments,
          shippingCost: costEnvio,
          total: calculatedTotal + costEnvio,
          tipAmount: tip,
          deliveryAddress: typeEnum === OrderType.DELIVERY 
            ? (deliveryReference && !deliveryAddress?.includes("Ref:") ? `${deliveryAddress} (Ref: ${deliveryReference})` : deliveryAddress)
            : null,
          deliveryObservation: typeEnum === OrderType.DELIVERY 
            ? (deliveryReference || deliveryObservation || null)
            : null,
          deliveryPhone: typeEnum === OrderType.DELIVERY ? deliveryPhone : null,
          deliveryLat: parsedDeliveryLat,
          deliveryLng: parsedDeliveryLng,
          deliveryPin: generatedPin,
          restaurantId: restaurant.id,
          paymentMethodString: method,
          paymentReceipt: paymentReceipt || null,
          paymentStatus: finalPaymentStatus,
          payphoneTransactionId: payphoneTransactionId || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { menuItem: true },
              },
            },
          },
          table: true,
          mozo: {
            select: { id: true, name: true, role: true },
          },
          customer: {
            select: { id: true, name: true, role: true, isPlus: true },
          },
        },
      });

      return newOrder;
    });

    // Send real-time Socket notification to kitchen and cashiers
    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurant.id}`).emit("new-order", hideDeliveryPin(order));
      console.log(`[Socket] Emitted public new-order for restaurant-${restaurant.id}`);
    }

    // Disparar notificaciones por correo (Cliente & Restaurante)
    (async () => {
      try {
        // Notificar al cliente si tenemos su email
        const targetEmail = (customerId ? (await prisma.user.findUnique({ where: { id: customerId }, select: { email: true } }))?.email : null) || req.body.customerEmail;
        if (targetEmail) {
          NotificationService.notifyOrderCreated(
            { id: order.id, total: order.total, deliveryAddress: order.deliveryAddress, restaurant: { name: restaurant.name } },
            { id: customerId || undefined, name: order.customerName, email: targetEmail }
          ).catch((e) => console.warn("[Email] Error customer order created:", e));
        }

        // Notificar al dueño del restaurante
        const owner = await prisma.user.findFirst({
          where: { restaurantId: restaurant.id, role: "RESTAURANT_OWNER" },
          select: { id: true, name: true, email: true },
        });
        if (owner && owner.email) {
          NotificationService.notifyRestaurantNewOrder(
            { id: restaurant.id, name: restaurant.name },
            owner,
            { id: order.id, total: order.total, type: order.type, customerName: order.customerName }
          ).catch((e) => console.warn("[Email] Error restaurant new order:", e));
        }
      } catch (err) {
        console.warn("[Email] Error dispatching order creation emails:", err);
      }
    })();

    return res.status(201).json({ success: true, message: "Public order created successfully", order });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Failed to create order" });
  }
}

// Last call of each table, so a table waits the time its restaurant chose before calling again.
// In memory: it resets on restart, which only means one extra call is let through
const lastTableCalls = new Map<string, number>();
const MAX_TRACKED_TABLE_CALLS = 20000;

function getCallWaitSeconds(key: string, waitMinutes: number, now = Date.now()) {
  const last = lastTableCalls.get(key);
  if (!last || waitMinutes <= 0) return 0;
  return Math.max(0, Math.ceil((last + waitMinutes * 60000 - now) / 1000));
}

function rememberTableCall(key: string, now = Date.now()) {
  if (lastTableCalls.size >= MAX_TRACKED_TABLE_CALLS) {
    const oldest = lastTableCalls.keys().next().value;
    if (oldest !== undefined) lastTableCalls.delete(oldest);
  }
  lastTableCalls.delete(key);
  lastTableCalls.set(key, now);
}

export async function callWaiterFromTable(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { tableId, action } = req.body; // action: "CALL" | "BILL"

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: slug.toLowerCase().trim(), ...PUBLIC_RESTAURANT },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
    }

    const parsedTableId = parseInt(tableId, 10);
    if (isNaN(parsedTableId)) {
      return res.status(400).json({ success: false, message: "ID de mesa inválido" });
    }

    const table = await prisma.table.findFirst({
      where: { id: parsedTableId, diningArea: { restaurantId: restaurant.id } },
      include: { diningArea: true },
    });

    if (!table) {
      return res.status(404).json({ success: false, message: "Mesa no encontrada en este restaurante" });
    }

    const isBill = action === "BILL";
    if (!isBill && !restaurant.waiterCallEnabled) {
      return res.status(400).json({ success: false, message: "Este restaurante no tiene activado el llamado al mesero." });
    }

    const callKey = `${restaurant.id}:${table.id}:${isBill ? "BILL" : "CALL"}`;
    // The bill can be asked again sooner: 2 minutes at most
    const waitSeconds = getCallWaitSeconds(callKey, isBill ? Math.min(2, restaurant.waiterCallWaitMin) : restaurant.waiterCallWaitMin);
    if (waitSeconds > 0) {
      const minutes = Math.ceil(waitSeconds / 60);
      res.setHeader("Retry-After", String(waitSeconds));
      return res.status(429).json({
        success: false,
        retryAfterSeconds: waitSeconds,
        message: isBill
          ? `Ya pediste la cuenta. Podrás volver a pedirla en ${minutes} min.`
          : `Ya avisamos al mesero. Podrás volver a llamar en ${minutes} min.`,
      });
    }
    rememberTableCall(callKey);

    const notifType = isBill ? "BILL" : "CALL_WAITER";
    const title = isBill ? " ¡Solicitud de Cuenta!" : " ¡Llamado de Mesa!";
    const message = isBill
      ? `La Mesa ${table.number} (${table.diningArea.name}) está solicitando la cuenta para pagar.`
      : `La Mesa ${table.number} (${table.diningArea.name}) solicita la atención de un mesero.`;

    const io = req.app.get("io");
    if (io) {
      io.to(`restaurant-${restaurant.id}`).emit("waiter-order-notification", {
        type: notifType,
        tableId: table.id,
        tableNumber: String(table.number),
        tableName: `Mesa ${table.number}`,
        title,
        message,
        restaurantId: restaurant.id,
        timestamp: new Date().toISOString(),
      });
      console.log(`[Socket] Emitted ${notifType} for restaurant-${restaurant.id}, table ${table.number}`);
    }

    return res.status(200).json({
      success: true,
      message: isBill ? "Solicitud de cuenta enviada a caja" : "Llamado enviado al personal de servicio",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resuelve cualquier enlace de Google Maps (incluyendo links acortados como https://maps.app.goo.gl/...)
 * e infiere las coordenadas geográficas exactas (latitud, longitud y nombre del local).
 */
export async function resolveMapsUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "El campo url es requerido." });
    }

    const trimmedUrl = url.trim();

    // 1. Extraer URL de iframe si el usuario pegó el código embed completo
    const iframeMatch = trimmedUrl.match(/src="([^"]+)"/i);
    const candidateUrl = iframeMatch ? iframeMatch[1] : trimmedUrl;

    if (!isGoogleMapsLink(candidateUrl)) {
      return res.status(400).json({ success: false, message: "Solo se aceptan enlaces de Google Maps." });
    }

    // A. Coordenadas explícitas de lugar en URLs completas: !3d(lat)!4d(lng)
    const placeCoordsMatch = candidateUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeCoordsMatch) {
      return res.status(200).json({
        success: true,
        lat: parseFloat(placeCoordsMatch[1]),
        lng: parseFloat(placeCoordsMatch[2]),
        resolvedUrl: candidateUrl,
      });
    }

    // B. Coordenadas de cámara en URLs completas (sin ser acortador): @lat,lng
    if (!candidateUrl.includes("maps.app.goo.gl") && !candidateUrl.includes("goo.gl/maps")) {
      const atMatch = candidateUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        return res.status(200).json({
          success: true,
          lat: parseFloat(atMatch[1]),
          lng: parseFloat(atMatch[2]),
          resolvedUrl: candidateUrl,
        });
      }

      const qMatch = candidateUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        return res.status(200).json({
          success: true,
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2]),
          resolvedUrl: candidateUrl,
        });
      }
    }

    // 2. Seguir redirección HTTP para links acortados (maps.app.goo.gl, etc.)
    let resolvedUrl = candidateUrl;
    let htmlBody = "";

    try {
      ({ resolvedUrl, htmlBody } = await followMapsLink(candidateUrl));
    } catch (fetchErr: any) {
      console.warn("[resolveMapsUrl] Error siguiendo redirección:", fetchErr.message);
    }

    // Extraer nombre del lugar de la URL si está presente (/place/Nombre+Del+Lugar/...)
    let placeName: string | undefined;
    const placeNameMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
    if (placeNameMatch) {
      try {
        placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " "));
      } catch (e) {
        placeName = placeNameMatch[1].replace(/\+/g, " ");
      }
    }

    // Prioridad 1: Coordenadas precisas del pin del local !3d(lat)!4d(lng)
    const finalPlaceMatch = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (finalPlaceMatch) {
      return res.status(200).json({
        success: true,
        lat: parseFloat(finalPlaceMatch[1]),
        lng: parseFloat(finalPlaceMatch[2]),
        placeName,
        resolvedUrl,
      });
    }

    // Prioridad 2: Coordenadas de cámara @lat,lng
    const finalAtMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (finalAtMatch) {
      return res.status(200).json({
        success: true,
        lat: parseFloat(finalAtMatch[1]),
        lng: parseFloat(finalAtMatch[2]),
        placeName,
        resolvedUrl,
      });
    }

    // Prioridad 3: Parámetros q o ll
    const finalQMatch = resolvedUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (finalQMatch) {
      return res.status(200).json({
        success: true,
        lat: parseFloat(finalQMatch[1]),
        lng: parseFloat(finalQMatch[2]),
        placeName,
        resolvedUrl,
      });
    }

    // Prioridad 4: Meta tag center en el HTML retornado por Google
    const metaCenterMatch = htmlBody.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i);
    if (metaCenterMatch) {
      return res.status(200).json({
        success: true,
        lat: parseFloat(metaCenterMatch[1]),
        lng: parseFloat(metaCenterMatch[2]),
        placeName,
        resolvedUrl,
      });
    }

    // Prioridad 5: Coordenadas JSON o Schema en el cuerpo
    const geoMatch =
      htmlBody.match(/"latitude":\s*(-?\d+\.\d+)[^}]*"longitude":\s*(-?\d+\.\d+)/i) ||
      htmlBody.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
    if (geoMatch) {
      return res.status(200).json({
        success: true,
        lat: parseFloat(geoMatch[1]),
        lng: parseFloat(geoMatch[2]),
        placeName,
        resolvedUrl,
      });
    }

    return res.status(404).json({
      success: false,
      message: "No se pudieron extraer las coordenadas del enlace de Google Maps proporcionado.",
      resolvedUrl,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveRestaurant(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID de restaurante inválido" });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "RESTAURANT_OWNER" },
          select: { id: true, name: true, email: true, username: true, phone: true },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        status: "APPROVED",
        isActive: true,
      },
      include: {
        users: {
          select: { id: true, username: true, name: true, role: true, email: true, phone: true, isActive: true },
        },
        issuer: true,
      },
    });

    // Activar al propietario
    await prisma.user.updateMany({
      where: { restaurantId: id, role: "RESTAURANT_OWNER" },
      data: { isActive: true },
    });

    // Enviar correo de aprobación si el dueño tiene email
    const owner = restaurant.users[0];
    if (owner && owner.email) {
      NotificationService.notifyRestaurantApproved(
        { id: restaurant.id, name: restaurant.name },
        { id: owner.id, name: owner.name, email: owner.email }
      ).catch((e) => console.warn("[Email] Error approved restaurant:", e));
    }

    return res.status(200).json({
      success: true,
      message: `Restaurante "${restaurant.name}" aprobado exitosamente. La cuenta del propietario ha sido activada y se ha notificado por correo electrónico.`,
      restaurant: hideRestaurantSecrets(updated),
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectRestaurant(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID de restaurante inválido" });
    }

    const { reason } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "RESTAURANT_OWNER" },
          select: { id: true, name: true, email: true, username: true },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        status: "REJECTED",
        isActive: false,
      },
      include: {
        users: {
          select: { id: true, username: true, name: true, role: true, email: true, phone: true, isActive: true },
        },
        issuer: true,
      },
    });

    // Desactivar al propietario
    await prisma.user.updateMany({
      where: { restaurantId: id, role: "RESTAURANT_OWNER" },
      data: { isActive: false },
    });

    // Enviar correo de rechazo con el motivo
    const owner = restaurant.users[0];
    if (owner && owner.email) {
      NotificationService.notifyRestaurantRejected(
        { id: restaurant.id, name: restaurant.name },
        { id: owner.id, name: owner.name, email: owner.email },
        reason
      ).catch((e) => console.warn("[Email] Error rejected restaurant:", e));
    }

    return res.status(200).json({
      success: true,
      message: `Restaurante "${restaurant.name}" ha sido rechazado.`,
      restaurant: hideRestaurantSecrets(updated),
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewRestaurant(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID de restaurante inválido" });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "RESTAURANT_OWNER" },
          select: { id: true, name: true, email: true, username: true },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        status: "UNDER_REVIEW",
      },
      include: {
        users: {
          select: { id: true, username: true, name: true, role: true, email: true, phone: true, isActive: true },
        },
        issuer: true,
      },
    });

    const owner = restaurant.users[0];
    if (owner && owner.email) {
      NotificationService.notifyRestaurantUnderReview(
        { id: restaurant.id, name: restaurant.name },
        { id: owner.id, name: owner.name, email: owner.email }
      ).catch((e) => console.warn("[Email] Error under review restaurant:", e));
    }

    return res.status(200).json({
      success: true,
      message: `Restaurante "${restaurant.name}" puesto en estado En Revisión.`,
      restaurant: hideRestaurantSecrets(updated),
    });
  } catch (error) {
    next(error);
  }
}
