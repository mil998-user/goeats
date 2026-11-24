// Asks the customer to rate a delivered order (plan 5.9). The server warns 15 to 20 minutes after the
// delivery; if the app was closed, it also shows when the customer comes back in the next days.
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiRequest } from "../utils/api";
import { ORDER_RATED_EVENT, OrderRatingBox } from "./OrderRatingBox";

const ROUTES = ["/restaurants", "/customer/dashboard", "/customer/profile"];
const LATER_KEY = "goeats_rate_later";

interface PendingRating {
  id: number;
  userId: number;
  restaurantName: string;
  hasDriver: boolean;
}

function readLater(): number[] {
  try {
    const ids = JSON.parse(localStorage.getItem(LATER_KEY) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export const RateReminder: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [order, setOrder] = useState<PendingRating | null>(null);
  const [thanks, setThanks] = useState(false);

  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";
  const userId = user?.id;
  const orderId = order?.id;

  useEffect(() => {
    if (!isCustomer || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiRequest("/ratings/pending");
        if (!cancelled && res.order && !readLater().includes(res.order.id)) {
          // Never replaces a rating this customer is already writing
          setOrder((shown) => (shown?.userId === userId ? shown : { ...res.order, userId }));
        }
      } catch {
        // A reminder is optional: it never interrupts the customer with an error
      }
    };
    load();
    socket?.on("rate-order", load);
    return () => {
      cancelled = true;
      socket?.off("rate-order", load);
    };
  }, [isCustomer, userId, socket]);

  // Rated from the order list: the reminder is no longer needed
  useEffect(() => {
    const onRated = (event: Event) => {
      if ((event as CustomEvent<{ orderId: number }>).detail.orderId === orderId) setThanks(true);
    };
    window.addEventListener(ORDER_RATED_EVENT, onRated);
    return () => window.removeEventListener(ORDER_RATED_EVENT, onRated);
  }, [orderId]);

  useEffect(() => {
    if (!thanks) return;
    const timer = window.setTimeout(() => {
      setOrder(null);
      setThanks(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [thanks]);

  if (!isCustomer || !order || order.userId !== userId || !ROUTES.includes(location.pathname)) return null;

  const later = () => {
    try {
      localStorage.setItem(LATER_KEY, JSON.stringify([...readLater(), order.id].slice(-30)));
    } catch {
      // Without storage it only closes for now
    }
    setOrder(null);
  };

  return (
    <section className="rate-reminder" role="status" aria-label="Calificar pedido">
      <div className="rate-reminder-head">
        <strong>{thanks ? "¡Gracias por calificar!" : `¿Cómo estuvo tu pedido de ${order.restaurantName}?`}</strong>
        {!thanks && (
          <button type="button" className="rate-reminder-close" onClick={later} aria-label="Ahora no">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {!thanks && (
        <OrderRatingBox
          key={order.id}
          orderId={order.id}
          hasDriver={order.hasDriver}
          rating={null}
          onSaved={() => undefined}
        />
      )}
    </section>
  );
};
