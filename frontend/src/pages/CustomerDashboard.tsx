import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ShoppingBag, 
  TrendingUp, 
  Check, 
  RefreshCw, 
  Clock, 
  Award, 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  X,
  CheckCircle,
  Sparkles,
  User as UserIcon,
  HelpCircle
} from "lucide-react";
import { RouteMap } from "../components/RouteMap";
import { FoodPreferencesModal } from "../components/FoodPreferencesModal";
import { CustomerProfileView } from "../components/CustomerProfileView";
import { SupportModal } from "../components/SupportModal";
import { useSocket } from "../context/SocketContext";
import { systemIconForEmoji } from "../utils/systemIcons";


interface OrderItem {
  id: number;
  variantId: number;
  quantity: number;
  price: number;
  comments: string | null;
  variant: {
    id: number;
    name: string;
    menuItem: {
      id: number;
      name: string;
    };
  };
}

interface RestaurantInfo {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
}

interface Order {
  id: number;
  type: "DELIVERY" | "TAKEOUT" | "DINE_IN";
  status: "PENDING" | "PREPARING" | "READY" | "DELIVERING" | "DELIVERED" | "CANCELLED";
  total: number;
  shippingCost: number;
  deliveryAddress: string | null;
  deliveryPhone: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  driverLat?: number | null;
  driverLng?: number | null;
  deliveryDriver: {
    id: number;
    name: string;
    role: string;
  } | null;
  createdAt: string;
  restaurant: RestaurantInfo;
  items: OrderItem[];
  tableId?: number | null;
  table?: { id: number; number: string; } | null;
  paymentMethod?: "CASH" | "CARD" | "TRANSFER";
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  favoriteRestaurant: string;
}

