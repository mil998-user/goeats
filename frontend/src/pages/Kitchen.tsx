import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { apiRequest } from "../utils/api";
import { Play, CheckCircle, Loader2, Sparkles, ChefHat, BellRing, CheckCircle2 } from "lucide-react";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";
import { KitchenHistory } from "../components/KitchenHistory";


interface OrderItem {
  id: number;
  orderId: number;
  quantity: number;
  comments: string | null;
  status: "PENDING" | "PREPARING" | "READY" | "SERVED";
  variant: {
    name: string;
    menuItem: {
      name: string;
      productionAreaId: number | null;
      productionArea?: { id: number; name: string } | null;
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

interface ProductionArea {
  id: number;
  name: string;
}

export const Kitchen: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productionAreas, setProductionAreas] = useState<ProductionArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"live" | "history">("live");
  const [callingWaiterOrderId, setCallingWaiterOrderId] = useState<number | null>(null);
  const [calledSuccessMap, setCalledSuccessMap] = useState<Record<number, boolean>>({});

  const handleCallWaiter = async (orderId: number, _tableName?: string) => {
    try {
      setCallingWaiterOrderId(orderId);
      await apiRequest(`/kitchen/orders/${orderId}/call-waiter`, {
        method: "POST",
      });
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

  // Simple beep alert for new orders using web audio API
  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.25);
      }, 180);
    } catch (e) {
      console.log("Audio alert blocked or unsupported");
    }
  };

  const fetchItems = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedArea !== null) {
        params.productionAreaId = selectedArea.toString();
      }
      const data = await apiRequest("/kitchen/pending", { params });
      setItems(data.items);
    } catch (error) {
      console.error("Error fetching kitchen items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch production areas to filter by
  const fetchAreas = async () => {
    try {
      // Get categories/menus to infer production areas, or hit menu configuration
      // We can also fetch the default list of areas if we list them.
      // Let's deduce areas from the backend or default to Cocina & Bar
      setProductionAreas([
        { id: 1, name: "Cocina" },
        { id: 2, name: "Bar" },
      ]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [selectedArea]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new orders
    const handleNewOrder = (order: any) => {
      console.log("[KDS] New order received:", order);
      playAlert();
      fetchItems();
    };

    // Listen for updates from other kitchen terminals
    const handleItemStatusUpdated = () => {
      fetchItems();
    };

    socket.on("new-order", handleNewOrder);
    socket.on("kitchen-item-status-updated", handleItemStatusUpdated);

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("kitchen-item-status-updated", handleItemStatusUpdated);
    };
  }, [socket, selectedArea]);

  const handleUpdateStatus = async (itemId: number, newStatus: "PREPARING" | "READY" | "SERVED") => {
    try {
      await apiRequest(`/kitchen/items/${itemId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      // Local state is updated via socket broadcast, but let's update immediately just in case
      setItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, status: newStatus } : item))
      );
    } catch (error) {
      alert("Error al actualizar el estado del producto");
    }
  };

  // Group items by order
  const ordersMap = new Map<number, { order: OrderItem["order"]; items: OrderItem[] }>();
  items.forEach(item => {
    if (!ordersMap.has(item.orderId)) {
      ordersMap.set(item.orderId, {
        order: item.order,
        items: []
      });
    }
    ordersMap.get(item.orderId)!.items.push(item);
  });

  const activeOrders = Array.from(ordersMap.values()).sort(
    (a, b) => new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime()
  );

  const formatElapsed = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    if (mins < 1) return "Hace instantes";
    return `Hace ${mins} min`;
  };

  return (
    <div style={{ padding: "clamp(12px, 3vw, 24px)", minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChefHat size={28} style={{ color: "var(--accent-primary)" }} />
            <h1 style={{ fontSize: "clamp(20px, 4vw, 28px)", margin: 0 }}>Pantalla de Cocina (KDS)</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Pedidos en preparación en tiempo real • {isConnected ? (
              <span style={{ color: "var(--success)" }}>● Conectado</span>
            ) : (
              <span style={{ color: "var(--danger)" }}>● Desconectado</span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }} role="group" aria-label="Vista de cocina">
          <button
            type="button"
            aria-pressed={view === "live"}
            onClick={() => setView("live")}
            className={view === "live" ? "glow-btn" : "secondary-btn"}
            style={{ padding: "8px 16px", minHeight: "44px", borderRadius: "var(--radius-sm)" }}
          >
            En curso
          </button>
          <button
            type="button"
            aria-pressed={view === "history"}
            onClick={() => setView("history")}
            className={view === "history" ? "glow-btn" : "secondary-btn"}
            style={{ padding: "8px 16px", minHeight: "44px", borderRadius: "var(--radius-sm)" }}
          >
            Historial
          </button>
        </div>

        {/* Filter Area Selection */}
        {view === "live" && (
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", maxWidth: "100%", paddingBottom: "4px" }}>
          <button
            onClick={() => setSelectedArea(null)}
            className={selectedArea === null ? "glow-btn" : "secondary-btn"}
            style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)" }}
          >
            Todos
          </button>
          {productionAreas.map(area => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={selectedArea === area.id ? "glow-btn" : "secondary-btn"}
              style={{ padding: "8px 16px", borderRadius: "var(--radius-sm)" }}
            >
              {area.name}
            </button>
          ))}
        </div>
        )}
      </div>

      {view === "history" ? (
        <KitchenHistory />
      ) : loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}>
          <Loader2 className="spinner" size={48} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="glass-card" style={{
          textAlign: "center",
          padding: "60px 20px",
          maxWidth: "500px",
          margin: "40px auto",
          borderRadius: "var(--radius-lg)"
        }}>
          <Sparkles size={48} style={{ color: "var(--accent-primary)", marginBottom: "15px" }} />
          <h3>¡Todo listo en producción!</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>
            No hay platos pendientes por preparar en este momento.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
          gap: "16px",
          alignItems: "start"
        }}>
          {activeOrders.map(group => {
            const readyCount = group.items.filter(i => i.status === "READY" || i.status === "SERVED").length;
            const totalCount = group.items.length;
            const isAllReady = totalCount > 0 && readyCount === totalCount;
            const isAlmostReady = readyCount > 0 && !isAllReady;
            const percent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
            const isCalling = callingWaiterOrderId === group.order.id;
            const isCalled = !!calledSuccessMap[group.order.id];

            const orderColor = isAllReady
              ? "var(--success)"
              : isAlmostReady
              ? "var(--warning)"
              : group.order.type === "DINE_IN"
              ? "var(--success)"
              : group.order.type === "DELIVERY"
              ? "var(--accent-primary)"
              : "var(--warning)";
            
            return (
              <div
                key={group.order.id}
                className="glass-card animate-fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "var(--radius-md)",
                  borderTop: `6px solid ${orderColor}`,
                  boxShadow: isAllReady ? "0 0 16px rgba(46, 213, 115, 0.25)" : "none",
                  overflow: "hidden"
                }}
              >
                {/* Ticket Header */}
                <div style={{
                  padding: "16px",
                  borderBottom: "1px solid var(--border-light)",
                  backgroundColor: "var(--bg-tertiary)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", margin: 0 }}>
                        {group.order.type === "DINE_IN" && group.order.table
                          ? `Mesa ${group.order.table.number}`
                          : group.order.type === "DELIVERY"
                          ? systemTextWithIcons("🚚 Delivery")
                          : systemTextWithIcons("🛍️ Para Llevar")}
                      </h3>
                      <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        Cliente: <strong>{group.order.customerName}</strong>
                      </div>
                    </div>
                    <span style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      backgroundColor: "var(--bg-secondary)",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-light)"
                    }}>
                      {formatElapsed(group.order.createdAt)}
                    </span>
                  </div>

                  {/* Readiness status badge & Progress Bar */}
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "10px",
                        backgroundColor: isAllReady
                          ? "rgba(46, 213, 115, 0.15)"
                          : isAlmostReady
                          ? "rgba(255, 165, 2, 0.15)"
                          : "var(--bg-secondary)",
                        color: isAllReady
                          ? "var(--success)"
                          : isAlmostReady
                          ? "var(--warning)"
                          : "var(--text-secondary)",
                        border: `1px solid ${isAllReady ? "var(--success)" : isAlmostReady ? "var(--warning)" : "var(--border-light)"}`
                      }}>
                        {isAllReady ? systemTextWithIcons("🟢 ¡Todos listos!") : isAlmostReady ? systemTextWithIcons("🟡 Casi listo") : systemTextWithIcons("⏳ En preparación")} ({readyCount}/{totalCount})
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
                        {percent}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-primary)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        width: `${percent}%`,
                        height: "100%",
                        backgroundColor: isAllReady ? "var(--success)" : isAlmostReady ? "var(--warning)" : "var(--accent-primary)",
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>

                  {group.order.comments && (
                    <div style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      backgroundColor: "rgba(255, 165, 2, 0.08)",
                      borderLeft: "3px solid var(--warning)",
                      padding: "6px 10px",
                      color: "var(--warning)"
                    }}>
                      Obs: {group.order.comments}
                    </div>
                  )}
                </div>

                {/* Ticket Body / Items List */}
                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: "12px",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        opacity: item.status === "READY" ? 0.6 : 1,
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: "15px" }}>
                          <span style={{
                            color: "var(--accent-primary)",
                            fontWeight: "bold",
                            marginRight: "8px",
                            fontSize: "16px"
                          }}>
                            {item.quantity}x
                          </span>
                          <strong>{item.variant.menuItem.name}</strong>{" "}
                          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            ({item.variant.name})
                          </span>
                        </div>
                        
                        {/* Status tag */}
                        <span style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          backgroundColor: item.status === "PREPARING" ? "var(--warning-glow)" : "var(--bg-tertiary)",
                          color: item.status === "PREPARING" ? "var(--warning)" : "var(--text-secondary)"
                        }}>
                          {item.status === "PENDING" ? "Pendiente" : item.status === "PREPARING" ? "Preparando" : "Listo"}
                        </span>
                      </div>

                      {item.comments && (
                        <div style={{ fontSize: "13px", color: "var(--accent-secondary)", fontStyle: "italic" }}>
                          * {item.comments}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                        {item.status === "PENDING" && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "PREPARING")}
                            className="secondary-btn"
                            style={{
                              flex: 1,
                              padding: "6px 12px",
                              fontSize: "13px",
                              backgroundColor: "rgba(255, 165, 2, 0.15)",
                              borderColor: "rgba(255, 165, 2, 0.3)",
                              color: "var(--warning)"
                            }}
                          >
                            <Play size={12} style={{ marginRight: "4px" }} />
                            Preparar
                          </button>
                        )}
                        {(item.status === "PENDING" || item.status === "PREPARING") && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "READY")}
                            className="glow-btn"
                            style={{
                              flex: 1,
                              padding: "6px 12px",
                              fontSize: "13px"
                            }}
                          >
                            <CheckCircle size={12} style={{ marginRight: "4px" }} />
                            Listo
                          </button>
                        )}
                        {item.status === "READY" && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, "SERVED")}
                            className="secondary-btn"
                            style={{
                              flex: 1,
                              padding: "6px 12px",
                              fontSize: "13px",
                              backgroundColor: "rgba(46, 213, 115, 0.1)",
                              borderColor: "rgba(46, 213, 115, 0.3)",
                              color: "var(--success)"
                            }}
                          >
                            Entregar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer: Call Waiter Button */}
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: "var(--bg-tertiary)",
                  borderTop: "1px solid var(--border-light)"
                }}>
                  <button
                    onClick={() => handleCallWaiter(group.order.id, group.order.table ? `Mesa ${group.order.table.number}` : group.order.customerName)}
                    disabled={isCalling}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: isAllReady ? "none" : "1px solid var(--border-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: isCalling ? "not-allowed" : "pointer",
                      backgroundColor: isCalled
                        ? "var(--success)"
                        : isAllReady
                        ? "var(--success)"
                        : isAlmostReady
                        ? "rgba(255, 165, 2, 0.2)"
                        : "var(--bg-secondary)",
                      color: isCalled || isAllReady
                        ? "#ffffff"
                        : isAlmostReady
                        ? "var(--warning)"
                        : "var(--text-primary)",
                      boxShadow: isAllReady ? "0 0 14px rgba(46, 213, 115, 0.4)" : "none",
                      transition: "all var(--transition-fast)"
                    }}
                  >
                    {isCalling ? (
                      <>
                        <Loader2 size={16} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                        Llamando al mesero...
                      </>
                    ) : isCalled ? (
                      <>
                        <CheckCircle2 size={16} />
                        ¡Mesero notificado! {systemIconForEmoji("🛎️")}
                      </>
                    ) : isAllReady ? (
                      <>
                        <BellRing size={16} />
                        {systemIconForEmoji("🛎️")} ¡Llamar al Mesero (Mesa Lista)!
                      </>
                    ) : (
                      <>
                        <BellRing size={16} />
                        {systemIconForEmoji("🛎️")} Llamar al Mesero
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded CSS spinner style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
