// Customer order tracking (plan 9.11.7): icons, a progress bar and an approximate time,
// with as little text as possible. Updates by itself when the order or the driver moves.
import React, { useEffect, useState } from "react";
import { Bike, ChefHat, ClipboardCheck, PartyPopper, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { estimateMinutes } from "../utils/kitchenTime";
import { rideMinutesStraight } from "../utils/rideTime";
import "../styles/tracking.css";

type OrderType = "DELIVERY" | "TAKEOUT" | "DINE_IN";
type OrderStatus = "PENDING" | "PREPARING" | "READY" | "DELIVERING" | "DELIVERED" | "CANCELLED";

export interface TrackableOrder {
  type: OrderType;
  status: OrderStatus;
  createdAt: string;
  items: { quantity: number }[];
  deliveryDriver?: { name: string } | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  restaurant: { mapLatitude?: number | null; mapLongitude?: number | null };
}

const STEPS: Record<OrderType, { label: string; Icon: React.ElementType }[]> = {
  DELIVERY: [
    { label: "Recibido", Icon: ClipboardCheck },
    { label: "Preparando", Icon: ChefHat },
    { label: "En camino", Icon: Bike },
    { label: "Entregado", Icon: PartyPopper },
  ],
  TAKEOUT: [
    { label: "Recibido", Icon: ClipboardCheck },
    { label: "Preparando", Icon: ChefHat },
    { label: "Listo", Icon: ShoppingBag },
    { label: "Retirado", Icon: PartyPopper },
  ],
  DINE_IN: [
    { label: "Recibido", Icon: ClipboardCheck },
    { label: "Preparando", Icon: ChefHat },
    { label: "Listo", Icon: UtensilsCrossed },
    { label: "Servido", Icon: PartyPopper },
  ],
};

function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180;
  const h = Math.sin(((bLat - aLat) * r) / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLng - aLng) * r) / 2) ** 2;
  return 2 * 6371 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

interface TrackerView {
  step: number; // 0..3, -1 when cancelled
  progress: number; // 0..1 along the whole bar
  title: string;
  eta: string | null;
  detail: string | null;
}

function getTrackerView(order: TrackableOrder, now: number): TrackerView {
  const isDelivery = order.type === "DELIVERY";
  const dishes = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) || 1;
  const kitchenMin = estimateMinutes(dishes);
  const elapsedMin = Math.max(0, (now - new Date(order.createdAt).getTime()) / 60000);
  const kitchenLeft = Math.max(0, Math.ceil(kitchenMin - elapsedMin));

  const rest = order.restaurant;
  const hasRoute = rest.mapLatitude != null && rest.mapLongitude != null && order.deliveryLat != null && order.deliveryLng != null;
  const routeKm = hasRoute ? km(rest.mapLatitude!, rest.mapLongitude!, order.deliveryLat!, order.deliveryLng!) : null;
  const ride = routeKm != null ? rideMinutesStraight(routeKm) : 10;

  // Position on the bar: icons sit at 0, 1/3, 2/3 and 1
  const at = (step: number, fraction: number) => clamp((step + clamp(fraction, 0, 1)) / 3, 0, 1);
  const etaText = (minutes: number) => (isDelivery ? `Llega en ~${minutes} min` : `Listo en ~${minutes} min`);

  switch (order.status) {
    case "PENDING":
      return { step: 0, progress: at(0, 0.4), title: "Recibimos tu pedido", eta: etaText(kitchenMin + (isDelivery ? ride : 0)), detail: "Esperando que el local acepte tu pedido" };
    case "PREPARING":
      return {
        step: 1,
        progress: at(1, elapsedMin / kitchenMin * 0.9),
        title: "Están preparando tu pedido",
        eta: kitchenLeft > 0 || isDelivery ? etaText(kitchenLeft + (isDelivery ? ride : 0)) : "Ya casi está",
        detail: null,
      };
    case "READY":
      // Ready and waiting for a driver: the next step ("En camino") is the current one
      if (isDelivery) return { step: 2, progress: at(1, 0.9), title: "Tu pedido está listo", eta: `Llega en ~${ride} min`, detail: "Buscando motorizado" };
      if (order.type === "TAKEOUT") return { step: 2, progress: at(2, 0), title: "¡Listo para retirar!", eta: null, detail: "Pasa por el local" };
      return { step: 2, progress: at(2, 0), title: "¡Tu pedido está listo!", eta: null, detail: "Ya te lo llevan a la mesa" };
    case "DELIVERING": {
      const hasDriver = order.driverLat != null && order.driverLng != null && order.deliveryLat != null && order.deliveryLng != null;
      const leftKm = hasDriver ? km(order.driverLat!, order.driverLng!, order.deliveryLat!, order.deliveryLng!) : routeKm;
      const done = routeKm && leftKm != null ? 1 - leftKm / routeKm : 0.1;
      return {
        step: 2,
        progress: at(2, clamp(done, 0.05, 0.95)),
        title: "Tu pedido va en camino",
        eta: leftKm != null && leftKm < 0.08 ? "Está llegando" : `Llega en ~${leftKm != null ? rideMinutesStraight(leftKm) : ride} min`,
        detail: order.deliveryDriver?.name ? `${order.deliveryDriver.name.split(" ")[0]} lo lleva` : null,
      };
    }
    case "DELIVERED":
      return { step: 3, progress: 1, title: isDelivery ? "¡Entregado! Buen provecho" : "¡Listo! Buen provecho", eta: null, detail: null };
    default:
      return { step: -1, progress: 0, title: "Pedido cancelado", eta: null, detail: null };
  }
}

export const OrderTracker: React.FC<{ order: TrackableOrder; compact?: boolean }> = ({ order, compact = false }) => {
  // Minutes left change with time even when nothing else happens
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const view = getTrackerView(order, now);
  const steps = STEPS[order.type] || STEPS.DELIVERY;
  const cancelled = view.step < 0;
  const finished = view.step === 3;
  const Current = cancelled ? X : steps[view.step].Icon;
  const percent = Math.round(view.progress * 100);

  return (
    <div className={`otk${compact ? " otk--compact" : ""}${cancelled ? " otk--cancelled" : ""}${finished ? " otk--done" : ""}`} data-step={view.step}>
      <div className="otk-head" aria-live="polite">
        {!compact && (
          <span className="otk-hero" aria-hidden="true">
            <Current size={34} strokeWidth={2.2} />
          </span>
        )}
        <div className="otk-head-text">
          <strong className="otk-title">{view.title}</strong>
          {view.detail && <span className="otk-detail">{view.detail}</span>}
        </div>
        {view.eta && <span className="otk-eta">{view.eta}</span>}
      </div>

      {!cancelled && (
        <div className="otk-track">
          <div
            className="otk-bar"
            role="progressbar"
            aria-label="Avance del pedido"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span className="otk-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <ol className="otk-steps">
            {steps.map(({ label, Icon }, i) => {
              const state = i < view.step || finished ? "done" : i === view.step ? "now" : "next";
              return (
                <li key={label} className={`otk-step otk-step--${state}`} aria-current={state === "now" ? "step" : undefined}>
                  <span className="otk-dot" aria-hidden="true">
                    <Icon size={compact ? 14 : 18} strokeWidth={2.4} />
                  </span>
                  <span className="otk-label">{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
};
