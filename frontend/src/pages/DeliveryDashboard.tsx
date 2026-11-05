import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Truck,
  Wallet,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { RouteMap } from "../components/RouteMap";
import { SupportModal } from "../components/SupportModal";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";


interface Order {
  id: number;
  customerName: string;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  shippingCost: number;
  total: number;
  comments: string | null;
  status: string;
  deliveryObservation: string | null;
  paymentMethodString?: string;
  requiresPin?: boolean;
  financialBreakdown?: {
    foodSubtotal: number;
    commissionPct: number;
    appCommissionFromProvider: number;
    providerPayAmount: number;
    driverBonus: number;
    driverEarnings: number;
    customerTotal: number;
  };
  restaurant: {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    mapLatitude?: number | null;
    mapLongitude?: number | null;
    deliveryCommissionPercentage?: number;
  };
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    variant: {
      name: string;
      menuItem: {
        name: string;
      };
    };
  }>;
}

interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"available" | "active" | "wallet" | "saas_plans">("available");
  
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  
  // Wallet states
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [maxDebtLimit, setMaxDebtLimit] = useState<number>(50);
  const [isDebtLocked, setIsDebtLocked] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [deliveryRate, setDeliveryRate] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [observationText, setObservationText] = useState<{ [key: number]: string }>({});
  const [showObsInput, setShowObsInput] = useState<{ [key: number]: boolean }>({});
  const [showMapForOrder, setShowMapForOrder] = useState<{ [key: number]: boolean }>({});
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportOrderId, setSupportOrderId] = useState<number | undefined>(undefined);

  // SaaS States
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [rechargeMethod, setRechargeMethod] = useState<"CARD" | "TRANSFER">("CARD");
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");
  const [payphoneTransactionId, setPayphoneTransactionId] = useState<string>("");
  const [showPayphoneSimulator, setShowPayphoneSimulator] = useState(false);
  const [submittingRecharge, setSubmittingRecharge] = useState(false);

  const handleBuyRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    setSubmittingRecharge(true);
    try {
      const res = await apiRequest("/saas/purchase", {
        method: "POST",
        body: JSON.stringify({
          type: "RECHARGE",
          planName: selectedCard.name,
          amount: selectedCard.amount,
          paymentMethod: rechargeMethod,
          paymentReceipt: rechargeMethod === "TRANSFER" ? paymentReceipt : undefined,
          payphoneTransactionId: rechargeMethod === "CARD" ? payphoneTransactionId : undefined
        })
      });

      if (res.success) {
        alert(res.message || "Compra registrada con éxito.");
        setSelectedCard(null);
        setPaymentReceipt("");
        setPayphoneTransactionId("");
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Error al procesar la compra");
    } finally {
      setSubmittingRecharge(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load active rate & available orders
      const availRes = await apiRequest("/delivery/available");
      if (availRes.success) {
        setAvailableOrders(availRes.orders || []);
        setDeliveryRate(availRes.rate);
      }

      // 2. Load active deliveries
      const activeRes = await apiRequest("/delivery/active");
      if (activeRes.success) {
        setActiveOrders(activeRes.orders || []);
      }

      // 3. Load wallet balance & history
      const walletRes = await apiRequest("/delivery/wallet");
      if (walletRes.success) {
        setWalletBalance(walletRes.walletBalance || 0);
        setMaxDebtLimit(walletRes.maxDebtLimit ?? 50);
        setIsDebtLocked(!!walletRes.isDebtLocked);
        setTransactions(walletRes.transactions || []);
      }

      // 4. Load SaaS plans
      try {
        const plansRes = await apiRequest("/saas/plans");
        if (plansRes.success) {
          setPlans(plansRes.plans || []);
        }
      } catch (plansErr) {
        console.error("Error loading plans:", plansErr);
      }
    } catch (err) {
      console.error("Error loading driver data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTakeOrder = async (orderId: number, commission: number) => {
    if (isDebtLocked) {
      alert(`Tu cuenta tiene una deuda acumulada que alcanza el límite permitido (-$${maxDebtLimit.toFixed(2)}). Realiza una recarga o abono a GoEats para volver a tomar pedidos.`);
      return;
    }

    if (walletBalance < commission && walletBalance <= -maxDebtLimit) {
      alert(`Saldo insuficiente. Tu balance actual es $${walletBalance.toFixed(2)} y supera el límite de deuda.`);
      return;
    }

    if (!confirm("¿Deseas aceptar este pedido? Se descontará la comisión de despacho correspondiente.")) return;

    setActionLoading(orderId);
    try {
      const res = await apiRequest(`/delivery/take/${orderId}`, { method: "POST" });
      if (res.success) {
        alert("¡Pedido tomado con éxito!");
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Error al tomar el pedido");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (orderId: number, requiresPin?: boolean) => {
    let pinToSend: string | undefined = undefined;

    if (requiresPin) {
      const enteredPin = prompt("INGRESE EL PIN DE 4 DÍGITOS DEL CLIENTE (PEDIDOSYA STYLE):\n(El cliente tiene este código en su pantalla de seguimiento para validar la entrega)");
      if (enteredPin === null) return; // cancelado
      if (!enteredPin.trim()) {
        alert("Debes ingresar el PIN de 4 dígitos proporcionado por el cliente.");
        return;
      }
      pinToSend = enteredPin.trim();
    } else {
      if (!confirm("¿Confirmas que has entregado este pedido al cliente?")) return;
    }

    setActionLoading(orderId);
    try {
      const res = await apiRequest(`/delivery/complete/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ pin: pinToSend }),
      });
      if (res.success) {
        alert("¡Entrega verificada y completada con éxito!");
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Error al completar la entrega");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddObservation = async (orderId: number) => {
    const text = observationText[orderId];
    if (!text || !text.trim()) {
      alert("Por favor escribe una observación");
      return;
    }

    setActionLoading(orderId);
    try {
      const res = await apiRequest(`/delivery/observation/${orderId}`, {
        method: "POST",
        body: JSON.stringify({ observation: text }),
      });
      if (res.success) {
        alert("Observación registrada correctamente.");
        setShowObsInput(prev => ({ ...prev, [orderId]: false }));
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Error al guardar observación");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDriverLocationUpdate = async (orderId: number, lat: number, lng: number) => {
    // Optimistically update active orders in local state for instantaneous UI feedback
    setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, driverLat: lat, driverLng: lng } : o));
    try {
      await apiRequest("/delivery/location", {
        method: "POST",
        body: JSON.stringify({ orderId, latitude: lat, longitude: lng }),
      });
    } catch (err) {
      // Ignore background GPS sync errors
    }
  };

  const commissionCost = deliveryRate?.costPerOrder || 0.50;

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "var(--text-primary)", fontWeight: 700 }}>Panel de Motorizado</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Hola, <strong style={{ color: "var(--text-primary)" }}>{user?.name}</strong>. Gestiona tus entregas y billetera virtual.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Virtual Wallet Quick Display */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: walletBalance > 0 ? "rgba(46, 213, 115, 0.08)" : "rgba(255, 71, 87, 0.08)",
            border: `1px solid ${walletBalance > 0 ? "rgba(46, 213, 115, 0.2)" : "rgba(255, 71, 87, 0.2)"}`,
            padding: "8px 16px",
            borderRadius: "var(--radius-md)"
          }}>
            <Wallet size={18} color={walletBalance > 0 ? "var(--success)" : "var(--accent-primary)"} />
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Saldo Wallet</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: walletBalance > 0 ? "var(--success)" : "var(--accent-primary)" }}>
                ${walletBalance.toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSupportOrderId(undefined);
              setIsSupportOpen(true);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#dc2626",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Línea de emergencia y ayuda para motorizados"
          >
            <HelpCircle size={16} />
            SOS / Soporte en Ruta
          </button>

          <button
            onClick={loadData}
            style={{
              padding: "10px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-light)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="scrollable-tabs" style={{
        display: "flex",
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)",
        padding: "4px",
        marginBottom: "30px",
        border: "1px solid var(--border-light)"
      }}>
        {[
          { id: "available", label: `Pedidos Disponibles (${availableOrders.length})`, icon: Clock },
          { id: "active", label: `Mis Entregas (${activeOrders.length})`, icon: Truck },
          { id: "wallet", label: "Mi Billetera", icon: Wallet },
          { id: "saas_plans", label: systemTextWithIcons("Planes de Recarga 🎫"), icon: Wallet }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: activeTab === t.id ? "var(--bg-primary)" : "transparent",
                color: activeTab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
          <div className="skeleton" style={{ width: "100%", height: "200px", borderRadius: "var(--radius-lg)" }} />
        </div>
      ) : (
        <div>
          {/* Tab 1: Available Orders */}
          {activeTab === "available" && (
            <div>
              {availableOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                  <Clock size={48} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No hay pedidos disponibles por el momento</h3>
                  <p style={{ fontSize: "14px" }}>Los nuevos pedidos listos de los restaurantes aparecerán aquí en tiempo real.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                  {availableOrders.map((order) => (
                    <div key={order.id} style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border-light)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "15px" }}>
                        <div>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Pedido</span>
                          <h3 style={{ fontSize: "18px", color: "var(--text-primary)" }}>#{order.id} - {order.restaurant.name}</h3>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>Ganancia Conductor</span>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--success)" }}>
                            +${order.shippingCost.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Map Toggle Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowMapForOrder(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: showMapForOrder[order.id] ? "rgba(46, 213, 115, 0.15)" : "var(--bg-tertiary)",
                            color: showMapForOrder[order.id] ? "#2ed573" : "var(--text-secondary)",
                            border: "1px solid var(--border-light)",
                            padding: "7px 16px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <span>{systemIconForEmoji("🗺️")} {showMapForOrder[order.id] ? "Ocultar Mapa" : "Ver Ruta en Mapa"}</span>
                        </button>
                      </div>

                      {/* Content Grid (Square Map if open + Details) */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: showMapForOrder[order.id] ? "repeat(auto-fit, minmax(320px, 1fr))" : "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "24px",
                        alignItems: "start"
                      }}>
                        {showMapForOrder[order.id] && (
                          <div style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
                            <RouteMap
                              orderId={order.id}
                              restaurantName={order.restaurant.name}
                              restaurantAddress={order.restaurant.address}
                              restaurantLat={order.restaurant.mapLatitude || -3.9965}
                              restaurantLng={order.restaurant.mapLongitude || -79.2030}
                              deliveryAddress={order.deliveryAddress}
                              customerName={order.customerName}
                              deliveryLat={order.deliveryLat || -3.99313}
                              deliveryLng={order.deliveryLng || -79.20422}
                              driverName={user?.name}
                              status={order.status}
                              height="360px"
                            />
                          </div>
                        )}

                        <div>
                          <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>Puntos de Ruta</h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                              <MapPin size={16} color="var(--accent-secondary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                              <div>
                                <strong style={{ fontSize: "12px", color: "var(--text-muted)" }}>Origen (Restaurante):</strong>
                                <div style={{ fontSize: "14px" }}>{order.restaurant.address || "Dirección no registrada"}</div>
                                {order.restaurant.phone && (
                                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tlf: {order.restaurant.phone}</div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                              <MapPin size={16} color="var(--accent-primary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                              <div>
                                <strong style={{ fontSize: "12px", color: "var(--text-muted)" }}>Destino (Cliente):</strong>
                                <div style={{ fontSize: "14px" }}>{order.deliveryAddress}</div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{order.customerName} - {order.deliveryPhone}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>Detalle del Cobro</h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Total de Productos (Ya cobrado):</span>
                              <span>${order.total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Costo de Envío:</span>
                              <span style={{ color: "var(--success)", fontWeight: "bold" }}>${order.shippingCost.toFixed(2)}</span>
                            </div>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontWeight: "bold",
                              borderTop: "1px dashed var(--border-light)",
                              paddingTop: "6px",
                              color: "var(--text-primary)",
                              marginTop: "4px"
                            }}>
                              <span>Comisión a Descontar:</span>
                              <span style={{ color: "var(--accent-primary)" }}>-${commissionCost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid var(--border-light)",
                        paddingTop: "15px",
                        flexWrap: "wrap",
                        gap: "10px"
                      }}>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {order.comments && <span><strong>Obs:</strong> {order.comments}</span>}
                        </div>
                        <button
                          onClick={() => handleTakeOrder(order.id, commissionCost)}
                          disabled={actionLoading === order.id || walletBalance < commissionCost}
                          style={{
                            padding: "10px 24px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: walletBalance >= commissionCost ? "var(--text-primary)" : "var(--border-light)",
                            color: walletBalance >= commissionCost ? "var(--bg-primary)" : "var(--text-muted)",
                            border: "none",
                            fontWeight: "bold",
                            cursor: walletBalance >= commissionCost ? "pointer" : "not-allowed",
                            transition: "all var(--transition-fast)"
                          }}
                        >
                          {actionLoading === order.id ? "Aceptando..." : walletBalance < commissionCost ? "Saldo Insuficiente en Wallet" : "Aceptar y Descontar Comisión"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Active Deliveries */}
          {activeTab === "active" && (
            <div>
              {activeOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary)" }}>
                  <Truck size={48} style={{ color: "var(--text-muted)", marginBottom: "15px" }} />
                  <h3>No tienes pedidos activos en entrega</h3>
                  <p style={{ fontSize: "14px" }}>Acepta pedidos desde la pestaña "Pedidos Disponibles" para iniciar.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                  {activeOrders.map((order) => (
                    <div key={order.id} style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border-light)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "15px" }}>
                        <div>
                          <span style={{
                            fontSize: "11px",
                            backgroundColor: "rgba(52, 152, 219, 0.1)",
                            color: "#3498db",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                            marginRight: "10px"
                          }}>
                            EN RUTA
                          </span>
                          <h3 style={{ fontSize: "18px", color: "var(--text-primary)", display: "inline-block" }}>
                            #{order.id} - {order.restaurant.name}
                          </h3>
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--success)" }}>
                          Envío: +${order.shippingCost.toFixed(2)}
                        </div>
                      </div>

                      {/* 2-Column Responsive Grid (Square Map + Details) */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                        gap: "24px",
                        alignItems: "start"
                      }}>
                        {/* Column 1: Square Map */}
                        <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
                          <RouteMap
                            orderId={order.id}
                            restaurantName={order.restaurant.name}
                            restaurantAddress={order.restaurant.address}
                            restaurantLat={order.restaurant.mapLatitude || -3.9965}
                            restaurantLng={order.restaurant.mapLongitude || -79.2030}
                            deliveryAddress={order.deliveryAddress}
                            customerName={order.customerName}
                            deliveryLat={order.deliveryLat || -3.99313}
                            deliveryLng={order.deliveryLng || -79.20422}
                            driverLat={order.driverLat}
                            driverLng={order.driverLng}
                            driverName={user?.name}
                            status={order.status}
                            isDriverView={true}
                            onDriverLocationUpdate={(lat, lng) => handleDriverLocationUpdate(order.id, lat, lng)}
                            height="380px"
                          />
                        </div>

                        {/* Column 2: Details & Financials */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                          <div>
                            <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>Direcciones de Entrega</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <MapPin size={16} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                                <div>
                                  <strong style={{ fontSize: "12px", color: "var(--text-muted)" }}>Retiro en local:</strong>
                                  <div style={{ fontSize: "14px" }}>{order.restaurant.address}</div>
                                  {order.restaurant.phone && (
                                    <a href={`tel:${order.restaurant.phone}`} style={{ fontSize: "13px", color: "var(--accent-secondary)", textDecoration: "underline", display: "inline-block", marginTop: "3px" }}>
                                      Llamar local: {order.restaurant.phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <MapPin size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                                <div>
                                  <strong style={{ fontSize: "12px", color: "var(--text-muted)" }}>Entrega final:</strong>
                                  <div style={{ fontSize: "14px" }}>{order.deliveryAddress}</div>
                                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>{order.customerName}</div>
                                  <a href={`tel:${order.deliveryPhone}`} style={{ fontSize: "13px", color: "var(--accent-primary)", textDecoration: "underline", display: "inline-block", marginTop: "3px" }}>
                                    Llamar cliente: {order.deliveryPhone}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>Productos del Pedido</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                              {order.items.map((it) => (
                                <div key={it.id} style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>{systemIconForEmoji("🛒")} {it.quantity}x {it.variant.menuItem.name} ({it.variant.name})</span>
                                  <span>${(it.price * it.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                            {/* Panel estilo Zaymi */}
                            {order.financialBreakdown && (
                              <div style={{
                                marginTop: "14px",
                                padding: "14px",
                                backgroundColor: "rgba(0, 0, 0, 0.35)",
                                border: "1px solid var(--border-light)",
                                borderRadius: "var(--radius-md)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#3498db" }}>{systemIconForEmoji("💵")} Pagar proveedor:</span>
                                  <span style={{ fontSize: "16px", fontWeight: "bold", color: "#3498db" }}>
                                    ${order.financialBreakdown.providerPayAmount.toFixed(2)}
                                  </span>
                                </div>
                                <p style={{ fontSize: "11px", color: "#8ab4f8", margin: 0, lineHeight: 1.3 }}>
                                  El valor original es ${order.financialBreakdown.foodSubtotal.toFixed(2)} pero se le resta ${order.financialBreakdown.appCommissionFromProvider.toFixed(2)} por comisión ({order.financialBreakdown.commissionPct}%) aceptada por el proveedor.
                                </p>

                                <div style={{ fontSize: "11px", color: "#e8eaed", marginTop: "4px" }}>
                                  {systemIconForEmoji("🎁")} GoEats le pagará <strong>${order.financialBreakdown.driverBonus.toFixed(2)} extras</strong> por este pedido. Recuerde siempre cobrar al cliente lo que marca.
                                </div>

                                <div style={{
                                  borderTop: "1px dashed var(--border-light)",
                                  paddingTop: "6px",
                                  marginTop: "4px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  color: "var(--text-primary)"
                                }}>
                                  <span>El total que ganará por esta orden:</span>
                                  <span style={{ color: "var(--success)" }}>${order.financialBreakdown.driverEarnings.toFixed(2)}</span>
                                </div>

                                <div style={{
                                  backgroundColor: "rgba(46, 204, 113, 0.1)",
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginTop: "4px"
                                }}>
                                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "var(--success)" }}>{systemIconForEmoji("🧾")} Cobrar cliente:</span>
                                  <span style={{ fontSize: "17px", fontWeight: "bold", color: "var(--success)" }}>
                                    ${order.financialBreakdown.customerTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {order.deliveryObservation && (
                              <div style={{
                                marginTop: "12px",
                                padding: "10px",
                                backgroundColor: "rgba(241, 196, 15, 0.05)",
                                border: "1px solid rgba(241, 196, 15, 0.2)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                color: "var(--text-primary)"
                              }}>
                                <strong>Observación guardada:</strong> {order.deliveryObservation}
                              </div>
                            )}
                          </div>
                        </div>

                      {/* Observations form / completion */}
                      <div style={{
                        borderTop: "1px solid var(--border-light)",
                        paddingTop: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "15px"
                      }}>
                        {showObsInput[order.id] ? (
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Escribe la novedad o novedad del envío..."
                              value={observationText[order.id] || ""}
                              onChange={(e) => setObservationText(prev => ({ ...prev, [order.id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleAddObservation(order.id)}
                              className="glow-btn"
                              style={{ padding: "10px 20px" }}
                              disabled={actionLoading === order.id}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setShowObsInput(prev => ({ ...prev, [order.id]: false }))}
                              className="secondary-btn"
                              style={{ padding: "10px" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                onClick={() => setShowObsInput(prev => ({ ...prev, [order.id]: true }))}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--text-secondary)",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <FileText size={14} />
                                Añadir Observación
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSupportOrderId(order.id);
                                  setIsSupportOpen(true);
                                }}
                                style={{
                                  background: "rgba(239, 68, 68, 0.08)",
                                  border: "1px solid rgba(239, 68, 68, 0.25)",
                                  borderRadius: "6px",
                                  padding: "6px 12px",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                                title="Reportar retraso en cocina, cliente no responde o avería"
                              >
                                <HelpCircle size={14} />
                                Incidencia en Ruta
                              </button>
                            </div>
                            <button
                              onClick={() => handleCompleteOrder(order.id, order.requiresPin)}
                              disabled={actionLoading === order.id}
                              style={{
                                backgroundColor: "var(--success)",
                                color: "white",
                                border: "none",
                                padding: "12px 24px",
                                borderRadius: "var(--radius-md)",
                                fontWeight: "bold",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all var(--transition-fast)"
                              }}
                            >
                              <CheckCircle size={16} />
                              {order.requiresPin ? systemTextWithIcons("🔒 Completar con PIN del Cliente") : "Completar y Entregar Pedido"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Wallet */}
          {activeTab === "wallet" && (
            <div className="mobile-column-stack" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px", alignItems: "start", flexWrap: "wrap" }}>
              {/* Wallet Info Card */}
              <div style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                padding: "24px",
                textAlign: "center"
              }}>
                <Wallet size={40} style={{ color: walletBalance >= 0 ? "var(--success)" : "var(--accent-primary)", marginBottom: "15px" }} />
                <h3 style={{ fontSize: "16px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  {walletBalance >= 0 ? "Saldo a Favor" : "Balance de Deuda (Comisiones)"}
                </h3>
                <div style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  margin: "10px 0",
                  color: walletBalance >= 0 ? "var(--success)" : "#ff4757"
                }}>
                  {walletBalance < 0 ? `-$${Math.abs(walletBalance).toFixed(2)}` : `$${walletBalance.toFixed(2)}`}
                </div>

                <div style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  backgroundColor: isDebtLocked ? "rgba(231, 76, 60, 0.15)" : "rgba(46, 204, 113, 0.15)",
                  color: isDebtLocked ? "#e74c3c" : "#2ecc71",
                  marginBottom: "15px"
                }}>
                  {isDebtLocked ? systemTextWithIcons("⚠️ CUENTA PAUSADA POR DEUDA") : "✓ ESTADO ACTIVO"}
                </div>

                <div style={{
                  padding: "15px",
                  backgroundColor: isDebtLocked ? "rgba(255, 71, 87, 0.08)" : "rgba(52, 152, 219, 0.06)",
                  border: isDebtLocked ? "1px solid rgba(255, 71, 87, 0.3)" : "1px solid rgba(52, 152, 219, 0.2)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  display: "flex",
                  gap: "10px",
                  textAlign: "left"
                }}>
                  <AlertTriangle size={20} color={isDebtLocked ? "#ff4757" : "#3498db"} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Límite de Deuda Máxima:</strong> Tienes permitido acumular hasta <strong>-${maxDebtLimit.toFixed(2)}</strong> de comisión retenida de pedidos en efectivo.
                    {isDebtLocked && (
                      <div style={{ color: "#ff4757", marginTop: "6px", fontWeight: "bold" }}>
                        Has alcanzado el límite. No podrás aceptar pedidos en efectivo hasta realizar un abono a GoEats.
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "20px", fontSize: "12px", color: "var(--text-muted)" }}>
                  Los pedidos pagados en línea (tarjeta) acreditan saldo a tu favor y descuentan automáticamente tu deuda.
                </div>
              </div>

              {/* Transactions List */}
              <div style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                padding: "24px"
              }}>
                <h3 style={{ fontSize: "18px", marginBottom: "20px", color: "var(--text-primary)" }}>Historial de Transacciones</h3>
                
                {transactions.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>
                    No hay movimientos registrados en tu billetera.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
                    {transactions.map((tx) => (
                      <div key={tx.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        backgroundColor: "var(--bg-primary)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-light)"
                      }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "bold" }}>{tx.description}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(tx.createdAt).toLocaleString("es-EC")} - Tipo: {tx.type}
                          </div>
                        </div>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: tx.amount > 0 ? "var(--success)" : "var(--accent-primary)"
                        }}>
                          {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Planes de Recarga */}
          {activeTab === "saas_plans" && (
            <div className="mobile-column-stack animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "30px", alignItems: "start" }}>
              {/* Plans list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ fontSize: "18px", color: "var(--text-primary)", margin: 0 }}>Tarjetas de Recarga de Saldo</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
                  Adquiere saldo virtual al instante pagando con tu tarjeta de crédito/débito o subiendo el comprobante de tu transferencia bancaria.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                  {plans.filter(p => p.type === "RECHARGE").map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedCard(card)}
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        border: `2px solid ${selectedCard?.amount === card.amount ? "var(--accent-secondary)" : "var(--border-light)"}`,
                        borderRadius: "var(--radius-lg)",
                        padding: "20px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "15px" }}>{card.name}</div>
                      <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--success)" }}>
                        ${card.amount.toFixed(2)}
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Form */}
              <div className="glass-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>Confirmar Compra</h3>
                {selectedCard ? (
                  <form onSubmit={handleBuyRecharge}>
                    <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "var(--bg-primary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>PLAN SELECCIONADO:</div>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{selectedCard.name}</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--success)" }}>${selectedCard.amount.toFixed(2)}</div>
                    </div>

                    <div className="input-group">
                      <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", display: "block" }}>Método de Pago</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                        <button
                          type="button"
                          className={rechargeMethod === "CARD" ? "glow-btn" : "secondary-btn"}
                          onClick={() => {
                            setRechargeMethod("CARD");
                            setPaymentReceipt("");
                            setPayphoneTransactionId("");
                          }}
                          style={{ padding: "8px", fontSize: "0.85rem" }}
                        >
                          {systemIconForEmoji("💳")} Tarjeta
                        </button>
                        <button
                          type="button"
                          className={rechargeMethod === "TRANSFER" ? "glow-btn" : "secondary-btn"}
                          onClick={() => {
                            setRechargeMethod("TRANSFER");
                            setPayphoneTransactionId("");
                          }}
                          style={{ padding: "8px", fontSize: "0.85rem" }}
                        >
                          {systemIconForEmoji("🏦")} Transferencia
                        </button>
                      </div>
                    </div>

                    {/* Payphone CARD flow */}
                    {rechargeMethod === "CARD" && (
                      <div style={{ marginBottom: "20px" }}>
                        {payphoneTransactionId ? (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "rgba(46, 213, 115, 0.05)",
                            border: "1px solid var(--success)",
                            padding: "10px",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--success)",
                            fontSize: "0.85rem"
                          }}>
                            <CheckCircle size={16} />
                            <div>
                              <div style={{ fontWeight: "bold" }}>Pago Exitoso</div>
                              <div style={{ fontSize: "11px" }}>Transacción: {payphoneTransactionId}</div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="glow-btn"
                            onClick={() => setShowPayphoneSimulator(true)}
                            style={{ width: "100%", padding: "10px", backgroundColor: "#ff5a00", borderColor: "#ff5a00" }}
                          >
                            Pagar con Tarjeta (Payphone)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Transfer flow */}
                    {rechargeMethod === "TRANSFER" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                        <div style={{
                          fontSize: "11px",
                          backgroundColor: "var(--bg-primary)",
                          padding: "10px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-light)",
                          lineHeight: "1.4"
                        }}>
                          <strong>Cuentas de la Plataforma GoEats:</strong>
                          <div>Banco Pichincha - Cta Ahorros</div>
                          <div>Número: 2201938482</div>
                          <div>Titular: GoEats SaaS Inc.</div>
                          <div>RUC: 1792839485001</div>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: "11px", fontWeight: "600" }}>Subir Foto del Comprobante</label>
                          <input
                            type="file"
                            accept="image/*"
                            required
                            className="input-field"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setPaymentReceipt(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ padding: "4px", fontSize: "0.85rem" }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="glow-btn"
                      style={{ width: "100%", padding: "12px" }}
                      disabled={submittingRecharge || (rechargeMethod === "CARD" && !payphoneTransactionId) || (rechargeMethod === "TRANSFER" && !paymentReceipt)}
                    >
                      {submittingRecharge ? "Procesando..." : "Confirmar Compra"}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, textAlign: "center", padding: "20px 0" }}>
                    Selecciona una tarjeta de recarga para iniciar.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payphone Simulator Modal */}
      {showPayphoneSimulator && selectedCard && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "380px", padding: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#ff5a00", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>P</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, color: "#ff5a00" }}>Pasarela Payphone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayphoneSimulator(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Estás realizando un pago de recarga por <strong>${selectedCard.amount.toFixed(2)}</strong> a favor de GoEats SaaS.
              </div>

              <div className="input-group">
                <label style={{ fontSize: "11px" }}>Número de Tarjeta</label>
                <input type="text" className="input-field" placeholder="4111 1111 1111 1111" defaultValue="4111 1111 1111 1111" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="input-group">
                  <label style={{ fontSize: "11px" }}>Fecha Vencimiento</label>
                  <input type="text" className="input-field" placeholder="12/28" defaultValue="12/28" />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: "11px" }}>CVV</label>
                  <input type="password" className="input-field" placeholder="123" defaultValue="123" />
                </div>
              </div>

              <button
                type="button"
                className="glow-btn"
                onClick={() => {
                  const simulatedId = `PAY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
                  setPayphoneTransactionId(simulatedId);
                  setShowPayphoneSimulator(false);
                }}
                style={{ width: "100%", padding: "12px", backgroundColor: "#ff5a00", borderColor: "#ff5a00", marginTop: "10px" }}
              >
                Confirmar Pago de Recarga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Help Center Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => {
          setIsSupportOpen(false);
          setSupportOrderId(undefined);
        }}
        defaultRole="MOTORIZADO"
        orderId={supportOrderId}
      />
    </div>
  );
};
