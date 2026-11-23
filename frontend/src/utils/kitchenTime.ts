// Approximate kitchen time of an order (bosses, 17 nov): 10 minutes plus 2 per extra dish, up to 30.
// There is no preparation time per dish yet; when the menu has one, this is the only place to change.
// Used by the kitchen screen and by the customer tracking.
export const BASE_MINUTES = 10;
export const MINUTES_PER_EXTRA_DISH = 2;
export const MAX_MINUTES = 30;

export function estimateMinutes(dishes: number) {
  return Math.min(MAX_MINUTES, BASE_MINUTES + Math.max(0, dishes - 1) * MINUTES_PER_EXTRA_DISH);
}