interface CustomerDashboardProps {
  defaultTab?: "orders" | "profile";
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ defaultTab = "orders" }) => {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab") as "orders" | "profile" | null;
  const [activeTab, setActiveTab] = useState<"orders" | "profile">(
    tabFromUrl === "profile" || tabFromUrl === "orders" ? tabFromUrl : defaultTab
  );

  useEffect(() => {
    if (tabFromUrl && (tabFromUrl === "orders" || tabFromUrl === "profile")) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: "orders" | "profile") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteRestaurant: "Ninguno",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plusLoading, setPlusLoading] = useState(false);

  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportOrder, setSupportOrder] = useState<Order | null>(null);

  // SaaS Subscription States
  const [plans, setPlans] = useState<any[]>([]);
  const [saasOrders, setSaasOrders] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "TRANSFER">("CARD");
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");
  const [payphoneTransactionId, setPayphoneTransactionId] = useState<string>("");
  const [showPayphoneSimulator, setShowPayphoneSimulator] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Refresh user profile details to sync isPlus status
      try {
        const profileRes = await apiRequest("/auth/profile");
        if (profileRes.success && profileRes.user && user) {
          login(token!, {
            ...user,
            isPlus: profileRes.user.isPlus
          } as any);
        }
      } catch (profileErr) {
        console.error("Error updating profile from API:", profileErr);
      }

      // Fetch stats
      const statsRes = await apiRequest("/orders/customer/stats");
      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      // Fetch orders
      const ordersRes = await apiRequest("/orders/customer/my-orders");
      if (ordersRes.success) {
        setOrders(ordersRes.orders || []);
      }

      // Fetch SaaS plans
      try {
        const plansRes = await apiRequest("/saas/plans");
        if (plansRes.success) {
          setPlans(plansRes.plans || []);
        }
      } catch (plansErr) {
        console.error("Error fetching SaaS plans:", plansErr);
      }

      // Fetch SaaS orders
      try {
        const saasRes = await apiRequest("/saas/my");
        if (saasRes.success) {
          setSaasOrders(saasRes.orders || []);
        }
      } catch (saasErr) {
        console.error("Error fetching SaaS orders:", saasErr);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la información del perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  // Poll active orders every 8 seconds to update status in tracking modal (fallback)
  useEffect(() => {
    const activeOrders = orders.some(o => 
      o.status !== "DELIVERED" && o.status !== "CANCELLED"
    );

    if (!activeOrders) return;

    const interval = setInterval(async () => {
      try {
        const ordersRes = await apiRequest("/orders/customer/my-orders");
        if (ordersRes.success) {
          const freshOrders: Order[] = ordersRes.orders || [];
          setOrders(freshOrders);
          
          // Update currently tracking order details if modal is open
          if (trackingOrder) {
            const updated = freshOrders.find(o => o.id === trackingOrder.id);
            if (updated) {
              setTrackingOrder(updated);
            }
          }
        }
      } catch (err) {
        console.error("Error polling order updates:", err);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [orders, trackingOrder]);

  // Real-time WebSocket listener for live driver GPS location and order updates
  useEffect(() => {
    if (!socket || !isModalOpen || !trackingOrder?.id) return;

    // Join the order room
    socket.emit("join-order", trackingOrder.id);

    const handleLocationUpdate = (data: { orderId: number; driverLat: number; driverLng: number }) => {
      if (data.orderId === trackingOrder.id) {
        setTrackingOrder((prev) =>
          prev && prev.id === data.orderId
            ? { ...prev, driverLat: data.driverLat, driverLng: data.driverLng }
            : prev
        );
        setOrders((prev) =>
          prev.map((o) =>
            o.id === data.orderId
              ? { ...o, driverLat: data.driverLat, driverLng: data.driverLng }
              : o
          )
        );
      }
    };

    const handleStatusUpdate = (data: any) => {
      const orderId = data?.orderId || data?.order?.id || data?.id;
      if (orderId === trackingOrder.id) {
        apiRequest("/orders/customer/my-orders").then((res) => {
          if (res.success && res.orders) {
            setOrders(res.orders);
            const fresh = res.orders.find((o: Order) => o.id === trackingOrder.id);
            if (fresh) setTrackingOrder(fresh);
          }
        });
      }
    };

    socket.on(`order-${trackingOrder.id}-location`, handleLocationUpdate);
    socket.on("driver-location-updated", handleLocationUpdate);
    socket.on("order-status-updated", handleStatusUpdate);

    return () => {
      socket.off(`order-${trackingOrder.id}-location`, handleLocationUpdate);
      socket.off("driver-location-updated", handleLocationUpdate);
      socket.off("order-status-updated", handleStatusUpdate);
    };
  }, [socket, isModalOpen, trackingOrder?.id]);

  useEffect(() => {
    if (isModalOpen || showPayphoneSimulator) {
      document.body.style.overflow = "hidden";
      // Lock viewport scrolling
      const viewports = document.querySelectorAll("div");
      viewports.forEach(v => {
        if (v.style.overflowY === "auto") {
          v.style.overflowY = "hidden";
        }
      });
    } else {
      document.body.style.overflow = "";
      // Unlock viewport scrolling
      const viewports = document.querySelectorAll("div");
      viewports.forEach(v => {
        if (v.style.overflowY === "hidden") {
          v.style.overflowY = "auto";
        }
      });
    }
    return () => {
      document.body.style.overflow = "";
      const viewports = document.querySelectorAll("div");
      viewports.forEach(v => {
        if (v.style.overflowY === "hidden") {
          v.style.overflowY = "auto";
        }
      });
    };
  }, [isModalOpen, showPayphoneSimulator]);

  const handleTogglePlus = async () => {
    try {
      setPlusLoading(true);
      const res = await apiRequest("/orders/customer/toggle-plus", {
        method: "POST",
      });

      if (res.success && user) {
        // Update global auth context
        login(token!, {
          ...user,
          isPlus: res.isPlus,
        } as any);
        
        // Reload dashboard stats/details
        loadCustomerData();
      }
    } catch (err: any) {
      alert(err.message || "Error al modificar suscripción");
    } finally {
      setPlusLoading(false);
    }
  };

  const handleBuySubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (paymentMethod === "CARD" && !payphoneTransactionId) {
      alert("Por favor realiza el pago con tarjeta a través del simulador.");
      return;
    }

    if (paymentMethod === "TRANSFER" && !paymentReceipt) {
      alert("Por favor sube la foto del comprobante de transferencia.");
      return;
    }

    try {
      setSubmittingSub(true);
      const res = await apiRequest("/saas/purchase", {
        method: "POST",
        body: JSON.stringify({
          type: "PLUS_SUBSCRIPTION",
          planName: selectedPlan.name,
          amount: selectedPlan.amount,
          paymentMethod,
          paymentReceipt: paymentMethod === "TRANSFER" ? paymentReceipt : null,
          payphoneTransactionId: paymentMethod === "CARD" ? payphoneTransactionId : null,
        }),
      });

      if (res.success) {
        if (paymentMethod === "CARD") {
          alert("¡Suscripción Plus activada con éxito! Ahora disfrutas de envíos gratis ilimitados.");
          if (user) {
            login(token!, {
              ...user,
              isPlus: true,
            } as any);
          }
        } else {
          alert("¡Tu comprobante ha sido enviado! Tu membresía Plus se activará tan pronto como el administrador apruebe tu transferencia.");
        }
        
        // Reset states
        setSelectedPlan(null);
        setPaymentReceipt("");
        setPayphoneTransactionId("");
        
        loadCustomerData();
      }
    } catch (err: any) {
      alert(err.message || "Error al adquirir membresía");
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleOrderAgain = (order: Order) => {
    try {
      // Map items back to catalog cart structure
      const cartItems = order.items.map(item => ({
        variantId: item.variantId,
        name: item.variant.name,
        itemName: item.variant.menuItem.name,
        price: item.price,
        quantity: item.quantity,
        comments: item.comments || "",
      }));

      // Store in localStorage for the specific restaurant slug
      localStorage.setItem(`goeats_cart_${order.restaurant.slug}`, JSON.stringify(cartItems));

      // Redirect client to that restaurant's catalog
      navigate(`/r/${order.restaurant.slug}`);
    } catch (err) {
      console.error(err);
      alert("Error al cargar los platos en tu carrito.");
    }
  };

  const openTrackingModal = (order: Order) => {
    setTrackingOrder(order);
    setIsModalOpen(true);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Pendiente";
      case "PREPARING": return "Preparando";
      case "READY": return "Listo";
      case "DELIVERING": return "En Camino";
      case "DELIVERED": return "Entregado";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return { bg: "#fffbeb", text: "#d97706", border: "#fef3c7" };
      case "PREPARING": return { bg: "#eff6ff", text: "#2563eb", border: "#dbeafe" };
      case "READY": return { bg: "#fdf2f8", text: "#db2777", border: "#fce7f3" };
      case "DELIVERING": return { bg: "#faf5ff", text: "#7c3aed", border: "#f3e8ff" };
      case "DELIVERED": return { bg: "#f0fdf4", text: "#16a34a", border: "#dcfce7" };
      case "CANCELLED": return { bg: "#fef2f2", text: "#dc2626", border: "#fee2e2" };
      default: return { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb" };
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING": return 0;
      case "PREPARING": return 1;
      case "READY": return 2;
      case "DELIVERING": return 3;
      case "DELIVERED": return 4;
      default: return -1;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case "CASH": return "Efectivo/Contraentrega";
      case "CARD": return "Tarjeta de Crédito/Débito";
      case "TRANSFER": return "Transferencia Bancaria";
      default: return method || "No especificado";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Loader2 className="spinner" size={40} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "20px auto 40px auto", padding: "0 16px" }} className="customer-dashboard-container animate-fade-in">
      {/* Header / Back */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <Link to="/restaurants" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13.5px", fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft size={16} />
          Volver a Restaurantes
        </Link>
      </div>

      <div className="customer-dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
            Hola, {user?.name} {systemIconForEmoji("👋")}
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0 0", fontSize: "14px" }}>
            Administra tus pedidos, revisa estadísticas y gestiona tu Club GoEats Plus.
          </p>
        </div>

        <button
          onClick={() => setPreferencesModalOpen(true)}
          className="customer-dashboard-pref-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 18px",
            backgroundColor: "#ffffff",
            border: "1px solid rgba(255, 71, 87, 0.3)",
            borderRadius: "30px",
            color: "#ff4757",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(255, 71, 87, 0.08)",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap"
          }}
        >
          <Sparkles size={15} />
          Mis Preferencias Gastronómicas
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="customer-dashboard-tabs no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange("orders")}
          className="customer-tab-btn"
          style={{
            border: "none",
            backgroundColor: activeTab === "orders" ? "#ff4757" : "#f1f5f9",
            color: activeTab === "orders" ? "#ffffff" : "#475569",
            boxShadow: activeTab === "orders" ? "0 4px 12px rgba(255, 71, 87, 0.25)" : "none",
          }}
        >
          <ShoppingBag size={16} />
          <span>Mis Pedidos ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className="customer-tab-btn"
          style={{
            border: "none",
            backgroundColor: activeTab === "profile" ? "#ff4757" : "#f1f5f9",
            color: activeTab === "profile" ? "#ffffff" : "#475569",
            boxShadow: activeTab === "profile" ? "0 4px 12px rgba(255, 71, 87, 0.25)" : "none",
          }}
        >
          <UserIcon size={16} />
          <span>Mi Perfil</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSupportOrder(null);
            setIsSupportOpen(true);
          }}
          className="customer-tab-btn"
          style={{
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#2563eb",
          }}
        >
          <HelpCircle size={16} />
          <span>Centro de Ayuda</span>
        </button>
      </div>



      {activeTab === "profile" ? (
        <CustomerProfileView />
      ) : (
        <>
          {error && (
            <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626", borderRadius: "var(--radius-sm)", marginBottom: "20px", fontSize: "14px" }}>
              {error}
            </div>
          )}

          {/* Subscription Card GoEats Plus - Active */}
      {user?.isPlus ? (
        <div style={{
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          border: "2px solid #fbbf24",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          marginBottom: "30px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            backgroundColor: "#fbbf24",
            color: "#78350f",
            fontWeight: 800,
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "50px",
            letterSpacing: "0.5px"
          }}>
            MIEMBRO PLUS
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <div style={{
              backgroundColor: "#fef3c7",
              color: "#fbbf24",
              padding: "12px",
              borderRadius: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Award size={32} style={{ color: "#d97706" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                Club GoEats Plus {systemIconForEmoji("✨")}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 16px 0", maxWidth: "600px" }}>
                ¡Felicidades! Tu membresía está activa. Tienes envíos gratuitos ilimitados en todos tus pedidos delivery. Tus pedidos son priorizados y no cobran comisión al repartidor, lo que incentiva un servicio impecable.
              </p>
              <button
                onClick={handleTogglePlus}
                disabled={plusLoading}
                style={{
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "30px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  transition: "all 0.2s ease"
                }}
              >
                {plusLoading ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  "Cancelar Membresía Plus"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* If not plus, check for pending subscription */
        (() => {
          const pendingOrder = saasOrders.find(o => o.type === "PLUS_SUBSCRIPTION" && o.status === "PENDING");
          if (pendingOrder) {
            return (
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "1px dashed #64748b",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                marginBottom: "30px",
                display: "flex",
                gap: "16px",
                alignItems: "center"
              }}>
                <div style={{
                  backgroundColor: "#e2e8f0",
                  padding: "12px",
                  borderRadius: "50px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Clock size={32} style={{ color: "#475569" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                    Solicitud de Suscripción Pendiente {systemIconForEmoji("⏳")}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0", maxWidth: "700px" }}>
                    Has solicitado el <strong>{pendingOrder.planName}</strong> (${pendingOrder.amount.toFixed(2)}) utilizando pago por <strong>{pendingOrder.paymentMethod === "TRANSFER" ? "Transferencia Bancaria" : "Tarjeta"}</strong>.
                    El SuperAdministrador revisará tu comprobante a la brevedad para activar tus beneficios.
                  </p>
                </div>
              </div>
            );
          }

          // If no active or pending plus subscription, show plan checkout flow
          return (
            <div style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              marginBottom: "30px"
            }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" }}>
                <div style={{
                  backgroundColor: "rgba(251, 191, 36, 0.1)",
                  color: "#fbbf24",
                  padding: "12px",
                  borderRadius: "50px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Award size={32} style={{ color: "#d97706" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
                    Únete a Club GoEats Plus {systemIconForEmoji("✨")}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
                    Disfruta de envíos completamente gratis ($0.00 de envío) en todos los locales de la plataforma. Tus pedidos serán priorizados y los repartidores recibirán un bono adicional pagado por GoEats.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "25px", alignItems: "start" }} className="mobile-column-stack">
                {/* Plans pricing grid */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0" }}>Elige tu Plan:</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    {plans.filter(p => p.type === "PLUS_SUBSCRIPTION").map((plan, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPlan(plan)}
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          border: `2px solid ${selectedPlan?.name === plan.name ? "#fbbf24" : "var(--border-light)"}`,
                          borderRadius: "var(--radius-sm)",
                          padding: "16px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ fontWeight: "bold", fontSize: "13px" }}>{plan.name}</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "#d97706" }}>
                          ${plan.amount.toFixed(2)}
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{plan.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Checkout Box */}
                <div style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  padding: "20px"
                }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px 0" }}>Confirmar Suscripción</h4>
                  {selectedPlan ? (
                    <form onSubmit={handleBuySubscription}>
                      <div style={{ marginBottom: "12px", padding: "8px 12px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px", border: "1px solid var(--border-light)" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "bold" }}>PLAN:</div>
                        <div style={{ fontWeight: "bold", fontSize: "13px" }}>{selectedPlan.name}</div>
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#d97706" }}>${selectedPlan.amount.toFixed(2)}</div>
                      </div>

                      {/* Payment Method Selector */}
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Forma de Pago</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod("CARD");
                              setPaymentReceipt("");
                              setPayphoneTransactionId("");
                            }}
                            style={{
                              padding: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderRadius: "4px",
                              border: paymentMethod === "CARD" ? "1px solid #fbbf24" : "1px solid var(--border-light)",
                              backgroundColor: paymentMethod === "CARD" ? "rgba(251, 191, 36, 0.08)" : "var(--bg-primary)",
                              fontWeight: paymentMethod === "CARD" ? "bold" : "normal"
                            }}
                          >
                            {systemIconForEmoji("💳")} Tarjeta
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod("TRANSFER");
                              setPayphoneTransactionId("");
                            }}
                            style={{
                              padding: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              borderRadius: "4px",
                              border: paymentMethod === "TRANSFER" ? "1px solid #fbbf24" : "1px solid var(--border-light)",
                              backgroundColor: paymentMethod === "TRANSFER" ? "rgba(251, 191, 36, 0.08)" : "var(--bg-primary)",
                              fontWeight: paymentMethod === "TRANSFER" ? "bold" : "normal"
                            }}
                          >
                            {systemIconForEmoji("🏦")} Transferencia
                          </button>
                        </div>
                      </div>

                      {/* Card flow */}
                      {paymentMethod === "CARD" && (
                        <div style={{ marginBottom: "16px" }}>
                          {payphoneTransactionId ? (
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: "rgba(46, 213, 115, 0.05)",
                              border: "1px solid var(--success)",
                              padding: "8px",
                              borderRadius: "4px",
                              color: "var(--success)",
                              fontSize: "11px"
                            }}>
                              <CheckCircle size={14} />
                              <div>
                                <div style={{ fontWeight: "bold" }}>Pago Aprobado</div>
                                <div style={{ fontSize: "10px" }}>ID: {payphoneTransactionId}</div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowPayphoneSimulator(true)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                backgroundColor: "#ff5a00",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                cursor: "pointer"
                              }}
                            >
                              Pagar con Tarjeta (Payphone)
                            </button>
                          )}
                        </div>
                      )}

                      {/* Transfer flow */}
                      {paymentMethod === "TRANSFER" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                          <div style={{
                            fontSize: "10px",
                            backgroundColor: "var(--bg-secondary)",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-light)",
                            lineHeight: "1.3"
                          }}>
                            <strong>Cuentas de GoEats:</strong>
                            <div>Banco Pichincha - Cta Ahorros</div>
                            <div>Número: 2201938482</div>
                            <div>Titular: GoEats SaaS Inc.</div>
                          </div>

                          <div>
                            <label style={{ fontSize: "10px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Foto Comprobante</label>
                            <input
                              type="file"
                              accept="image/*"
                              required
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
                              style={{ width: "100%", fontSize: "11px" }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingSub || (paymentMethod === "CARD" && !payphoneTransactionId) || (paymentMethod === "TRANSFER" && !paymentReceipt)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          backgroundColor: "#000000",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        {submittingSub ? "Procesando..." : "Confirmar Suscripción"}
                      </button>
                    </form>
                  ) : (
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0, textAlign: "center", padding: "15px 0" }}>
                      Selecciona un plan para iniciar tu checkout.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Stats Cards Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: "14px",
        marginBottom: "30px"
      }}>
        {/* Metric 1 */}
        <div style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-md)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            backgroundColor: "rgba(255, 71, 87, 0.05)",
            color: "var(--accent-primary)",
            padding: "12px",
            borderRadius: "var(--radius-md)"
          }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>PEDIDOS REALIZADOS</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{stats.totalOrders}</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-md)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            backgroundColor: "rgba(46, 204, 113, 0.05)",
            color: "var(--success)",
            padding: "12px",
            borderRadius: "var(--radius-md)"
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL GASTADO</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>${stats.totalSpent.toFixed(2)}</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-md)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            backgroundColor: "rgba(52, 152, 219, 0.05)",
            color: "#3498db",
            padding: "12px",
            borderRadius: "var(--radius-md)"
          }}>
            <Check size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>LOCAL PREFERIDO</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
              {stats.favoriteRestaurant}
            </div>
          </div>
        </div>
      </div>

      {/* Orders History Section */}
      <div style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-md)",
        padding: "24px"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 20px 0" }}>
          Mis Pedidos Recientes
        </h2>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
            <ShoppingBag size={48} style={{ margin: "0 auto 12px auto", opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Aún no has realizado ningún pedido.</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Navega en el agregador y realiza tu primera compra.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.map((order) => {
              const active = order.status !== "DELIVERED" && order.status !== "CANCELLED";
              const colors = getStatusColor(order.status);

              return (
                <div 
                  key={order.id} 
                  style={{
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    backgroundColor: "var(--bg-secondary)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                        {order.restaurant.name}
                      </h4>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {new Date(order.createdAt).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                    
                    <span style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "50px"
                    }}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", padding: "10px 0" }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span>
                          {item.quantity}x {item.variant.menuItem.name} {item.variant.name !== "Unidad" ? `(${item.variant.name})` : ""}
                        </span>
                        <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.shippingCost > 0 ? (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                        <span>Costo de envío</span>
                        <span>${order.shippingCost.toFixed(2)}</span>
                      </div>
                    ) : (
                      order.type === "DELIVERY" && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--success)", fontWeight: 600, marginTop: "6px" }}>
                          <span>Costo de envío</span>
                          <span>Gratis {systemIconForEmoji("✨")}</span>
                        </div>
                      )
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800 }}>
                      Total: <span style={{ color: "var(--accent-primary)" }}>${order.total.toFixed(2)}</span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {active ? (
                        <button
                          onClick={() => openTrackingModal(order)}
                          style={{
                            backgroundColor: "var(--accent-primary)",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <MapPin size={13} />
                          Seguimiento {systemIconForEmoji("📍")}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOrderAgain(order)}
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.05)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-light)",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <RefreshCw size={12} />
                          Pedir de Nuevo {systemIconForEmoji("🔁")}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSupportOrder(order);
                          setIsSupportOpen(true);
                        }}
                        style={{
                          backgroundColor: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #cbd5e1",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        title="Reportar problema o solicitar asistencia con esta orden"
                      >
                        <HelpCircle size={13} color="#3b82f6" />
                        Ayuda
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {isModalOpen && trackingOrder && createPortal(
        <div className="global-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}>
          <div className="global-modal-card" style={{ maxWidth: "500px", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 10px 0" }}>
              Seguimiento del Pedido #{trackingOrder.id}
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 24px 0" }}>
              {trackingOrder.restaurant.name}
            </p>

            {/* Stepper Progress */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px 0" }}>
              {[
                { title: "Pedido Recibido", desc: "El local ha registrado tu compra.", icon: <Clock size={16} /> },
                { title: "En Cocina", desc: "Tus platos están siendo preparados.", icon: <Clock size={16} /> },
                { title: "Listo para Despacho", desc: "Pedido listo, esperando repartidor.", icon: <CheckCircle size={16} /> },
                { 
                  title: "En camino",
                  desc: trackingOrder.deliveryDriver 
                    ? `Tu motorizado: ${trackingOrder.deliveryDriver.name} va en camino.` 
                    : "El repartidor va rumbo a tu dirección.", 
                  icon: <MapPin size={16} /> 
                },
                { title: "Entregado", desc: "¡Buen provecho! Pedido entregado.", icon: <CheckCircle size={16} /> }
              ].map((step, idx) => {
                const currentStepIdx = getStepIndex(trackingOrder.status);
                const isCompleted = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;

                return (
                  <div key={idx} style={{ display: "flex", gap: "16px", position: "relative" }}>
                    {/* Line between steps */}
                    {idx < 4 && (
                      <div style={{
                        position: "absolute",
                        left: "15px",
                        top: "30px",
                        bottom: "-25px",
                        width: "2px",
                        backgroundColor: isCompleted ? "var(--success)" : "var(--border-light)"
                      }}></div>
                    )}

                    {/* Step bubble */}
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50px",
                      backgroundColor: isCompleted ? "var(--success)" : (isActive ? "var(--accent-primary)" : "var(--border-light)"),
                      color: isCompleted || isActive ? "#ffffff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      zIndex: 2
                    }}>
                      {isCompleted ? <Check size={14} /> : (idx + 1)}
                    </div>

                    {/* Text info */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        margin: 0,
                        color: isActive ? "var(--accent-primary)" : (isCompleted ? "var(--success)" : "var(--text-primary)")
                      }}>
                        {step.title}
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live GPS Route Map */}
            {trackingOrder.type === "DELIVERY" && (
              <div style={{ marginTop: "16px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", margin: 0 }}>
                    {systemIconForEmoji("🗺️")} Ruta y Ubicación en Tiempo Real
                  </label>
                  {trackingOrder.status === "DELIVERING" && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#2ed573",
                      background: "rgba(46, 213, 115, 0.12)",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      border: "1px solid rgba(46, 213, 115, 0.3)"
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2ed573", display: "inline-block" }}></span>
                      {trackingOrder.driverLat ? "Repartidor en camino (GPS Activo)" : "Repartidor asignado"}
                    </span>
                  )}
                </div>

                <RouteMap
                  orderId={trackingOrder.id}
                  restaurantName={trackingOrder.restaurant.name}
                  restaurantAddress={trackingOrder.restaurant.address}
                  restaurantLat={trackingOrder.restaurant.mapLatitude || -3.9965}
                  restaurantLng={trackingOrder.restaurant.mapLongitude || -79.2030}
                  restaurantLogo={trackingOrder.restaurant.logo}
                  deliveryAddress={trackingOrder.deliveryAddress || "Dirección de entrega"}
                  customerName={user?.name}
                  deliveryLat={trackingOrder.deliveryLat || -3.99313}
                  deliveryLng={trackingOrder.deliveryLng || -79.20422}
                  driverLat={trackingOrder.driverLat}
                  driverLng={trackingOrder.driverLng}
                  driverName={trackingOrder.deliveryDriver?.name}
                  status={trackingOrder.status}
                  height="340px"
                />
              </div>
            )}

            {/* General Info */}
            <div style={{
              backgroundColor: "var(--bg-tertiary)",
              borderRadius: "var(--radius-sm)",
              padding: "16px",
              marginTop: "16px",
              fontSize: "13px",
              lineHeight: 1.5
            }}>
              {trackingOrder.type === "DELIVERY" && (
                <>
                  <div><strong>Dirección de entrega:</strong> {trackingOrder.deliveryAddress}</div>
                  <div><strong>Teléfono:</strong> {trackingOrder.deliveryPhone}</div>
                </>
              )}
              {trackingOrder.type === "TAKEOUT" && (
                <div><strong>Instrucciones:</strong> Acércate al local para retirar tu pedido.</div>
              )}
              {trackingOrder.type === "DINE_IN" && (
                <div><strong>Consumo en Mesa:</strong> Mesa {trackingOrder.table?.number || trackingOrder.tableId}</div>
              )}
              <div style={{ marginTop: "8px", borderTop: "1px solid var(--border-light)", paddingTop: "8px" }}>
                <strong>Método de Pago:</strong> {getPaymentMethodLabel(trackingOrder.paymentMethod)}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                width: "100%",
                padding: "10px 0",
                backgroundColor: "var(--text-primary)",
                color: "var(--bg-primary)",
                border: "none",
                borderRadius: "4px",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "20px"
              }}
            >
              Cerrar Seguimiento
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Payphone Simulator Modal */}
      {showPayphoneSimulator && selectedPlan && createPortal(
        <div className="global-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowPayphoneSimulator(false);
        }}>
          <div className="global-modal-card" style={{ maxWidth: "380px", padding: "25px" }} onClick={(e) => e.stopPropagation()}>
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
                Estás realizando un pago de suscripción por <strong>${selectedPlan.amount.toFixed(2)}</strong> a favor de GoEats SaaS.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600 }}>Número de Tarjeta</label>
                <input type="text" style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} placeholder="4111 1111 1111 1111" defaultValue="4111 1111 1111 1111" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600 }}>Vencimiento</label>
                  <input type="text" style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} placeholder="12/28" defaultValue="12/28" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600 }}>CVV</label>
                  <input type="password" style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} placeholder="123" defaultValue="123" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const simulatedId = `PAY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
                  setPayphoneTransactionId(simulatedId);
                  setShowPayphoneSimulator(false);
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#ff5a00",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginTop: "10px"
                }}
              >
                Confirmar Pago de Suscripción
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
        </>
      )}

      {/* Culinary Preferences Modal */}
      <FoodPreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
      />

      {/* Support & Help Center Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => {
          setIsSupportOpen(false);
          setSupportOrder(null);
        }}
        defaultRole="CUSTOMER"
        orderId={supportOrder ? supportOrder.id : undefined}
        restaurantName={supportOrder ? supportOrder.restaurant.name : undefined}
      />
    </div>
  );
};
