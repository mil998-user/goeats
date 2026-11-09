import React, { useState } from "react";
import { apiRequest } from "../utils/api";
import { StarPicker } from "./Stars";

// After a delivery the driver can rate the customer; it is optional and only seen internally
export const RateCustomerModal: React.FC<{ orderId: number; onClose: () => void }> = ({ orderId, onClose }) => {
  const [stars, setStars] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (stars < 1) {
      setError("Elige de 1 a 5 estrellas.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/ratings/orders/${orderId}/customer`, { method: "POST", body: JSON.stringify({ stars }) });
      onClose();
    } catch (err) {
      setError((err instanceof Error && err.message) || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-customer-title"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: "380px", padding: "22px", background: "var(--bg-primary)" }}>
        <h2 id="rate-customer-title" style={{ fontSize: "1.1rem", margin: "0 0 6px" }}>
          ¿Cómo fue la entrega del pedido #{orderId}?
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 14px" }}>
          Califica al cliente. Es opcional y el cliente no lo ve.
        </p>
        <StarPicker value={stars} onChange={setStars} label="Estrellas para el cliente" />
        {error && (
          <p role="alert" style={{ color: "var(--accent-primary)", fontSize: "13px", margin: "10px 0 0" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
          <button type="button" className="glow-btn" style={{ minHeight: "44px" }} disabled={saving} onClick={save}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="secondary-btn" style={{ minHeight: "44px" }} onClick={onClose}>
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
};
