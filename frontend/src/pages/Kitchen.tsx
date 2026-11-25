import React, { useEffect, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { useSocket } from "../context/SocketContext";
import { apiRequest } from "../utils/api";
import { Play, CheckCircle, Loader2, ChefHat, BellRing, CheckCircle2, Timer, History, ArrowLeft } from "lucide-react";
import { systemIconForEmoji } from "../utils/systemIcons";
import { splitTakeAway } from "../utils/takeAway";
import { KitchenHistory } from "../components/KitchenHistory";
import { BASE_MINUTES, MINUTES_PER_EXTRA_DISH, MAX_MINUTES, estimateMinutes } from "../utils/kitchenTime";

interface OrderItem {
  id: number;
  orderId: number;
  quantity: number;
  comments: string | null;
  status: "PENDING" | "PREPARING" | "READY" | "SERVED";
  createdAt: string;
  variant: {
    name: string;
    menuItem: {
      name: string;
    };
  };
  order: {
    id: number;
    type: "DINE_IN" | "TAKEOUT" | "DELIVERY";
    customerName: string;
    comments: string | null;
    createdAt: string;
    table: { number: string } | null;
  };
}

// Approximate kitchen time: same rule as the customer tracking (utils/kitchenTime.ts)

const SERVICE_LABEL: Record<OrderItem["order"]["type"], string> = {
  DINE_IN: "Para servir",
  TAKEOUT: "Para llevar",
  DELIVERY: "Domicilio",
};

export const Kitchen: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"live" | "history">("live");
  const [callingWaiterOrderId, setCallingWaiterOrderId] = useState<number | null>(null);
  const [calledSuccessMap, setCalledSuccessMap] = useState<Record<number, boolean>>({});
  // Clock for the countdowns
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCallWaiter = async (orderId: number) => {
    try {
      setCallingWaiterOrderId(orderId);
      await apiRequest(`/kitchen/orders/${orderId}/call-waiter`, { method: "POST" });
      setCalledSuccessMap(prev => ({ ...prev, [orderId]: true }));
      setTimeout(() => {
        setCalledSuccessMap(prev => ({ ...prev, [orderId]: false }));
      }, 4000);
    } catch (error: any) {
      alert(error.message || "Error al llamar al mesero");
    } finally {
      setCallingWaiterOrderId(null);
    }
  };

  // Short beep for new orders using the web audio API
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.25);
      }, 180);
    } catch {
      console.log("Audio alert blocked or unsupported");
    }
  };

  const fetchItems = async () => {
    try {
      const data = await apiRequest("/kitchen/pending");
      setItems(data.items);
      setNow(Date.now());
    } catch (error) {
      console.error("Error fetching kitchen items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewOrder = () => {
      playAlert();
      fetchItems();
    };
    const handleItemStatusUpdated = () => fetchItems();

    socket.on("new-order", handleNewOrder);
    socket.on("kitchen-item-status-updated", handleItemStatusUpdated);
    socket.on("order-status-updated", handleItemStatusUpdated);
    // An order moved to another table, or tables joined or separated
    socket.on("order-table-changed", handleItemStatusUpdated);
    socket.on("tables-updated", handleItemStatusUpdated);
    // When the connection comes back (signal, phone unlocked) the data is asked again
    socket.on("connect", handleItemStatusUpdated);
    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("kitchen-item-status-updated", handleItemStatusUpdated);
      socket.off("order-status-updated", handleItemStatusUpdated);
      socket.off("order-table-changed", handleItemStatusUpdated);
      socket.off("tables-updated", handleItemStatusUpdated);
      socket.off("connect", handleItemStatusUpdated);
    };
  }, [socket]);

  const handleUpdateStatus = async (itemId: number, newStatus: "PREPARING" | "READY" | "SERVED") => {
    try {
      await apiRequest(`/kitchen/items/${itemId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setItems(prev => prev.map(item => (item.id === itemId ? { ...item, status: newStatus } : item)));
    } catch {
      alert("Error al actualizar el estado del producto");
    }
  };

  // One card per order, oldest first
  const ordersMap = new Map<number, { order: OrderItem["order"]; items: OrderItem[] }>();
  items.forEach(item => {
    if (!ordersMap.has(item.orderId)) ordersMap.set(item.orderId, { order: item.order, items: [] });
    ordersMap.get(item.orderId)!.items.push(item);
  });

  const activeOrders = Array.from(ordersMap.values())
    .map(group => {
      const pending = group.items.filter(i => i.status === "PENDING" || i.status === "PREPARING");
      // The clock starts with the oldest dish still to make: dishes added later to a table start their own time
      const startedAt = pending.length
        ? Math.min(...pending.map(i => new Date(i.createdAt || group.order.createdAt).getTime()))
        : new Date(group.order.createdAt).getTime();
      const dishes = pending.reduce((sum, i) => sum + i.quantity, 0);
      const estimate = estimateMinutes(dishes);
      const left = Math.ceil((startedAt + estimate * 60000 - now) / 60000);
      return { ...group, pending, startedAt, estimate, left };
    })
    // Orders still to make first (oldest on top); finished ones go to the end until they are delivered
    .sort((a, b) => Number(a.pending.length === 0) - Number(b.pending.length === 0) || a.startedAt - b.startedAt);

  return (
    <div className="kds-page">
      <header className="kds-header">
        <div>
          <div className="kds-title">
            <ChefHat size={28} aria-hidden="true" />
            <h1>{view === "history" ? "Historial de cocina" : "Cocina"}</h1>
          </div>
          <p className="kds-subtitle">
            {view === "live" && <><strong>{activeOrders.filter(o => o.pending.length).length}</strong> pedidos por preparar · </>}
            {isConnected ? <span className="kds-online">● En vivo</span> : <span className="kds-offline">● Sin conexión</span>}
          </p>
        </div>
        <button
          type="button"
          className="secondary-btn kds-history-btn"
          onClick={() => setView(view === "live" ? "history" : "live")}
        >
          {view === "live" ? <><History size={16} /> Historial</> : <><ArrowLeft size={16} /> Volver a los pedidos</>}
        </button>
      </header>

      {view === "history" ? (
        <KitchenHistory />
      ) : loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
          <Loader2 size={48} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px", maxWidth: "500px", margin: "40px auto", borderRadius: "var(--radius-lg)" }}>
          <EmptyState title="¡Todo listo en cocina!" message="No hay platos pendientes por preparar en este momento." />
        </div>
      ) : (
        <>
          <p className="kds-help">
            <Timer size={14} aria-hidden="true" /> Tiempo aproximado: {BASE_MINUTES} min por pedido y {MINUTES_PER_EXTRA_DISH} más por cada plato extra (máximo {MAX_MINUTES}).
          </p>
          <div className="kds-grid">
            {activeOrders.map(group => {
              const { order } = group;
              const readyCount = group.items.filter(i => i.status === "READY" || i.status === "SERVED").length;
              const isAllReady = group.pending.length === 0;
              const timeState = isAllReady ? "ready" : group.left < 0 ? "late" : group.left <= 3 ? "soon" : "ok";
              const isCalling = callingWaiterOrderId === order.id;
              const isCalled = !!calledSuccessMap[order.id];
              const who = order.type === "DINE_IN" && order.table ? `Mesa ${order.table.number}` : order.customerName;

              return (
                <article key={order.id} className={`kds-card kds-card--${timeState}`} aria-label={`Pedido ${order.id}, ${SERVICE_LABEL[order.type]}, ${who}`}>
                  <div className="kds-card-head">
                    <div className="kds-card-who">
                      <span className={`kds-service kds-service--${order.type.toLowerCase()}`}>{SERVICE_LABEL[order.type]}</span>
                      <h2>{who}</h2>
                      <span className="kds-order-number">Pedido #{order.id}</span>
                    </div>
                    <div className={`kds-timer kds-timer--${timeState}`}>
                      {isAllReady ? (
                        <>Listo</>
                      ) : group.left < 0 ? (
                        <>Atrasado<strong>{Math.abs(group.left)} min</strong></>
                      ) : (
                        <>Listo en<strong>~{Math.max(group.left, 1)} min</strong></>
                      )}
                    </div>
                  </div>

                  {order.comments && <p className="kds-order-note">Obs: {order.comments}</p>}

                  <ul className="kds-items">
                    {group.items.map(item => {
                      const { takeAway, note } = splitTakeAway(item.comments);
                      return (
                        <li key={item.id} className={`kds-item kds-item--${item.status.toLowerCase()}`}>
                          <div className="kds-item-line">
                            <span className="kds-qty">{item.quantity}×</span>
                            <div className="kds-item-name">
                              <strong>{item.variant.menuItem.name}</strong>
                              <span>{item.variant.name}</span>
                            </div>
                            <span className="kds-item-state">
                              {item.status === "PENDING" ? "Pendiente" : item.status === "PREPARING" ? "Preparando" : "Listo"}
                            </span>
                          </div>
                          {takeAway && order.type === "DINE_IN" && <span className="pos-takeaway-chip active kds-item-takeaway">PARA LLEVAR</span>}
                          {note && <p className="kds-item-note">* {note}</p>}
                          <div className="kds-item-actions">
                            {item.status === "PENDING" && (
                              <button type="button" className="secondary-btn kds-btn-prepare" onClick={() => handleUpdateStatus(item.id, "PREPARING")}>
                                <Play size={14} /> Preparar
                              </button>
                            )}
                            {(item.status === "PENDING" || item.status === "PREPARING") && (
                              <button type="button" className="glow-btn kds-btn-ready" onClick={() => handleUpdateStatus(item.id, "READY")}>
                                <CheckCircle size={14} /> Listo
                              </button>
                            )}
                            {item.status === "READY" && order.type === "DELIVERY" && (
                              <span className="kds-waiting">Esperando al motorizado</span>
                            )}
                            {item.status === "READY" && order.type !== "DELIVERY" && (
                              <button type="button" className="secondary-btn kds-btn-serve" onClick={() => handleUpdateStatus(item.id, "SERVED")}>
                                {order.type === "TAKEOUT" ? "Entregado al cliente" : "Entregar"}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="kds-card-foot">
                    <span>{readyCount} de {group.items.length} listos</span>
                    {order.type === "DINE_IN" && (
                      <button
                        type="button"
                        className={`kds-call ${isAllReady || isCalled ? "kds-call--ready" : ""}`}
                        onClick={() => handleCallWaiter(order.id)}
                        disabled={isCalling}
                      >
                        {isCalling ? (
                          <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Llamando…</>
                        ) : isCalled ? (
                          <><CheckCircle2 size={16} /> Mesero avisado {systemIconForEmoji("🛎️")}</>
                        ) : (
                          <><BellRing size={16} /> {isAllReady ? "Llamar al mesero: mesa lista" : "Llamar al mesero"}</>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
