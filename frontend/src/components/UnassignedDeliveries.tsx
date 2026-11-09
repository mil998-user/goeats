import React, { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useSocket } from "../context/SocketContext";

interface Unassigned {
  id: number;
  restaurant: { id: number; name: string; phone: string | null };
  total: number;
  readyAt: string;
  waitingMinutes: number;
  alerted: boolean;
}

// Ready deliveries nobody has taken; the server warns here when the wait time runs out
export const UnassignedDeliveries: React.FC = () => {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Unassigned[]>([]);
  const [alertText, setAlertText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiRequest("/delivery/unassigned")
      .then((res) => {
        setOrders(res.orders || []);
        setError(null);
      })
      .catch((err: unknown) => setError((err instanceof Error && err.message) || "No se pudo cargar."));
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const onAlert = (data: { message?: string }) => {
      setAlertText(data?.message || "Hay un pedido sin motorizado.");
      load();
    };
    socket.on("dispatch-alert", onAlert);
    return () => {
      socket.off("dispatch-alert", onAlert);
    };
  }, [socket, load]);

  return (
    <div className="glass-card" data-testid="unassigned-deliveries" style={{ padding: "20px", marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "18px", margin: 0 }}>Pedidos listos sin motorizado ({orders.length})</h2>
        <button type="button" className="secondary-btn" style={{ minHeight: "44px" }} onClick={load}>
          Actualizar
        </button>
      </div>
      {alertText && (
        <div role="alert" style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-primary)", color: "var(--accent-primary)", fontWeight: 700, marginBottom: "12px", display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
          <span>{alertText}</span>
          <button type="button" className="secondary-btn" style={{ minHeight: "36px" }} onClick={() => setAlertText(null)}>
            Entendido
          </button>
        </div>
      )}
      {error && <p style={{ color: "var(--accent-primary)" }}>{error}</p>}
      {orders.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Todos los pedidos listos ya tienen motorizado.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {orders.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: `1px solid ${o.alerted ? "var(--accent-primary)" : "var(--border-light)"}` }}>
              <span>
                <strong>#{o.id}</strong> · {o.restaurant.name}
                {o.restaurant.phone ? ` · ${o.restaurant.phone}` : ""}
              </span>
              <span style={{ fontWeight: 700 }}>
                Espera {o.waitingMinutes} min{o.alerted ? " · alerta enviada" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
