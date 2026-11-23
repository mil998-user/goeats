// Delivery simulator (plan 9.12): only in development or in a test build with VITE_DELIVERY_SIMULATOR=true
export const SIMULATOR_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DELIVERY_SIMULATOR === "true";
export const SIM_STEPS = 40;
export const SIM_TICK_MS = 1500;

// The driver page skips its own GPS send while a simulation runs
let simulationActive = false;
export const isDeliverySimulationRunning = () => simulationActive;
export const setDeliverySimulationRunning = (running: boolean) => {
  simulationActive = running;
};

function metersBetween(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Points at the same distance along the street route, so the driver moves at a steady pace
export function resamplePath(path: [number, number][], steps: number): [number, number][] {
  if (path.length < 2) return path;
  const segments = path.slice(1).map((point, i) => metersBetween(path[i], point));
  const total = segments.reduce((sum, d) => sum + d, 0);
  if (total === 0) return [path[path.length - 1]];
  const out: [number, number][] = [];
  for (let step = 0; step <= steps; step++) {
    let left = (total * step) / steps;
    let i = 0;
    while (i < segments.length - 1 && left > segments[i]) {
      left -= segments[i];
      i++;
    }
    const t = segments[i] > 0 ? Math.min(1, left / segments[i]) : 1;
    const a = path[i];
    const b = path[i + 1];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}
