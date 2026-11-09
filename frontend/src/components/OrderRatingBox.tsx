import React, { useState } from "react";
import { apiRequest } from "../utils/api";
import { StarPicker } from "./Stars";

export interface OrderRating {
  restaurantStars: number | null;
  driverStars: number | null;
  comment: string | null;
}

// Rating for a delivered order: once saved it is shown read-only
export const OrderRatingBox: React.FC<{
  orderId: number;
  hasDriver: boolean;
  rating: OrderRating | null | undefined;
  onSaved: (rating: OrderRating) => void;
}> = ({ orderId, hasDriver, rating, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [restaurantStars, setRestaurantStars] = useState(0);
  const [driverStars, setDriverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The same record also holds the driver's rating of the customer, so it can exist before the customer rates
  if (rating?.restaurantStars) {
    return (
      <div data-testid={`rating-done-${orderId}`} style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
        Tu calificación: {rating.restaurantStars ?? "-"} ★ al local
        {rating.driverStars ? ` · ${rating.driverStars} ★ al motorizado` : ""}
        {rating.comment ? ` · "${rating.comment}"` : ""}
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="secondary-btn" style={{ minHeight: "44px", alignSelf: "flex-start" }} onClick={() => setOpen(true)}>
        Calificar pedido
      </button>
    );
  }

  const save = async () => {
    setError(null);
    if (restaurantStars < 1) {
      setError("Elige las estrellas para el restaurante.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { restaurantStars, comment };
      if (hasDriver && driverStars > 0) body.driverStars = driverStars;
      await apiRequest(`/ratings/orders/${orderId}`, { method: "POST", body: JSON.stringify(body) });
      onSaved({ restaurantStars, driverStars: hasDriver && driverStars > 0 ? driverStars : null, comment: comment.trim() || null });
    } catch (err) {
      setError((err instanceof Error && err.message) || "No se pudo guardar la calificación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>¿Qué tal estuvo la comida?</div>
        <StarPicker value={restaurantStars} onChange={setRestaurantStars} label="Estrellas para el restaurante" />
      </div>
      {hasDriver && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>¿Y la entrega? (opcional)</div>
          <StarPicker value={driverStars} onChange={setDriverStars} label="Estrellas para el motorizado" />
        </div>
      )}
      <div className="input-group" style={{ margin: 0 }}>
        <label htmlFor={`rating-comment-${orderId}`}>Comentario (opcional)</label>
        <input
          id={`rating-comment-${orderId}`}
          className="input-field"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" style={{ color: "var(--accent-primary)", fontSize: "13px", margin: 0 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" className="glow-btn" style={{ minHeight: "44px" }} onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Enviar calificación"}
        </button>
        <button type="button" className="secondary-btn" style={{ minHeight: "44px" }} onClick={() => setOpen(false)}>
          Ahora no
        </button>
      </div>
    </div>
  );
};
