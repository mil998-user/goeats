// Keep in sync with frontend/src/utils/shipping.ts so the customer sees the same price
const DEFAULT_DISTANCE_KM = 2.5;
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function getShippingDistanceKm(
  restaurantLat?: number | null,
  restaurantLng?: number | null,
  deliveryLat?: number | null,
  deliveryLng?: number | null
) {
  if (restaurantLat == null || restaurantLng == null || deliveryLat == null || deliveryLng == null) {
    return DEFAULT_DISTANCE_KM;
  }

  const latDelta = toRadians(deliveryLat - restaurantLat);
  const lngDelta = toRadians(deliveryLng - restaurantLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(restaurantLat)) * Math.cos(toRadians(deliveryLat)) * Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function calculateShippingCost(
  rate: { basePrice: number; pricePerKm: number },
  distanceKm: number
) {
  return Math.round((rate.basePrice + rate.pricePerKm * distanceKm) * 100) / 100;
}
