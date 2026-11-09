import { parseAmount } from "./validation";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

// Longest a dish can stay on promotion before the owner renews it
export const PROMO_MAX_DAYS = 90;

interface PricedVariant {
  price: number;
  promoPrice?: number | null;
  promoEndsAt?: Date | null;
}

export function isPromoActive(variant: PricedVariant, now = new Date()): boolean {
  return (
    variant.promoPrice !== null &&
    variant.promoPrice !== undefined &&
    variant.promoPrice > 0 &&
    variant.promoPrice < variant.price &&
    !!variant.promoEndsAt &&
    variant.promoEndsAt.getTime() > now.getTime()
  );
}

// The price the server charges: the promotion while it lasts, the normal price otherwise
export function getEffectivePrice(variant: PricedVariant, now = new Date()): number {
  return isPromoActive(variant, now) ? (variant.promoPrice as number) : variant.price;
}

// What a buyer sees: the price to pay and, during a promotion, the normal price and its end
export function toSaleVariant<T extends PricedVariant>(variant: T, now = new Date()) {
  const { promoPrice, promoEndsAt, ...rest } = variant;
  if (!isPromoActive(variant, now)) {
    return { ...rest, regularPrice: null, promoEndsAt: null };
  }
  return { ...rest, price: promoPrice as number, regularPrice: variant.price, promoEndsAt };
}

type PromoInput = { promoPrice: number | null; promoEndsAt: Date | null };

// Reads the promotion fields of the menu editor. Both empty removes the promotion.
export function readPromo(body: Record<string, unknown>, price: number, now = new Date()): { error: string } | PromoInput | undefined {
  const rawPrice = body.promoPrice;
  const rawEnd = body.promoEndsAt;
  if (rawPrice === undefined && rawEnd === undefined) return undefined;

  const emptyPrice = rawPrice === null || rawPrice === "";
  const emptyEnd = rawEnd === null || rawEnd === "";
  if (emptyPrice && emptyEnd) return { promoPrice: null, promoEndsAt: null };
  if (emptyPrice || emptyEnd || rawPrice === undefined || rawEnd === undefined) {
    return { error: "La promoción necesita precio y fecha de fin." };
  }

  const promoPrice = parseAmount(rawPrice);
  if (promoPrice === null) {
    return { error: "El precio de promoción no es válido." };
  }
  if (promoPrice >= price) {
    return { error: "El precio de promoción debe ser menor que el precio normal." };
  }

  if (typeof rawEnd !== "string" || rawEnd.length > 40) {
    return { error: "La fecha de fin de la promoción no es válida." };
  }
  const promoEndsAt = new Date(rawEnd);
  if (Number.isNaN(promoEndsAt.getTime()) || promoEndsAt.getTime() <= now.getTime()) {
    return { error: "La fecha de fin de la promoción debe ser futura." };
  }
  if (promoEndsAt.getTime() > now.getTime() + PROMO_MAX_DAYS * 24 * 60 * 60 * 1000) {
    return { error: `La promoción puede durar como máximo ${PROMO_MAX_DAYS} días.` };
  }

  return { promoPrice: roundMoney(promoPrice), promoEndsAt };
}
