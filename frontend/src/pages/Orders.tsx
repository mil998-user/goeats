import { appAlert, appConfirm, appPrompt } from "../components/AppDialogs";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { OrderStaffLine } from "../components/OrderStaffLine";
import {
  Search,
  Eye,
  X,
  DollarSign,
  Truck,
  Utensils,
  ShoppingBag,
  User,
  Clock,
  Printer
} from "lucide-react";
import { comandaFromOrder, printComanda } from "../utils/comanda";

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "DINE_IN" | "TAKEOUT" | "DELIVERY">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Transfer verification modal states
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/orders");
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      const handleSocketUpdate = () => {
        fetchOrders();
      };
      socket.on("new-order", handleSocketUpdate);
      socket.on("order-status-updated", handleSocketUpdate);
      socket.on("order-cancelled", handleSocketUpdate);
      // An order moved to another table, or tables joined or separated
      socket.on("order-table-changed", handleSocketUpdate);
      socket.on("tables-updated", handleSocketUpdate);
      // Al volver la conexion (senal, celular desbloqueado) se piden los datos de nuevo
      socket.on("connect", handleSocketUpdate);

      return () => {
        socket.off("new-order", handleSocketUpdate);
        socket.off("order-status-updated", handleSocketUpdate);
        socket.off("order-cancelled", handleSocketUpdate);
        socket.off("order-table-changed", handleSocketUpdate);
        socket.off("tables-updated", handleSocketUpdate);
        socket.off("connect", handleSocketUpdate);
      };
    }
  }, [socket]);

  const handleApprovePayment = async (orderId: number) => {
    setVerifying(true);
    try {
      const res = await apiRequest(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: "PREPARING",
          paymentStatus: "APPROVED"
        })
      });
      if (res.success) {
        alert("Pago aprobado con éxito. El pedido fue enviado a cocina.");
        setSelectedOrderForReceipt(null);
        fetchOrders();
      }
    } catch (err: any) {
      alert("Error al aprobar pago: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectPayment = async (orderId: number) => {
    if (!(await appConfirm("¿Estás seguro de rechazar este pago y cancelar el pedido?"))) return;
    setVerifying(true);
    try {
      const res = await apiRequest(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: "CANCELLED",
          paymentStatus: "REJECTED"
        })
      });
      if (res.success) {
        alert("Pago rechazado. El pedido fue cancelado.");
        setSelectedOrderForReceipt(null);
        fetchOrders();
      }
    } catch (err: any) {
      alert("Error al rechazar pago: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleAttend = async (orderId: number) => {
    try {
      await apiRequest(`/orders/${orderId}/attend`, { method: "POST" });
      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo tomar el pedido.");
      fetchOrders();
    }
  };

  const askReason = (text: string) =>
    appPrompt(`${text}\nEscribe el motivo: lo verá el cliente.`, { placeholder: "Ej. Se nos acabó el pollo", confirmLabel: "Confirmar" });

  // Cash and transfer orders wait for the register (engineers, 25 nov)
  const handleAccept = async (order: any) => {
    try {
      await apiRequest(`/orders/${order.id}/status`, { method: "PUT", body: JSON.stringify({ status: "PREPARING" }) });
      fetchOrders();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "No se pudo aceptar.");
    }
  };

  const handleReject = async (order: any) => {
    const reason = await askReason(`Rechazar el pedido #${order.id} de ${order.customerName}`);
    if (!reason) return;
    try {
      await apiRequest(`/orders/${order.id}/cancel`, { method: "POST", body: JSON.stringify({ cancelReason: reason }) });
      fetchOrders();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "No se pudo rechazar.");
    }
  };

  const handleCancel = async (order: any) => {
    const reason = await askReason(`Cancelar el pedido #${order.id}`);
    if (!reason) return;
    try {
      const res = await apiRequest(`/orders/${order.id}/cancel`, { method: "POST", body: JSON.stringify({ cancelReason: reason }) });
      if (res.order?.paymentStatus === "REFUND_PENDING") appAlert("Pedido cancelado. El cliente ya pagó: devuélvele el dinero y márcalo como devuelto.");
      fetchOrders();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "No se pudo cancelar.");
    }
  };

  const handleRefundDone = async (order: any) => {
    if (!(await appConfirm(`¿Ya le devolviste $${order.total.toFixed(2)} a ${order.customerName}?`, "Sí, ya devolví"))) return;
    try {
      await apiRequest(`/orders/${order.id}/refund-done`, { method: "POST" });
      fetchOrders();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  };

  const handleMarkDelivered = async (orderId: number) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "DELIVERED" })
      });
      fetchOrders();
    } catch (err: any) {
      alert("Error al cerrar el pedido: " + err.message);
    }
  };

  // Comanda: only date and time, service, order number and dishes (bosses, 17 nov)
  const handlePrintComanda = (order: any) => {
    printComanda(comandaFromOrder(order));
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    // Search
    const matchesSearch =
      o.id.toString().includes(searchTerm) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type Filter
    const matchesType = activeFilter === "ALL" || o.type === activeFilter;

    // Status Filter
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "PENDING":
        return { backgroundColor: "rgba(255, 202, 38, 0.3)", color: "#000000" };
      case "PREPARING":
        return { backgroundColor: "rgba(248, 96, 21, 0.12)", color: "#f86015" };
      case "READY":
        return { backgroundColor: "rgba(212, 37, 24, 0.1)", color: "#d42518" };
      case "DELIVERING":
        return { backgroundColor: "#000000", color: "#ffca26" };
      case "DELIVERED":
        return { backgroundColor: "rgba(30, 143, 78, 0.12)", color: "#1e8f4e" };
      case "CANCELLED":
        return { backgroundColor: "rgba(0, 0, 0, 0.06)", color: "#737373" };
      default:
        return { backgroundColor: "rgba(0,0,0,0.05)", color: "#666" };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Pendiente";
      case "PREPARING": return "En Cocina";
      case "READY": return "Listo para Servir/Entregar";
      case "DELIVERING": return "En Reparto";
      case "DELIVERED": return "Entregado";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case "DINE_IN":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#000000", backgroundColor: "rgba(243, 232, 204, 0.8)", padding: "3px 8px", borderRadius: "12px" }}>
            <Utensils size={12} /> Mesa
          </span>
        );
      case "TAKEOUT":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#f86015", backgroundColor: "rgba(248, 96, 21, 0.1)", padding: "3px 8px", borderRadius: "12px" }}>
            <ShoppingBag size={12} /> Llevar
          </span>
        );
      case "DELIVERY":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#d42518", backgroundColor: "rgba(212, 37, 24, 0.08)", padding: "3px 8px", borderRadius: "12px" }}>
            <Truck size={12} /> Domicilio
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "clamp(12px, 3vw, 25px)", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 24px)", fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-body)" }}>
            Listado de Pedidos
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            Visualiza y administra todos los pedidos activos, entregados y sus cobros.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass-card" style={{ padding: "clamp(14px, 2.5vw, 22px)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          
          {/* Search Box */}
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "5px 15px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-light)",
            flex: 1,
            maxWidth: "350px",
            gap: "10px"
          }}>
            <Search size={16} style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder="Buscar por Nro Pedido o Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                fontSize: "13px",
                padding: "6px 0",
                border: "none",
                background: "none",
                outline: "none",
                color: "var(--text-primary)"
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ cursor: "pointer", color: "var(--text-secondary)", background: "none", border: "none" }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ padding: "6px 12px", fontSize: "13px", outline: "none", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)" }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="PREPARING">En cocina</option>
              <option value="READY">Listos</option>
              <option value="DELIVERING">En reparto</option>
              <option value="DELIVERED">Entregados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="scrollable-tabs" style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", overflowX: "auto" }}>
          {[
            { id: "ALL", label: "Todos" },
            { id: "DINE_IN", label: "Mesas" },
            { id: "TAKEOUT", label: "Recoger en local" },
            { id: "DELIVERY", label: "Domicilio" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                background: "none",
                borderBottom: activeFilter === tab.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
                color: activeFilter === tab.id ? "var(--accent-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid/List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "var(--text-secondary)" }}>Cargando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-card" style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)", borderRadius: "var(--radius-lg)" }}>
            No se encontraron pedidos con los filtros seleccionados.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const badgeStyle = getStatusBadgeStyles(order.status);
            const isUnpaid = order.paymentStatus !== "APPROVED" && !order.payphoneTransactionId;
            const hasTransferReceipt = order.paymentMethodString === "TRANSFER" && (order.paymentReceipt || order.hasReceipt);
            const canManage = user?.role !== "MOZO";
            const waitsForRegister = order.status === "PENDING" && order.type !== "DINE_IN" && isUnpaid && !hasTransferReceipt;
            const finished = order.status === "DELIVERED" || order.status === "CANCELLED";
            const canCancel =
              !finished && !waitsForRegister && (canManage || order.type === "DINE_IN") && !(order.status === "DELIVERING" && order.pickedUpAt);

            return (
              <div
                key={order.id}
                className="glass-card animate-fade-in"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 25px",
                  borderRadius: "var(--radius-lg)",
                  borderLeft: `5px solid ${badgeStyle.color}`,
                  flexWrap: "wrap",
                  gap: "20px"
                }}
              >
                {/* Left Side: Order Basics */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>
                      #{order.id}
                    </span>
                    {getOrderTypeBadge(order.type)}
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Clock size={12} /> {dateStr}
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <User size={14} style={{ color: "var(--text-muted)" }} />
                    {order.customerName}
                    {order.table && (
                      <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "normal" }}>
                        (Mesa {order.table.number})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {order.items.length} platos • Total: <strong style={{ color: "var(--accent-primary)" }}>${order.total.toFixed(2)}</strong>
                  </div>
                  <OrderStaffLine order={order} canAttend={user?.role === "MOZO"} onAttend={handleAttend} />
                </div>

                {/* Center Side: Platos list preview */}
                <div style={{ flex: 1, minWidth: "250px", fontSize: "13px", color: "var(--text-secondary)", borderLeft: "1px solid var(--border-light)", paddingLeft: "20px" }}>
                  <ul style={{ margin: 0, paddingLeft: "15px", listStyleType: "circle" }}>
                    {order.items.slice(0, 3).map((item: any) => (
                      <li key={item.id}>
                        {item.quantity}x {item.variant?.menuItem?.name} {item.variant?.name !== "Unidad" && `(${item.variant?.name})`}
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li style={{ listStyleType: "none", color: "var(--text-muted)", fontStyle: "italic", marginLeft: "-15px", marginTop: "3px" }}>
                        + {order.items.length - 3} platos más...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Right Side: Status Badge & Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {/* Status Badge */}
                  <span style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    ...badgeStyle
                  }}>
                    {order.status === "PENDING" && order.type !== "DINE_IN" && isUnpaid ? "Por aceptar" : getStatusText(order.status)}
                  </span>
                  {order.status === "CANCELLED" && order.deliveryObservation && (
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "260px", overflowWrap: "anywhere" }}>{order.deliveryObservation}</span>
                  )}

                  {/* Actions buttons panel */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Print ticket */}
                    <button
                      onClick={() => handlePrintComanda(order)}
                      title="Imprimir Comanda"
                      style={{
                        padding: "8px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-light)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Printer size={16} />
                    </button>

                    {/* Verify Bank Transfer Receipt */}
                    {hasTransferReceipt && isUnpaid && user?.role !== "MOZO" && (
                      <button
                        onClick={async () => { const full = order.paymentReceipt ? order : (await apiRequest(`/orders/${order.id}`)).order; setSelectedOrderForReceipt(full); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(248, 96, 21, 0.1)",
                          border: "1px solid rgba(248, 96, 21, 0.2)",
                          color: "#f86015",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        <Eye size={14} /> Verificar Pago
                      </button>
                    )}

                    {/* Cobrar (For unpaid Dine-in or Takeout) */}
                    {isUnpaid && order.status !== "CANCELLED" && (order.type === "DINE_IN" || order.type === "TAKEOUT") && user?.role !== "MOZO" && (
                      <button
                        onClick={() => navigate(`/pos?orderId=${order.id}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--accent-primary)",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        <DollarSign size={14} /> Cobrar
                      </button>
                    )}

                    {/* Close a paid order the customer already received */}
                    {!isUnpaid && order.status === "READY" && order.type !== "DELIVERY" && (
                      <button
                        onClick={() => handleMarkDelivered(order.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--accent-primary)",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Marcar entregado
                      </button>
                    )}

                    {waitsForRegister && canManage && (
                      <>
                        <button type="button" className="glow-btn" style={{ padding: "6px 14px", fontSize: "13px" }} onClick={() => handleAccept(order)}>
                          Aceptar
                        </button>
                        <button type="button" className="secondary-btn" style={{ padding: "6px 14px", fontSize: "13px", color: "var(--danger)" }} onClick={() => handleReject(order)}>
                          Rechazar
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button type="button" className="secondary-btn" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => handleCancel(order)}>
                        Cancelar
                      </button>
                    )}

                    {order.paymentStatus === "REFUND_PENDING" && (
                      canManage ? (
                        <button type="button" className="secondary-btn" style={{ padding: "6px 12px", fontSize: "13px", color: "var(--danger)" }} onClick={() => handleRefundDone(order)}>
                          Devolución pendiente: marcar devuelto
                        </button>
                      ) : (
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", alignSelf: "center" }}>Devolución pendiente</span>
                      )
                    )}
                    {order.paymentStatus === "REFUNDED" && (
                      <span style={{ fontSize: "13px", fontWeight: 600, alignSelf: "center" }}>Dinero devuelto</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VERIFY TRANSFER RECEIPT MODAL */}
      {selectedOrderForReceipt && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", margin: 0, color: "var(--text-primary)" }}>
              Comprobante de Transferencia Bancaria
            </h2>

            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Pedido <strong>#{selectedOrderForReceipt.id}</strong> • Cliente: <strong>{selectedOrderForReceipt.customerName}</strong>
              <br />
              Total a cobrar: <strong style={{ color: "var(--accent-primary)" }}>${selectedOrderForReceipt.total.toFixed(2)}</strong>
            </div>

            {/* Receipt Image */}
            <div style={{
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-sm)",
              padding: "10px",
              backgroundColor: "var(--bg-secondary)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxHeight: "350px",
              overflow: "auto"
            }}>
              <img
                src={selectedOrderForReceipt.paymentReceipt}
                alt="Comprobante bancario cargado"
                style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "4px" }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "10px"
            }}>
              <button
                type="button"
                onClick={() => handleApprovePayment(selectedOrderForReceipt.id)}
                className="glow-btn"
                disabled={verifying}
                style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}
              >
                {verifying ? "Procesando..." : "✓ Aprobar y Enviar a Cocina"}
              </button>

              <button
                type="button"
                onClick={() => handleRejectPayment(selectedOrderForReceipt.id)}
                className="secondary-btn"
                disabled={verifying}
                style={{ padding: "12px", fontSize: "13px", color: "#d42518", borderColor: "rgba(212, 37, 24, 0.3)", fontWeight: 600 }}
              >
                ✗ Rechazar y Cancelar Pedido
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderForReceipt(null)}
              className="secondary-btn"
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
