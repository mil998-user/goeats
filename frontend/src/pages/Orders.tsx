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
import { escapeHtml } from "../utils/html";

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

      return () => {
        socket.off("new-order", handleSocketUpdate);
        socket.off("order-status-updated", handleSocketUpdate);
        socket.off("order-cancelled", handleSocketUpdate);
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
    if (!window.confirm("¿Estás seguro de rechazar este pago y cancelar el pedido?")) return;
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

  const handlePrintComanda = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes para poder imprimir.");
      return;
    }

    const itemsHtml = order.items.map((i: any) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 6px 0; font-size: 14px;">${i.quantity}x ${escapeHtml(i.variant?.menuItem?.name || "Plato")} (${escapeHtml(i.variant?.name || "Porción")})</td>
        <td style="padding: 6px 0; text-align: right; font-size: 14px;">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>
      ${i.comments ? `
      <tr>
        <td colspan="2" style="font-size: 12px; color: #666; font-style: italic; padding-bottom: 6px;">
          * Nota: ${escapeHtml(i.comments)}
        </td>
      </tr>
      ` : ""}
    `).join("");

    const dateStr = new Date(order.createdAt).toLocaleString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda - GoEats</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: monospace; color: #000; width: 80mm; }
            }
            body { font-family: monospace; padding: 20px; width: 80mm; margin: 0 auto; color: #333; }
            .header { text-align: center; margin-bottom: 15px; }
            .title { font-size: 18px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
            .details { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .table-items { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .total { font-size: 16px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">GoEats Comanda</div>
            <div style="font-size: 12px;">Comprobante de Pedido</div>
          </div>
          <div class="details">
            <div><strong>Fecha:</strong> ${dateStr}</div>
            <div><strong>Tipo:</strong> ${order.type === "DINE_IN" ? "SERVICIO EN MESA" : order.type === "TAKEOUT" ? "PARA LLEVAR / TAKEOUT" : "DOMICILIO / DELIVERY"}</div>
            ${order.table ? `<div><strong>Mesa:</strong> Mesa ${order.table.number}</div>` : ""}
            <div><strong>Cliente:</strong> ${escapeHtml(order.customerName || "Varios")}</div>
            <div><strong>Nro Pedido:</strong> #${order.id}</div>
          </div>
          <table class="table-items">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <span>TOTAL</span>
            <span>$${order.total.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>*** No válido como factura ***</p>
            <p>¡Gracias por su preferencia!</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        return { backgroundColor: "rgba(255, 159, 67, 0.1)", color: "#ff9f43" };
      case "PREPARING":
        return { backgroundColor: "rgba(9, 132, 227, 0.1)", color: "#0984e3" };
      case "READY":
        return { backgroundColor: "rgba(0, 184, 148, 0.1)", color: "#00b894" };
      case "DELIVERING":
        return { backgroundColor: "rgba(108, 92, 231, 0.1)", color: "#6c5ce7" };
      case "DELIVERED":
        return { backgroundColor: "rgba(17, 17, 17, 0.1)", color: "var(--accent-primary)" };
      case "CANCELLED":
        return { backgroundColor: "rgba(255, 71, 87, 0.1)", color: "#ff4757" };
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
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#0984e3", backgroundColor: "rgba(9, 132, 227, 0.08)", padding: "3px 8px", borderRadius: "12px" }}>
            <Utensils size={12} /> Mesa
          </span>
        );
      case "TAKEOUT":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#e67e22", backgroundColor: "rgba(230, 126, 34, 0.08)", padding: "3px 8px", borderRadius: "12px" }}>
            <ShoppingBag size={12} /> Llevar
          </span>
        );
      case "DELIVERY":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#6c5ce7", backgroundColor: "rgba(108, 92, 231, 0.08)", padding: "3px 8px", borderRadius: "12px" }}>
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
            { id: "TAKEOUT", label: "Para Llevar" },
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
            const hasTransferReceipt = order.paymentMethodString === "TRANSFER" && order.paymentReceipt;

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
                    {getStatusText(order.status)}
                  </span>

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
                        onClick={() => setSelectedOrderForReceipt(order)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "rgba(255, 159, 67, 0.1)",
                          border: "1px solid rgba(255, 159, 67, 0.2)",
                          color: "#ff9f43",
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

                    {order.paymentStatus === "REFUND_PENDING" && (
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", alignSelf: "center" }}>
                        Reembolso pendiente
                      </span>
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
                style={{ padding: "12px", fontSize: "13px", color: "#ff4757", borderColor: "rgba(255, 71, 87, 0.3)", fontWeight: 600 }}
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
