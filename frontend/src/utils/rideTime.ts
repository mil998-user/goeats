// Riding time in the city, one rule for every screen (plan 5.8).
// The route service assumes empty streets, so its time never goes below this pace: 5 km are about 17 minutes.
const MINUTES_PER_KM = 3.2;
const EXTRA_MINUTES = 1;
const ROAD_FACTOR = 1.25; // streets are longer than a straight line

export function rideMinutes(roadKm: number, routeMinutes = 0) {
  return Math.max(1, Math.round(Math.max(roadKm * MINUTES_PER_KM + EXTRA_MINUTES, routeMinutes)));
}

export const rideMinutesStraight = (straightKm: number) => rideMinutes(straightKm * ROAD_FACTOR);
