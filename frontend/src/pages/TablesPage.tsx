import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { TableQRModal } from "../components/TableQRModal";
import {
  Utensils,
  Users,
  Clock,
  Printer,
  Plus,
  RefreshCw,
  X,
  PlusCircle,
  CreditCard,
  QrCode
} from "lucide-react";
import { escapeHtml } from "../utils/html";
import { TableGroupActions } from "../components/TableGroupActions";

export const TablesPage: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [diningAreas, setDiningAreas] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTable, setQrTable] = useState<any | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<any | null>(null);
  const [suggestedNetworkIp, setSuggestedNetworkIp] = useState<string | null>(null);
  const [tableNotice, setTableNotice] = useState<string | null>(null);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch dining areas with tables
      const areasRes = await apiRequest("/tables/dining-areas");
      if (areasRes.success) {
        const areas = areasRes.diningAreas || [];
        setDiningAreas(areas);
        if (areasRes.restaurant) {
          setRestaurantInfo(areasRes.restaurant);
        }
        if (areasRes.serverNetwork?.localIp) {
          setSuggestedNetworkIp(areasRes.serverNetwork.localIp);
        }
        
        // Auto-select first area if none selected
        if (areas.length > 0 && !selectedAreaId) {
          setSelectedAreaId(areas[0].id);
        }
      }

      // 2. Fetch active DINE_IN orders to match details
      const ordersRes = await apiRequest("/orders");
      if (ordersRes.success) {
        // Only active dine-in orders
        const dineInActive = (ordersRes.orders || []).filter(
          (o: any) => o.type === "DINE_IN" && o.status !== "DELIVERED" && o.status !== "CANCELLED"
        );
        setActiveOrders(dineInActive);
      }
    } catch (err) {
      console.error("Error fetching tables data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      const handleSocketUpdate = () => {
        fetchData();
      };
      socket.on("new-order", handleSocketUpdate);
      socket.on("order-status-updated", handleSocketUpdate);
      socket.on("order-cancelled", handleSocketUpdate);
      socket.on("tables-updated", handleSocketUpdate);

      return () => {
        socket.off("new-order", handleSocketUpdate);
        socket.off("order-status-updated", handleSocketUpdate);
        socket.off("order-cancelled", handleSocketUpdate);
        socket.off("tables-updated", handleSocketUpdate);
      };
    }
  }, [socket, selectedAreaId]);

  // Keep selected table details synced when activeOrders changes
  useEffect(() => {
    if (selectedTable) {
      const updatedAreas = diningAreas;
      let foundTable = null;
      for (const area of updatedAreas) {
        const tbl = area.tables?.find((t: any) => t.id === selectedTable.id);
        if (tbl) {
          foundTable = tbl;
          break;
        }
      }
      if (foundTable) {
        setSelectedTable(foundTable);
      }
    }
  }, [diningAreas]);

  // Find order associated with a table
  const getTableOrder = (tableId: number) => {
    return activeOrders.find((o) => o.tableId === tableId);
  };

  const allTables: any[] = diningAreas.flatMap((a) => a.tables || []);
  const findTable = (id: number | null | undefined) => allTables.find((t) => t.id === id);

  const handleTableClick = (table: any) => {
    // A joined table shares the bill of its main table
    if (table.joinedToId) {
      const main = findTable(table.joinedToId);
      if (main) {
        setSelectedTable(main);
        return;
      }
    }
    if (table.status === "FREE") {
      if (user?.role === "RESTAURANT_OWNER") {
        alert("Los pedidos en mesa los toma un mesero. Si aún no tienes uno, créalo en Ajustes → Personal.");
        return;
      }
      // Redirect to POS with tableId parameter to start order
      navigate(`/pos?tableId=${table.id}`);
    } else {
      // Occupied: open comanda details sidebar
      setSelectedTable(table);
    }
  };

  const handlePrintComanda = (order: any) => {
    if (!order) return;

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
          <title>Comanda Mesa ${selectedTable?.number || ""} - GoEats</title>
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
            <div style="font-size: 12px;">Comprobante de Pre-cuenta / Mesa</div>
          </div>
          <div class="details">
            <div><strong>Fecha:</strong> ${dateStr}</div>
            <div><strong>Mesa:</strong> Mesa ${selectedTable?.number || ""}</div>
            <div><strong>Cliente:</strong> ${escapeHtml(order.customerName || "Varios")}</div>
            <div><strong>Nro Pedido:</strong> #${order.id}</div>
          </div>
          <table class="table-items">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <span>TOTAL A COBRAR</span>
            <span>$${order.total.toFixed(2)}</span>
          </div>
          <div class="footer">
            <p>*** Pre-cuenta sugerida - No válido como boleta/factura ***</p>
            <p>¡Gracias por su visita!</p>
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

  const activeArea = diningAreas.find((a) => a.id === selectedAreaId);
  const selectedTableOrder = selectedTable ? getTableOrder(selectedTable.id) : null;

  return (
    <div className="mobile-pos-container" style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      {/* LEFT: Tables Viewport */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "clamp(12px, 3vw, 24px)", overflowY: "auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px", flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "12px" }}>
              <Utensils size={28} className="text-accent" style={{ color: "var(--accent-primary)" }} />
              Servicios de Mesa
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Administra el salón, revisa consumos y factura directamente.
            </p>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => {
                setQrTable(null);
                setShowQRModal(true);
              }}
              className="glow-btn"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                minHeight: "38px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="Ver, descargar o imprimir códigos QR para pedidos en mesa"
            >
              <QrCode size={16} />
              Códigos QR de Mesas
            </button>

            <button 
              onClick={() => fetchData(true)} 
              className="secondary-btn" 
              style={{ padding: "8px 16px", fontSize: "13px", minHeight: "38px", whiteSpace: "nowrap" }}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "spin" : ""} style={{ marginRight: "4px" }} />
              {refreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        {/* Salones Tab bar */}
        {diningAreas.length > 0 ? (
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", paddingBottom: "8px", flexShrink: 0 }}>
            {diningAreas.map((area) => {
              const isActive = area.id === selectedAreaId;
              const occupiedCount = area.tables?.filter((t: any) => t.status === "OCCUPIED").length || 0;
              const totalCount = area.tables?.length || 0;

              return (
                <button
                  key={area.id}
                  onClick={() => {
                    setSelectedAreaId(area.id);
                    setSelectedTable(null); // Clear selected table when switching areas
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    backgroundColor: isActive ? "var(--accent-glow)" : "var(--bg-secondary)",
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    border: isActive ? "1px solid var(--accent-primary)" : "1px solid var(--border-light)"
                  }}
                >
                  {area.name}
                  <span style={{
                    fontSize: "13px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: 700
                  }}>
                    {occupiedCount}/{totalCount}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="glass-card" style={{ padding: "30px", textAlign: "center", marginBottom: "24px" }}>
              <p style={{ color: "var(--text-secondary)" }}>No hay salones creados. Ve a Ajustes {`>`} Salones y Mesas para crearlos.</p>
            </div>
          )
        )}

        {/* Grid of Tables */}
        {loading ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
            <p style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <RefreshCw className="spin" size={18} /> Cargando plano de mesas...
            </p>
          </div>
        ) : activeArea && activeArea.tables && activeArea.tables.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "18px"
          }}>
            {activeArea.tables.map((table: any) => {
              const isOccupied = table.status === "OCCUPIED";
              const order = getTableOrder(table.id);
              const isSelected = selectedTable?.id === table.id;

              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className="glass-card"
                  style={{
                    padding: "20px",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "130px",
                    borderWidth: isSelected ? "2px" : "1px",
                    borderColor: isSelected 
                      ? "var(--accent-primary)" 
                      : isOccupied 
                        ? "rgba(255, 71, 87, 0.3)" 
                        : "var(--border-light)",
                    backgroundColor: isOccupied 
                      ? "rgba(255, 71, 87, 0.02)" 
                      : "var(--bg-secondary)",
                    transform: isSelected ? "translateY(-2px)" : "none",
                    boxShadow: isSelected ? "0 4px 12px rgba(17, 17, 17, 0.15)" : "none"
                  }}
                >
                  {/* Top: Table Number & Capacity */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 850, color: "var(--text-primary)" }}>
                        Mesa {table.number}
                      </h3>
                      <span style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "2px"
                      }}>
                        <Users size={12} /> {table.capacity} personas
                      </span>
                      {table.joinedToId && (
                        <span data-testid={`joined-${table.id}`} style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", display: "block", marginTop: "2px" }}>
                          Unida a Mesa {findTable(table.joinedToId)?.number || "?"}
                        </span>
                      )}
                    </div>

                    {/* Status Badge & QR Button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrTable(table);
                          setShowQRModal(true);
                        }}
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          border: "1px solid var(--border-light)",
                          borderRadius: "6px",
                          padding: "2px 6px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          color: "var(--text-secondary)"
                        }}
                        title={`Ver código QR de Mesa ${table.number}`}
                      >
                        <QrCode size={12} />
                        QR
                      </button>

                      <span style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        textTransform: "uppercase",
                        backgroundColor: isOccupied ? "rgba(255, 71, 87, 0.1)" : "rgba(46, 213, 115, 0.1)",
                        color: isOccupied ? "var(--danger)" : "var(--success)"
                      }}>
                        {isOccupied ? "Ocupada" : "Libre"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Client Name / Order Total if occupied */}
                  {isOccupied && order && (
                    <div style={{ marginTop: "16px", borderTop: "1px dashed var(--border-light)", paddingTop: "10px" }}>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={order.customerName}>
                        {order.customerName || "Cliente"}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-primary)" }}>
                          ${order.total.toFixed(2)}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                          <Clock size={10} />
                          {(() => {
                            const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                            return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isOccupied && user?.role === "MOZO" && (
                    <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                      <span className="text-accent" style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px"
                      }}>
                        <Plus size={12} /> Abrir
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
              <p>No hay mesas configuradas en este salón.</p>
            </div>
          )
        )}
      </div>

      {/* RIGHT SIDEBAR: Selected Table Comanda */}
      <div
        className={`tables-comanda-sidebar ${selectedTable && selectedTable.status === "OCCUPIED" ? "open" : "mobile-hide"}`}
        style={{
          width: "380px",
          backgroundColor: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          boxShadow: "-2px 0 10px rgba(0,0,0,0.02)"
        }}
      >
        {selectedTable && selectedTable.status === "OCCUPIED" && selectedTableOrder ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            {/* Sidebar Header */}
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800 }}>
                  Mesa {selectedTable.number}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Pedido #{selectedTableOrder.id}
                  </span>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border-hover)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-primary)" }}>
                    {selectedTableOrder.customerName || "Varios"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTable(null)} 
                style={{ padding: "6px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Platos / Items List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.5px" }}>
                Consumos de la Mesa
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedTableOrder.items && selectedTableOrder.items.map((item: any) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-start",
                      paddingBottom: "10px",
                      borderBottom: "1px solid var(--bg-tertiary)"
                    }}
                  >
                    <div style={{ flex: 1, marginRight: "10px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.variant?.menuItem?.name || "Producto"}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        Porción: {item.variant?.name || "Regular"}
                      </p>
                      {item.comments && (
                        <p style={{ fontSize: "13px", color: "var(--warning)", fontStyle: "italic", marginTop: "2px" }}>
                          * {item.comments}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {item.quantity}x
                      </span>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Summary & Actions */}
            <div style={{ padding: "20px", borderTop: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)" }}>
              {/* Total display */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>Total a pagar</span>
                <span style={{ fontSize: "22px", fontWeight: 850, color: "var(--accent-primary)" }}>
                  ${selectedTableOrder.total.toFixed(2)}
                </span>
              </div>

              {(user?.role === "MOZO" || user?.role === "CAJERO") && (
                <TableGroupActions
                  table={selectedTable}
                  orderId={selectedTableOrder.id}
                  allTables={allTables}
                  onChanged={(message) => {
                    setTableNotice(message);
                    setTimeout(() => setTableNotice(null), 6000);
                    fetchData(true);
                  }}
                />
              )}
              {tableNotice && (
                <p role="status" style={{ fontSize: "13px", fontWeight: 700, color: "var(--success)", margin: "0 0 12px" }}>
                  {tableNotice}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                {user?.role === "MOZO" && (
                  <button
                    onClick={() => navigate(`/pos?orderId=${selectedTableOrder.id}`)}
                    className="secondary-btn"
                    style={{ width: "100%", padding: "12px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <PlusCircle size={16} />
                    Agregar más productos
                  </button>
                )}

                {user?.role === "CAJERO" && (
                  <button
                    onClick={() => navigate(`/pos?orderId=${selectedTableOrder.id}&checkout=true`)}
                    className="glow-btn"
                    style={{ width: "100%", padding: "12px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <CreditCard size={16} />
                    Cobrar mesa
                  </button>
                )}

                {(user?.role === "RESTAURANT_OWNER" || user?.role === "PRODUCCION") && (
                  <div style={{ backgroundColor: "rgba(17, 17, 17, 0.05)", borderRadius: "var(--radius-md)", padding: "10px", border: "1px solid var(--accent-glow)", marginBottom: "8px" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                      Acceso de lectura. Las modificaciones y el cobro deben realizarse desde la cuenta del personal autorizado.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handlePrintComanda(selectedTableOrder)}
                  className="secondary-btn"
                  style={{ width: "100%", padding: "12px", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <Printer size={16} />
                  Imprimir Comanda / Pre-cuenta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQrTable(selectedTable);
                    setShowQRModal(true);
                  }}
                  className="secondary-btn"
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: "rgba(255, 71, 87, 0.05)",
                    borderColor: "rgba(255, 71, 87, 0.2)",
                    color: "var(--accent-primary)"
                  }}
                >
                  <QrCode size={16} />
                  Ver / Imprimir QR de Mesa {selectedTable.number}
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Sidebar Empty State */
          <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              color: "var(--text-muted)"
            }}>
              <Utensils size={24} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              Detalles de Mesa
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", maxWidth: "240px" }}>
              Selecciona una mesa ocupada en la cuadrícula para ver el detalle de consumos, agregar productos o procesar el cobro.
            </p>
          </div>
        )}
      </div>

      {/* TABLE QR MODAL */}
      <TableQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        selectedTable={qrTable}
        diningAreas={diningAreas}
        restaurantSlug={restaurantInfo?.slug || (user as any)?.restaurantSlug || "prueba"}
        restaurantName={restaurantInfo?.name || user?.restaurantName || "GoEats"}
        wifiSsid={restaurantInfo?.wifiSsid}
        wifiPassword={restaurantInfo?.wifiPassword}
        suggestedNetworkIp={suggestedNetworkIp}
      />
    </div>
  );
};
