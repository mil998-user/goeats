import React, { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { appAlert, appPrompt } from "./AppDialogs";

interface Unassigned {
  id: number;
  restaurant: { id: number; name: string; phone: string | null };
  total: number;
  readyAt: string;
  waitingMinutes: number;
  alerted: boolean;
}

interface OnTheWay {
  id: number;
  total: number;
  pickedUpAt: string | null;
  minutes: number;
  locationMinutes: number | null;
  paymentMethodString: string | null;
  restaurant: { name: string };
  deliveryDriver: { id: number; name: string; phone: string | null } | null;
}

interface Driver {
  id: number;
  name: string;
  isActive: boolean;
  walletBalance: number;
}

interface Balance {
  restaurantId: number;
  name: string;
  orders: number;
  commission: number;
  shipping: number;
  tips: number;
  total: number;
}

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-light)",
};
const small: React.CSSProperties = { minHeight: "40px", padding: "6px 12px", fontSize: "13px" };

const askReason = (title: string) =>
  appPrompt(`${title}\nEscribe el motivo (se guarda con el pedido).`, { placeholder: "Ej. el cliente pidió cancelar por teléfono", confirmLabel: "Confirmar" });

// Administrator: ready deliveries nobody took, orders on the way and what restaurants owe.
// Every order can be assigned, released or cancelled, so none is left hanging
export const UnassignedDeliveries: React.FC = () => {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Unassigned[]>([]);
  const [onTheWay, setOnTheWay] = useState<OnTheWay[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [choice, setChoice] = useState<Record<number, string>>({});
  const [alertText, setAlertText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([apiRequest("/delivery/unassigned"), apiRequest("/delivery/in-progress"), apiRequest("/delivery/drivers")])
      .then(([unassigned, progress, list]) => {
        setOrders(unassigned.orders || []);
        setOnTheWay(progress.orders || []);
        setDrivers((list.drivers || []).filter((d: Driver) => d.isActive));
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
    socket.on("delivery-delayed", onAlert);
    socket.on("delivery-board-changed", load);
    return () => {
      socket.off("dispatch-alert", onAlert);
      socket.off("delivery-delayed", onAlert);
      socket.off("delivery-board-changed", load);
    };
  }, [socket, load]);

  const run = async (path: string, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await apiRequest(path, { method: "POST", body: JSON.stringify(body) });
      await appAlert(res.message || "Listo.");
      load();
    } catch (err) {
      await appAlert(err instanceof Error ? err.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  };

  const assign = (orderId: number) => {
    const driverId = Number(choice[orderId]);
    if (!driverId) return appAlert("Elige el motorizado.");
    return run(`/delivery/orders/${orderId}/assign`, { driverId });
  };
  const cancel = async (orderId: number) => {
    const reason = await askReason(`Cancelar el pedido #${orderId}`);
    if (reason) await run(`/delivery/orders/${orderId}/cancel`, { reason });
  };
  const release = async (orderId: number) => {
    const reason = await askReason(`Liberar el pedido #${orderId}: vuelve a la lista y el motorizado recupera su comisión`);
    if (reason) await run(`/delivery/orders/${orderId}/release`, { reason });
  };

  return (
    <>
      <div className="glass-card" data-testid="unassigned-deliveries" style={{ padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "18px", margin: 0 }}>Pedidos listos sin motorizado ({orders.length})</h2>
          <button type="button" className="secondary-btn" style={{ minHeight: "44px" }} onClick={load}>
            Actualizar
          </button>
        </div>
        {alertText && (
          <div role="alert" style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-primary)", color: "var(--accent-primary)", fontWeight: 700, marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
              <div key={o.id} data-testid={`unassigned-${o.id}`} style={{ ...row, borderColor: o.alerted ? "var(--accent-primary)" : "var(--border-light)" }}>
                <span style={{ minWidth: 0 }}>
                  <strong>#{o.id}</strong> · {o.restaurant.name}
                  {o.restaurant.phone ? ` · ${o.restaurant.phone}` : ""} · <strong>espera {o.waitingMinutes} min</strong>
                </span>
                <span style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <select
                    className="input-field"
                    aria-label={`Motorizado para el pedido ${o.id}`}
                    value={choice[o.id] || ""}
                    onChange={(e) => setChoice((prev) => ({ ...prev, [o.id]: e.target.value }))}
                    style={{ minHeight: "40px", maxWidth: "220px" }}
                  >
                    <option value="">Elegir motorizado</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · saldo ${d.walletBalance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="glow-btn" style={small} disabled={busy} onClick={() => assign(o.id)}>
                    Asignar
                  </button>
                  <button type="button" className="secondary-btn" style={small} disabled={busy} onClick={() => cancel(o.id)}>
                    Cancelar
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card" data-testid="on-the-way" style={{ padding: "20px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 12px" }}>En camino ({onTheWay.length})</h2>
        {onTheWay.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No hay pedidos en camino.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {onTheWay.map((o) => (
              <div key={o.id} data-testid={`on-the-way-${o.id}`} style={row}>
                <span style={{ minWidth: 0 }}>
                  <strong>#{o.id}</strong> · {o.restaurant.name} · {o.deliveryDriver?.name || "Sin motorizado"}
                  {o.deliveryDriver?.phone ? ` (${o.deliveryDriver.phone})` : ""} · {o.pickedUpAt ? "ya retiró" : "aún no retira"} · hace {o.minutes} min
                  {o.locationMinutes !== null ? ` · ubicación de hace ${o.locationMinutes} min` : " · sin ubicación"}
                </span>
                <span style={{ display: "flex", gap: "8px" }}>
                  {!o.pickedUpAt && (
                    <button type="button" className="secondary-btn" style={small} disabled={busy} onClick={() => release(o.id)}>
                      Liberar
                    </button>
                  )}
                  <button type="button" className="secondary-btn" style={small} disabled={busy} onClick={() => cancel(o.id)}>
                    Cancelar
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <RestaurantBalances />
    </>
  );
};

// What each restaurant owes GoEats for deliveries paid straight to it (engineers, 25 nov)
const RestaurantBalances: React.FC = () => {
  const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  // The last 7 days, computed once when the panel opens
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 7 * 864e5)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [rows, setRows] = useState<Balance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest(`/delivery/restaurant-balances?from=${from}&to=${to}`)
      .then((res) => {
        setRows(res.restaurants || []);
        setError(null);
      })
      .catch((err: unknown) => setError((err instanceof Error && err.message) || "No se pudo cargar."));
  }, [from, to]);

  const total = rows.reduce((sum, r) => sum + r.total, 0);
  return (
    <div className="glass-card" data-testid="restaurant-balances" style={{ padding: "20px", marginBottom: "24px" }}>
      <h2 style={{ fontSize: "18px", margin: "0 0 4px" }}>Por cobrar a los locales</h2>
      <p style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--text-secondary)" }}>
        Domicilios pagados por transferencia o tarjeta: el dinero llegó al local y debe la comisión, el envío y la propina que GoEats ya le pagó al motorizado.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <label style={{ fontSize: "14px" }}>
          Desde <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label style={{ fontSize: "14px" }}>
          Hasta <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      {error && <p style={{ color: "var(--accent-primary)" }}>{error}</p>}
      {rows.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Nada por cobrar en esas fechas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Local</th>
                <th>Pedidos</th>
                <th>Comisión</th>
                <th>Envío</th>
                <th>Propinas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.restaurantId} style={{ borderTop: "1px solid var(--border-light)" }}>
                  <td>{r.name}</td>
                  <td>{r.orders}</td>
                  <td>${r.commission.toFixed(2)}</td>
                  <td>${r.shipping.toFixed(2)}</td>
                  <td>${r.tips.toFixed(2)}</td>
                  <td>
                    <strong>${r.total.toFixed(2)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "10px 0 0", fontWeight: 700 }}>Total por cobrar: ${total.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

