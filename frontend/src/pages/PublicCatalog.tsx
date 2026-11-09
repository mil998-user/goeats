import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { ShoppingCart, Wifi, MapPin, Phone, Utensils, Check, Plus, Minus, AlertCircle, Clock, X, ArrowLeft, BellRing, Receipt, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { calculateShippingCost, getShippingDistanceKm } from "../utils/shipping";
import { LocationPickerMap } from "../components/LocationPickerMap";
import type { SavedAddress } from "../components/SavedAddresses";
import { SupportModal } from "../components/SupportModal";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";
import { getMapEmbedUrl } from "../utils/maps";
import { StarAverage } from "../components/Stars";
import { ReserveTable } from "../components/ReserveTable";

// Fixed tip choices for the driver; 0 means no tip
const TIP_CHOICES = [0, 0.5, 1, 2];


interface Variant {
  id: number;
  name: string;
  price: number;
  regularPrice?: number | null; // normal price while the dish is on promotion
  promoEndsAt?: string | null;
  stockLimit: number | null;
  options: string | null;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  variants: Variant[];
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface Table {
  id: number;
  number: string;
  status: string;
}

interface DiningArea {
  id: number;
  name: string;
  tables: Table[];
}

interface RestaurantDetails {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  qrOrderingEnabled: boolean;
  coverImage: string | null;
  description: string | null;
  mapLatitude: number | null;
  mapLongitude: number | null;
  mapIframe: string | null;
  reference: string | null;
  openingHours: string | null;
  faqsJson: string | null;
  ratingAverage?: number | null;
  ratingCount?: number;
  waiterCallEnabled?: boolean;
  reservationsEnabled?: boolean;
  payBeforeEating?: boolean;
}

interface CartItem {
  variantId: number;
  name: string;
  itemName: string;
  price: number;
  quantity: number;
  comments: string;
}

export const PublicCatalog: React.FC = () => {
  const { slug, tableId: urlTableId } = useParams();
  const [searchParams] = useSearchParams();
  const queryTableId = searchParams.get("tableId") || searchParams.get("table") || searchParams.get("mesa");
  const activeTableId = urlTableId || queryTableId; // Support both /qr/:slug/:tableId and query param
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout states
  const [orderType, setOrderType] = useState<"DINE_IN" | "DELIVERY" | "TAKEOUT">("DELIVERY");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(() => user?.deliveryAddress || "");
  const [deliveryReference, setDeliveryReference] = useState(() =>
    [user?.deliveryFloorApartment, user?.deliverySecondaryStreet, user?.deliveryReferences]
      .filter(Boolean)
      .join(", ")
  );
  const [deliveryPhone, setDeliveryPhone] = useState(() => user?.phone || "");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(() => user?.deliveryLatitude ?? null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(() => user?.deliveryLongitude ?? null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  // The cart survives going to the login page and back, only in this tab and for this restaurant
  const cartKey = `goeats_cart_${slug}`;
  // After logging in, come back to this restaurant instead of the general list
  const loginPath = `/login?returnTo=${encodeURIComponent(urlTableId ? `/r/${slug}/mesa/${urlTableId}` : `/r/${slug}`)}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(cartKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  // Logging out on this page also empties the cart shown on screen
  const wasAuthenticated = React.useRef(isAuthenticated);
  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) setCart([]);
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);
  useEffect(() => {
    try {
      if (cart.length) sessionStorage.setItem(cartKey, JSON.stringify(cart));
      else sessionStorage.removeItem(cartKey);
    } catch {
      // Storage can be blocked; the cart still works in memory
    }
  }, [cart, cartKey]);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);

  // PedidosYa Tracking & Dine-In Table Call states
  const { socket } = useSocket();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const activeOrderKey = `goeats_active_order_${slug}`;
  const rememberActiveOrder = (orderId: number | null) => {
    try {
      if (orderId) sessionStorage.setItem(activeOrderKey, String(orderId));
      else sessionStorage.removeItem(activeOrderKey);
    } catch {
      // Storage can be blocked; the order is still in "Mis pedidos"
    }
  };
  const [waiterCallStatus, setWaiterCallStatus] = useState<string | null>(null);
  const [waiterCallLoading, setWaiterCallLoading] = useState<boolean>(false);

  // Delivery estimation states
  const [deliveryRate, setDeliveryRate] = useState<any>(null);

  // Payment states for DELIVERY/TAKEOUT
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");
  const [payphoneTransactionId, setPayphoneTransactionId] = useState<string>("");
  const [showPayphoneSimulator, setShowPayphoneSimulator] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccId, setSelectedBankAccId] = useState<string>("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [reserveOpen, setReserveOpen] = useState(false);

  const isPlusUser = isAuthenticated && user?.isPlus === true;
  const shippingDistance = getShippingDistanceKm(restaurant?.mapLatitude, restaurant?.mapLongitude, deliveryLat, deliveryLng);
  const currentShippingCost = (orderType === "DELIVERY" && !isPlusUser && deliveryRate)
    ? calculateShippingCost(deliveryRate, shippingDistance)
    : 0;
  // The tip only applies to deliveries and is paid together with the order
  const currentTip = orderType === "DELIVERY" ? tipAmount : 0;

  // Only the restaurant's real accounts; without them, transfer is not offered
  const activeBankAccounts = bankAccounts;

  useEffect(() => {
    let parsed: any[] = [];
    try {
      parsed = JSON.parse((restaurant as any)?.bankAccountsJson || "[]") || [];
    } catch {
      parsed = [];
    }
    setBankAccounts(parsed);
    setSelectedBankAccId(parsed.length > 0 ? parsed[0].id.toString() : "");
    if (parsed.length === 0) setPaymentMethod((current) => (current === "TRANSFER" ? "CASH" : current));
  }, [restaurant]);


  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await apiRequest(`/restaurants/public/catalog/${slug}`, {
          params: activeTableId ? { tableId: activeTableId } : undefined,
        });
        setRestaurant(res.restaurant);
        setDeliveryRate(res.deliveryRate || null);
        setCategories(res.menuCategories || []);
        setDiningAreas(res.diningAreas || []);

        // A saved cart may be outdated: drop dishes no longer offered and show current prices
        const variants = new Map<number, Variant>(
          ((res.menuCategories || []) as Category[])
            .flatMap((c) => c.items)
            .flatMap((i) => i.variants)
            .map((v) => [v.id, v])
        );
        setCart((saved) =>
          saved
            .filter((line) => variants.has(line.variantId))
            .map((line) => ({ ...line, price: Number(variants.get(line.variantId)!.price) }))
        );

        // Auto-configure DINE_IN if table is provided via QR scan
        if (activeTableId) {
          setOrderType("DINE_IN");
          setSelectedTable(activeTableId);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el menú");
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [slug, activeTableId]);

  // Prefill customer name if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomerName(user.name);
      // Same as above: the stored session arrives after the first render
      setDeliveryPhone((current) => current || user.phone || "");
      setDeliveryAddress((current) => current || user.deliveryAddress || "");
      setDeliveryLat((current) => current ?? user.deliveryLatitude ?? null);
      setDeliveryLng((current) => current ?? user.deliveryLongitude ?? null);
    }
  }, [isAuthenticated, user]);

  // Saved addresses: the customer picks one instead of typing it again
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "CUSTOMER") return;
    apiRequest("/orders/customer/addresses")
      .then((res) => {
        const list: SavedAddress[] = res.addresses || [];
        setSavedAddresses(list);
        const main = list.find((a) => a.isDefault);
        if (!main) return;
        // The session loads after the first render, so the form may still be empty: fill it unless the customer already typed
        setSelectedAddressId(main.id);
        setDeliveryAddress((current) => current || main.address);
        setDeliveryLat((current) => current ?? main.latitude);
        setDeliveryLng((current) => current ?? main.longitude);
        setDeliveryReference(
          (current) => current || [main.floorApartment, main.secondaryStreet, main.references].filter(Boolean).join(", ")
        );
      })
      .catch(() => setSavedAddresses([]));
  }, [isAuthenticated, user?.role]);

  const chooseSavedAddress = (id: number) => {
    const chosen = savedAddresses.find((a) => a.id === id);
    if (!chosen) return;
    setSelectedAddressId(id);
    setDeliveryAddress(chosen.address);
    setDeliveryLat(chosen.latitude);
    setDeliveryLng(chosen.longitude);
    setDeliveryReference(
      [chosen.floorApartment, chosen.secondaryStreet, chosen.references].filter(Boolean).join(", ")
    );
  };

  // After a reload, bring back the order the customer just placed, with its PIN
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "CUSTOMER") return;
    let savedId: number | null = null;
    try {
      savedId = Number(sessionStorage.getItem(activeOrderKey)) || null;
    } catch {
      savedId = null;
    }
    if (!savedId) return;

    let cancelled = false;
    apiRequest("/orders/customer/my-orders")
      .then((res) => {
        if (cancelled) return;
        const saved = (res.orders || []).find((o: any) => o.id === savedId);
        if (saved && saved.status !== "DELIVERED" && saved.status !== "CANCELLED") {
          setActiveOrder(saved);
          setOrderSuccess(true);
        } else {
          rememberActiveOrder(null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.role, activeOrderKey]);

  // Listen for real-time order updates for the customer (PedidosYa Live Tracker)
  useEffect(() => {
    if (!socket || !activeOrder?.id) return;

    const joinOrder = () => socket.emit("join-order", activeOrder.id);
    joinOrder();
    socket.on("connect", joinOrder);

    const handleStatusUpdate = (data: any) => {
      if (activeOrder && Number(data.orderId) === Number(activeOrder.id)) {
        setActiveOrder((prev: any) => ({
          ...prev,
          status: data.status,
          deliveryDriverName: data.driverName || prev?.deliveryDriverName,
        }));
      }
    };

    socket.on("order-status-updated", handleStatusUpdate);
    return () => {
      socket.off("connect", joinOrder);
      socket.off("order-status-updated", handleStatusUpdate);
    };
  }, [socket, activeOrder?.id]);

  // Handle Calling Waiter or Requesting Bill from Table
  const handleCallWaiter = async (action: "CALL" | "BILL") => {
    if (!selectedTable) {
      alert("Por favor selecciona tu número de mesa primero.");
      return;
    }
    setWaiterCallLoading(true);
    try {
      await apiRequest(`/restaurants/public/catalog/${slug}/call-waiter`, {
        method: "POST",
        body: JSON.stringify({ tableId: selectedTable, action }),
      });
      setWaiterCallStatus(action === "BILL" ? "¡Cuenta solicitada a caja! Enseguida se acercan a cobrar." : "¡Mesero notificado! Enseguida se acerca a tu mesa.");
      setTimeout(() => setWaiterCallStatus(null), 8000);
    } catch (err: any) {
      // A repeated call answers with how long to wait; show it in the same banner
      setWaiterCallStatus(err.message || "No se pudo avisar. Intenta de nuevo.");
      setTimeout(() => setWaiterCallStatus(null), 8000);
    } finally {
      setWaiterCallLoading(false);
    }
  };

  const addToCart = (variant: Variant, item: MenuItem) => {
    const existingIndex = cart.findIndex((c) => c.variantId === variant.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          variantId: variant.id,
          name: variant.name,
          itemName: item.name,
          price: variant.price,
          quantity: 1,
          comments: "",
        },
      ]);
    }
  };

  const updateQuantity = (variantId: number, val: number) => {
    const existingIndex = cart.findIndex((c) => c.variantId === variantId);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += val;
      if (updated[existingIndex].quantity <= 0) {
        updated.splice(existingIndex, 1);
      }
      setCart(updated);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if ((orderType === "DELIVERY" || orderType === "TAKEOUT") && !isAuthenticated) {
      alert("Debes iniciar sesión para realizar pedidos.");
      navigate(loginPath);
      return;
    }

    if (!customerName) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    if (orderType === "DELIVERY" && (!deliveryAddress || !deliveryPhone)) {
      alert("Por favor ingresa dirección y teléfono para el envío");
      return;
    }

    if (orderType === "DINE_IN" && !selectedTable) {
      alert("Por favor selecciona una mesa");
      return;
    }

    if (orderType !== "DINE_IN") {
      if (paymentMethod === "TRANSFER" && !paymentReceipt) {
        alert("Por favor sube la foto de tu comprobante de transferencia.");
        return;
      }
      if (paymentMethod === "CARD" && !payphoneTransactionId) {
        alert("Por favor realiza el pago con tarjeta (Payphone) antes de confirmar el pedido.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        type: orderType,
        tableId: orderType === "DINE_IN" ? parseInt(selectedTable, 10) : null,
        customerName,
        // Distance, payment on delivery and the home reference only make sense for deliveries
        comments: orderType === "DINE_IN"
          ? "Pedido público web. En Mesa. Pago en caja."
          : `Pedido público web. ${orderType === "DELIVERY" ? "A Domicilio" : "Para Llevar"}.${orderType === "DELIVERY" ? ` Distancia: ${shippingDistance.toFixed(1)} km.` : ""} Pago: ${paymentMethod === "CASH" ? (orderType === "DELIVERY" ? "Efectivo/Contraentrega" : "Efectivo") : paymentMethod === "CARD" ? "Tarjeta" : "Transferencia"}${orderType === "DELIVERY" && deliveryReference ? ` • Referencia: ${deliveryReference}` : ""}`,
        deliveryAddress: orderType === "DELIVERY" 
          ? (deliveryReference ? `${deliveryAddress} (Ref: ${deliveryReference})` : deliveryAddress)
          : null,
        deliveryReference: orderType === "DELIVERY" ? deliveryReference : null,
        deliveryObservation: orderType === "DELIVERY" ? deliveryReference : null,
        deliveryPhone: orderType === "DELIVERY" ? deliveryPhone : null,
        deliveryLat: orderType === "DELIVERY" ? deliveryLat : null,
        deliveryLng: orderType === "DELIVERY" ? deliveryLng : null,
        items: cart.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          comments: i.comments,
        })),
        restaurantId: restaurant?.id,
        paymentMethod,
        paymentReceipt: paymentMethod === "TRANSFER" ? paymentReceipt : undefined,
        payphoneTransactionId: paymentMethod === "CARD" ? payphoneTransactionId : undefined,
        tipAmount: currentTip > 0 ? currentTip : undefined,
      };

      // Call public endpoint
      const data = await apiRequest(`/restaurants/public/catalog/${slug}/order`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!data.order?.id) {
        throw new Error("El servidor no confirmó el pedido");
      }
      setActiveOrder(data.order);
      rememberActiveOrder(data.order.type === "DINE_IN" ? null : data.order.id);

      setCart([]);
      setOrderSuccess(true);
      setIsCartMobileOpen(false);
    } catch (err: any) {
      alert("Error al enviar el pedido: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div className="skeleton" style={{ width: "300px", height: "100px", borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div style={{ minHeight: "100vh", padding: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div className="glass-card" style={{ padding: "30px", textAlign: "center", color: "var(--accent-primary)" }}>
          <AlertCircle size={40} style={{ marginBottom: "15px" }} />
          <p>{error || "Restaurante no encontrado"}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Stick Header Navigation style UberEats */}
      <nav style={{
        position: "sticky",
        top: 0,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        zIndex: 1000,
        padding: isMobile ? "10px 15px" : "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "20px", flex: 1 }}>
          <button 
            onClick={() => navigate("/restaurants")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              cursor: "pointer",
              padding: isMobile ? "8px 10px" : "8px 14px",
              borderRadius: "30px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#2f3542",
              border: "1px solid #e2e8f0",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f2f6";
              e.currentTarget.style.borderColor = "#ced6e0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <ArrowLeft size={16} />
            {!isMobile && <span>Volver</span>}
          </button>

          <h1 style={{
            fontSize: isMobile ? "18px" : "24px",
            fontWeight: "800",
            color: "#ff4757",
            letterSpacing: "-0.5px",
            margin: 0,
            cursor: "pointer"
          }} onClick={() => navigate("/restaurants")}>
            Go<span style={{ color: "#2f3542" }}>Eats</span>
          </h1>
        </div>

        <div style={{ display: "flex", gap: isMobile ? "6px" : "12px", alignItems: "center" }}>
          {!isMobile && (
            <Link to="/plus" style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#d97706",
              padding: "8px 16px",
              borderRadius: "30px",
              backgroundColor: "rgba(251, 191, 36, 0.08)",
              border: "1px solid #fbbf24",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s ease"
            }}>
              Hazte Plus {systemIconForEmoji("✨")}
            </Link>
          )}
          {isAuthenticated && user ? (
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "15px" }}>
              {!isMobile && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#202124" }}>{user.name}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{user.role}</div>
                </div>
              )}

              {user.role === "CUSTOMER" && (
                <Link to="/customer/dashboard" style={{
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: "600",
                  color: "#ff4757",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid #ff4757",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}>
                  {isMobile ? "Pedidos" : systemTextWithIcons("Mis Pedidos 🍔")}
                </Link>
              )}

              {user.role === "MOTORIZADO" && (
                <Link to="/delivery" style={{
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: "600",
                  color: "#ff4757",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid #ff4757",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}>
                  {isMobile ? "Entregas" : systemTextWithIcons("Entregas 🛵")}
                </Link>
              )}

              {(user.role === "RESTAURANT_OWNER" || user.role === "CAJERO" || user.role === "MOZO" || user.role === "PRODUCCION") && (
                <Link to="/pos" style={{
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: "600",
                  color: "#ff4757",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid #ff4757",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}>
                  {isMobile ? "POS" : systemTextWithIcons("Ir al POS 🖥️")}
                </Link>
              )}

              {user.role === "SUPER_ADMIN" && (
                <Link to="/admin/restaurants" style={{
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: "600",
                  color: "#ff4757",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid #ff4757",
                  textDecoration: "none",
                  transition: "all 0.2s ease"
                }}>
                  {isMobile ? "Admin" : systemTextWithIcons("Panel Admin 🛡️")}
                </Link>
              )}

              <button
                onClick={logout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: isMobile ? "6px 10px" : "8px 12px",
                  borderRadius: "30px",
                  backgroundColor: "rgba(255, 71, 87, 0.1)",
                  border: "1px solid rgba(255, 71, 87, 0.2)",
                  color: "var(--accent-primary)",
                  cursor: "pointer",
                  fontSize: isMobile ? "12px" : "12px",
                  fontWeight: 600,
                  transition: "all var(--transition-fast)"
                }}
              >
                Salir
              </button>
            </div>
          ) : (
            <>
              <Link to={loginPath} style={{
                fontSize: isMobile ? "12px" : "13px",
                fontWeight: "600",
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: isMobile ? "6px 12px" : "8px 20px",
                borderRadius: "30px",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}>
                {isMobile ? "Entrar" : "Iniciar Sesión"}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Restaurant Header Banner style UberEats */}
      <div style={{
        position: "relative",
        height: "280px",
        width: "100%",
        backgroundImage: restaurant.coverImage 
          ? `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.6)), url("${restaurant.coverImage}")` 
          : "linear-gradient(135deg, #ff4757, #ff6b81)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "flex-end",
        padding: "30px 40px",
        color: "#ffffff"
      }}>
        <div style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          position: "relative",
          zIndex: 2
        }}>
          {restaurant.logo ? (
            <img 
              src={restaurant.logo} 
              alt={restaurant.name} 
              onError={(e) => {
                e.currentTarget.src = "/logos/prueba.svg";
              }}
              style={{ 
                width: "90px", 
                height: "90px", 
                borderRadius: "16px", 
                objectFit: "contain",
                backgroundColor: "#ffffff",
                padding: "6px",
                border: "4px solid #ffffff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
              }} 
            />
          ) : (
            <div style={{ 
              width: "90px", 
              height: "90px", 
              borderRadius: "var(--radius-md)", 
              background: "#ffffff", 
              color: "var(--accent-primary)",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "2rem", 
              fontWeight: "bold",
              boxShadow: "var(--shadow-md)",
              border: "4px solid #ffffff"
            }}>
              {restaurant.name[0].toUpperCase()}
            </div>
          )}
          
          <div style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            <h1 style={{ fontSize: "2.4rem", fontWeight: "800", margin: "0 0 5px 0", letterSpacing: "-0.5px" }}>{restaurant.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span style={{ background: "rgba(255,255,255,0.92)", borderRadius: "20px", padding: "3px 10px", textShadow: "none" }}>
                <StarAverage average={restaurant.ratingAverage} count={restaurant.ratingCount} />
              </span>
              {restaurant.reservationsEnabled && !activeTableId && (
                <button
                  type="button"
                  onClick={() => (isAuthenticated && user?.role === "CUSTOMER" ? setReserveOpen(true) : navigate(loginPath))}
                  style={{ background: "#ffffff", color: "#000000", border: "none", borderRadius: "20px", padding: "6px 14px", minHeight: "36px", fontWeight: 700, cursor: "pointer", textShadow: "none" }}
                >
                  Reservar mesa
                </button>
              )}
            </div>
            {restaurant.description && (
              <p style={{ fontSize: "1.1rem", fontStyle: "italic", margin: "0 0 10px 0", opacity: 0.9 }}>
                {restaurant.description}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "0.95rem", opacity: 0.95 }}>
              {restaurant.address && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <MapPin size={16} />
                  <span>{restaurant.address} {restaurant.reference ? `(${restaurant.reference})` : ""}</span>
                </div>
              )}
              {restaurant.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Phone size={16} />
                  <span>{restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table-specific Info bar (SSID) if active */}
      {activeTableId && restaurant.wifiSsid && (
        <div style={{ backgroundColor: "#ffeef0", borderBottom: "1px solid #ffe2e5", padding: "10px 30px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "#d63031", fontWeight: "600" }}>
            <Wifi size={16} />
            <span>Estás en la mesa. WiFi local: <strong>{restaurant.wifiSsid}</strong> {restaurant.wifiPassword ? `(Clave: ${restaurant.wifiPassword})` : "(Red libre)"}</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="mobile-column-stack" style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 380px", gap: "40px" }}>
        
        {/* Menu Catalog Section */}
        <main>
          {/* Bar de Servicio en Mesa (Salón QR) */}
          {orderType === "DINE_IN" && (
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 165, 2, 0.08), rgba(46, 213, 115, 0.08))",
              border: "1px solid rgba(255, 165, 2, 0.3)",
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ffa502", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.4rem" }}>
                  {systemIconForEmoji("🪑")}
                </div>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "var(--text-primary)" }}>
                    {selectedTable 
                      ? `Mesa ${diningAreas.flatMap(a => a.tables).find(t => String(t.id) === String(selectedTable))?.number || selectedTable} • En Servicio`
                      : "Servicio en Mesa (Autoservicio QR)"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {!selectedTable
                      ? "Elige tu mesa en el carrito para ordenar"
                      : restaurant.payBeforeEating
                        ? "Este local cobra antes de preparar: tu pedido pasa a cocina cuando pagas en caja"
                        : "Tus comandas van directo a la pantalla de cocina"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {restaurant.waiterCallEnabled !== false && (
                <button
                  type="button"
                  onClick={() => handleCallWaiter("CALL")}
                  disabled={waiterCallLoading || !selectedTable}
                  style={{
                    background: "#ffa502",
                    color: "#fff",
                    border: "none",
                    padding: "9px 16px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: selectedTable ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(255,165,2,0.3)",
                    opacity: selectedTable ? 1 : 0.6
                  }}
                >
                  <BellRing size={16} />
                  <span>{waiterCallLoading ? "Avisando..." : "Llamar Mesero"}</span>
                </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCallWaiter("BILL")}
                  disabled={waiterCallLoading || !selectedTable}
                  style={{
                    background: "#2ed573",
                    color: "#fff",
                    border: "none",
                    padding: "9px 16px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: selectedTable ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(46,213,115,0.3)",
                    opacity: selectedTable ? 1 : 0.6
                  }}
                >
                  <Receipt size={16} />
                  <span>{waiterCallLoading ? "Avisando..." : "Pedir Cuenta"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Banner de confirmación de llamado a mesero */}
          {waiterCallStatus && (
            <div style={{
              background: "rgba(46, 213, 115, 0.15)",
              border: "1px solid #2ed573",
              color: "#2ed573",
              padding: "14px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span>{waiterCallStatus}</span>
            </div>
          )}

          {orderSuccess ? (
            activeOrder?.type === "DELIVERY" ? (
              /* LIVE TRACKER ESTILO PEDIDOSYA */
              <div className="glass-card" style={{ padding: "30px", background: "var(--card-bg, #ffffff)", borderColor: "var(--border-light)", borderRadius: "18px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {systemIconForEmoji("🛵")} Pedido a Domicilio en Curso
                    </span>
                    <h2 style={{ margin: "4px 0 0 0", fontSize: "1.5rem" }}>
                      Orden #{activeOrder?.id || "---"}
                    </h2>
                  </div>
                  <div style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontWeight: "800",
                    fontSize: "0.85rem",
                    backgroundColor: activeOrder?.status === "DELIVERED" ? "rgba(46, 213, 115, 0.15)" : activeOrder?.status === "DELIVERING" ? "rgba(30, 144, 255, 0.15)" : "rgba(255, 165, 2, 0.15)",
                    color: activeOrder?.status === "DELIVERED" ? "#2ed573" : activeOrder?.status === "DELIVERING" ? "#1e90ff" : "#ffa502"
                  }}>
                    {activeOrder?.status === "DELIVERED" ? "✓ ENTREGADO" : activeOrder?.status === "DELIVERING" ? "EN CAMINO" : activeOrder?.status === "READY" ? "EMPACADO" : "EN PREPARACIÓN"}
                  </div>
                </div>

                {/* PIN DE ENTREGA DESTACADO */}
                {activeOrder?.deliveryPin && activeOrder?.status !== "DELIVERED" && activeOrder?.status !== "CANCELLED" && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(46, 213, 115, 0.12), rgba(30, 144, 255, 0.12))",
                    border: "2px dashed #2ed573",
                    borderRadius: "14px",
                    padding: "20px",
                    margin: "20px 0",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#2ed573", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      {systemIconForEmoji("🔑")} CÓDIGO DE ENTREGA
                    </div>
                    <div style={{ fontSize: "3.2rem", fontWeight: "900", letterSpacing: "12px", color: "#2ed573", margin: "10px 0", fontFamily: "monospace" }}>
                      {activeOrder.deliveryPin}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                      Dáselo al motorizado solo cuando recibas tu pedido. También lo encuentras en "Mis pedidos".
                    </p>
                  </div>
                )}

                {/* STEPPER DE PROGRESO EN VIVO */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", margin: "28px 0", textAlign: "center" }}>
                  {[
                    { label: "1. Confirmado", icon: "✓", active: true },
                    { label: "2. En Cocina", icon: systemTextWithIcons("🔥"), active: activeOrder?.status !== "PENDING" },
                    { label: "3. En Camino", icon: systemTextWithIcons("🛵"), active: activeOrder?.status === "DELIVERING" || activeOrder?.status === "DELIVERED" },
                    { label: "4. Entregado", icon: systemTextWithIcons("🎉"), active: activeOrder?.status === "DELIVERED" }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: step.active ? "#2ed573" : "#e2e8f0",
                        color: step.active ? "#fff" : "#a4b0be",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        boxShadow: step.active ? "0 3px 10px rgba(46,213,115,0.3)" : "none"
                      }}>
                        {step.icon}
                      </div>
                      <span style={{ fontSize: "0.78rem", fontWeight: step.active ? "700" : "500", color: step.active ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* DETALLES DE ENTREGA */}
                <div style={{ background: "rgba(0,0,0,0.02)", borderRadius: "12px", padding: "16px", margin: "20px 0", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><strong>Destino:</strong> {activeOrder?.deliveryAddress || deliveryAddress || "Dirección indicada"}</div>
                  {(activeOrder?.deliveryObservation || deliveryReference) && (
                    <div><strong>Referencia:</strong> {activeOrder?.deliveryObservation || deliveryReference}</div>
                  )}
                  {Number(activeOrder?.tipAmount || 0) > 0 && (
                    <div><strong>Propina al motorizado:</strong> ${Number(activeOrder.tipAmount).toFixed(2)}</div>
                  )}
                  <div><strong>Total a pagar:</strong> ${(Number(activeOrder?.total || 0) + Number(activeOrder?.tipAmount || 0)).toFixed(2)} ({activeOrder?.paymentMethodString === "CASH" ? "Efectivo contraentrega" : "Pagado digitalmente"})</div>
                  <div><strong>Repartidor:</strong> {activeOrder?.deliveryDriverName || "Buscando repartidor cercano..."}</div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="secondary-btn" onClick={() => { rememberActiveOrder(null); setOrderSuccess(false); }} style={{ padding: "12px 24px" }}>
                    Hacer otro pedido
                  </button>
                  <button className="glow-btn" onClick={() => navigate("/customer/dashboard")} style={{ padding: "12px 24px" }}>
                    Ver en Mis pedidos
                  </button>
                </div>
              </div>
            ) : (
              /* CONFIRMACIÓN EN MESA (DINE-IN QR) */
              <div className="glass-card" style={{ padding: "40px", textAlign: "center", background: "rgba(46, 213, 115, 0.05)", borderColor: "var(--success)" }}>
                <Check size={48} color="var(--success)" style={{ marginBottom: "15px" }} />
                <h2 style={{ marginBottom: "10px" }}>¡Comanda Enviada a Cocina!</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "25px", fontSize: "1rem" }}>
                  Los platos seleccionados para tu <strong>Mesa</strong> ya se encuentran en la pantalla del cocinero.
                </p>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                  <button className="secondary-btn" onClick={() => handleCallWaiter("CALL")} style={{ padding: "10px 20px" }}>
                    {systemIconForEmoji("🛎️")} Llamar al Mesero
                  </button>
                  <button className="secondary-btn" onClick={() => handleCallWaiter("BILL")} style={{ padding: "10px 20px" }}>
                    {systemIconForEmoji("🧾")} Solicitar Cuenta
                  </button>
                  <button className="glow-btn" onClick={() => setOrderSuccess(false)} style={{ padding: "10px 20px" }}>
                    {systemIconForEmoji("🍽️")} Pedir más platos
                  </button>
                </div>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {categories.map((cat) => (
                <section key={cat.id}>
                  <h2 style={{ fontSize: "1.6rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", marginBottom: "20px" }}>{cat.name}</h2>
                  {cat.description && <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "0.95rem" }}>{cat.description}</p>}

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {cat.items.map((item) => (
                      <div key={item.id} className="glass-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 140px", gap: "20px", alignItems: "center" }}>
                        <div>
                          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{item.name}</h3>
                          {item.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "15px" }}>{item.description}</p>}
                          
                          {/* Variants presentation pricing selection */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            {item.variants.map((v) => (
                              <button key={v.id} className="secondary-btn" onClick={() => addToCart(v, item)} style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                                <Plus size={14} color="var(--accent-primary)" />
                                <span>{v.name}: <strong>${v.price.toFixed(2)}</strong></span>
                                {v.regularPrice && (
                                  <span data-testid="catalog-promo" style={{ fontSize: "0.85rem" }}>
                                    <s style={{ opacity: 0.7 }}>${v.regularPrice.toFixed(2)}</s>{" "}
                                    <span style={{ background: "#b91c1c", color: "#ffffff", borderRadius: "6px", padding: "1px 6px", fontWeight: 700 }}>Promo</span>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100px", borderRadius: "var(--radius-md)", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100px", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Utensils size={24} color="var(--text-muted)" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        {/* Sidebar Cart & Info Section */}
        {/* Sidebar Cart & Info Section */}
        <aside className={`mobile-cart-aside ${isCartMobileOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <div className="glass-card" style={{ padding: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShoppingCart size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: "1.3rem" }}>Tu Carrito</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCartMobileOpen(false)}
                className="mobile-show"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                <p>Tu carrito está vacío. Agrega platos del menú para comenzar.</p>
              </div>
            ) : (
              <form onSubmit={handleCheckout}>
                {/* Cart Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "25px", maxHeight: "250px", overflowY: "auto", paddingRight: "5px" }}>
                  {cart.map((item) => (
                    <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", fontSize: "0.9rem" }}>
                      <div>
                        <div style={{ fontWeight: "bold" }}>{item.itemName}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{item.name} - ${item.price.toFixed(2)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button type="button" onClick={() => updateQuantity(item.variantId, -1)} style={{ padding: "4px", background: "var(--bg-tertiary)", borderRadius: "4px", cursor: "pointer" }}>
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.variantId, 1)} style={{ padding: "4px", background: "var(--bg-tertiary)", borderRadius: "4px", cursor: "pointer" }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                            {/* Totals */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px dashed var(--border-light)", paddingTop: "15px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                    <span>Subtotal Productos:</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  {orderType === "DELIVERY" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                      <span>Costo Envío:</span>
                      <span style={{ color: isPlusUser ? "var(--success)" : "inherit", fontWeight: isPlusUser ? "bold" : "normal" }}>
                        {isPlusUser ? systemTextWithIcons("Gratis con Plus ✨") : `$${currentShippingCost.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  {currentTip > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                      <span>Propina motorizado:</span>
                      <span>${currentTip.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: "bold", borderTop: "1px solid var(--border-light)", paddingTop: "6px" }}>
                    <span>Total General:</span>
                    <span style={{ color: "var(--accent-primary)" }}>
                      ${(getCartTotal() + currentShippingCost + currentTip).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Fields */}
                <div className="input-group">
                  <label>Tu Nombre</label>
                  <input type="text" className="input-field" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>

                {/* Order Type Toggle */}
                {activeTableId ? (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "rgba(46, 213, 115, 0.05)",
                    border: "1px solid var(--success)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--success)",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}>
                    <Utensils size={16} />
                    Pedido para Mesa: {(() => {
                      for (const area of diningAreas) {
                        const found = area.tables.find(t => t.id.toString() === activeTableId.toString());
                        if (found) return found.number;
                      }
                      return activeTableId;
                    })()}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                    <button type="button" className={orderType === "DELIVERY" ? "glow-btn" : "secondary-btn"} onClick={() => { setOrderType("DELIVERY"); setPaymentMethod("CASH"); }} style={{ padding: "10px" }}>
                      Llevar a Domicilio
                    </button>
                    <button type="button" className={orderType === "TAKEOUT" ? "glow-btn" : "secondary-btn"} onClick={() => { setOrderType("TAKEOUT"); setPaymentMethod("CASH"); }} style={{ padding: "10px" }}>
                      Recoger en Local
                    </button>
                  </div>
                )}

                {/* Force Login Message for Off-Premise */}
                {(orderType === "DELIVERY" || orderType === "TAKEOUT") && !isAuthenticated ? (
                  <div style={{
                    backgroundColor: "rgba(255, 71, 87, 0.05)",
                    border: "1px solid var(--accent-primary)",
                    padding: "15px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "20px",
                    textAlign: "center"
                  }}>
                    <AlertCircle size={24} style={{ color: "var(--accent-primary)", margin: "0 auto 8px auto" }} />
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "12px", fontWeight: "600" }}>
                      Inicia sesión para realizar tu pedido
                    </p>
                    <button
                      type="button"
                      className="glow-btn"
                      onClick={() => navigate(loginPath)}
                      style={{ width: "100%", padding: "8px", fontSize: "13px" }}
                    >
                      Iniciar Sesión / Registrarse
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Conditionally Render Fields */}
                    {orderType === "DELIVERY" && (
                      <>
                        {savedAddresses.length > 1 && (
                          <div className="input-group">
                            <label htmlFor="saved-address">¿A dónde lo llevamos?</label>
                            <select
                              id="saved-address"
                              className="input-field"
                              style={{ fontSize: "16px" }}
                              value={selectedAddressId ?? ""}
                              onChange={(e) => chooseSavedAddress(Number(e.target.value))}
                            >
                              {savedAddresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.label}: {a.address}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div style={{ marginBottom: "15px" }}>
                          <label style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", display: "block", color: "var(--text-primary)" }}>
                            {systemIconForEmoji("📍")} Ubicación de Entrega en el Mapa
                          </label>
                          <LocationPickerMap
                            key={`entrega-${selectedAddressId ?? "manual"}`}
                            initialLat={deliveryLat || undefined}
                            initialLng={deliveryLng || undefined}
                            restaurantLat={restaurant?.mapLatitude || -3.9965}
                            restaurantLng={restaurant?.mapLongitude || -79.2030}
                            restaurantName={restaurant?.name || "Restaurante"}
                            onLocationSelect={(lat, lng, addr) => {
                              setDeliveryLat(lat);
                              setDeliveryLng(lng);
                              if (addr) setDeliveryAddress(addr);
                            }}
                            height="280px"
                          />
                        </div>

                        <div className="input-group">
                          <label>Dirección de Envío (Edita o agrega detalles)</label>
                          <input type="text" className="input-field" required={orderType === "DELIVERY"} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Ej: Calle 24 de Mayo y Mercadillo, Barrio Central" />
                        </div>
                        <div className="input-group">
                          <label>Referencia de Entrega (Opcional)</label>
                          <input type="text" className="input-field" value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} placeholder="Ej: Casa blanca de 2 pisos, portón negro, timbre 3" />
                        </div>
                        <div className="input-group">
                          <label>Teléfono de Contacto</label>
                          <input type="text" className="input-field" required={orderType === "DELIVERY"} value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} placeholder="Ej: 0998765432" />
                        </div>

                        {/* Interactive Distance & Fee Breakdown */}
                        <div style={{
                          marginTop: "12px",
                          marginBottom: "20px",
                          padding: "14px",
                          backgroundColor: "var(--bg-secondary)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-light)"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "700" }}>Distancia Calculada al Local:</span>
                            <span style={{ backgroundColor: "rgba(255, 71, 87, 0.1)", color: "#ff4757", padding: "2px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: "800" }}>
                              {shippingDistance.toFixed(1)} km
                            </span>
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Tarifa Base:</span>
                              <span>${(deliveryRate?.basePrice || 1.0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Costo por Kilómetro:</span>
                              <span>${(deliveryRate?.pricePerKm || 0.5).toFixed(2)} / km</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px dashed var(--border-light)", paddingTop: "6px", color: "var(--text-primary)" }}>
                              <span>Costo de Envío:</span>
                              <span style={{ color: isPlusUser ? "var(--success)" : "inherit" }}>
                                {isPlusUser ? systemTextWithIcons("Gratis con Plus ✨") : `$${currentShippingCost.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Optional tip for the driver */}
                        <fieldset style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: "20px" }}>
                          <legend style={{ fontSize: "13px", fontWeight: 700, padding: "0 4px" }}>Propina para el motorizado (opcional)</legend>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
                            {TIP_CHOICES.map((value) => (
                              <button
                                key={value}
                                type="button"
                                aria-pressed={tipAmount === value}
                                className={tipAmount === value ? "glow-btn" : "secondary-btn"}
                                onClick={() => setTipAmount(value)}
                                style={{ minHeight: "44px", padding: "6px 4px" }}
                              >
                                {value === 0 ? "Sin propina" : `$${value.toFixed(2)}`}
                              </button>
                            ))}
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "8px 0 0" }}>
                            Va completa al motorizado que te entrega.
                          </p>
                        </fieldset>
                      </>
                    )}

                    {/* Payment Method Selector */}
                    {(orderType === "DELIVERY" || orderType === "TAKEOUT") && (
                      <div style={{
                        marginTop: "15px",
                        marginBottom: "20px",
                        padding: "15px",
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-light)"
                      }}>
                        <label style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", display: "block" }}>
                          Método de Pago
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                          <button
                            type="button"
                            className={paymentMethod === "CASH" ? "glow-btn" : "secondary-btn"}
                            onClick={() => {
                              setPaymentMethod("CASH");
                              setPaymentReceipt("");
                              setPayphoneTransactionId("");
                            }}
                            style={{ padding: "8px 4px", fontSize: "0.85rem" }}
                          >
                            Efectivo
                          </button>
                          
                          <button
                            type="button"
                            className={paymentMethod === "CARD" ? "glow-btn" : "secondary-btn"}
                            onClick={() => {
                              setPaymentMethod("CARD");
                              setPaymentReceipt("");
                              setPayphoneTransactionId("");
                            }}
                            style={{ padding: "8px 4px", fontSize: "0.85rem" }}
                          >
                            Tarjeta
                          </button>

                          {activeBankAccounts.length > 0 && <button
                            type="button"
                            className={paymentMethod === "TRANSFER" ? "glow-btn" : "secondary-btn"}
                            onClick={() => {
                              setPaymentMethod("TRANSFER");
                              setPayphoneTransactionId("");
                            }}
                            style={{ padding: "8px 4px", fontSize: "0.85rem" }}
                          >
                            Transferencia
                          </button>}
                        </div>

                        {/* Payphone CARD flow */}
                        {paymentMethod === "CARD" && (
                          <div style={{ marginTop: "10px" }}>
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
                                <Check size={16} />
                                <div>
                                  <div style={{ fontWeight: "bold" }}>Pago Exitoso</div>
                                  <div style={{ fontSize: "13px" }}>Transacción: {payphoneTransactionId}</div>
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

                        {/* Bank TRANSFER flow */}
                        {paymentMethod === "TRANSFER" && activeBankAccounts.length > 0 && (
                          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                              Seleccionar Cuenta Bancaria:
                            </label>
                            <select
                              className="input-field"
                              value={selectedBankAccId}
                              onChange={(e) => setSelectedBankAccId(e.target.value)}
                              style={{ padding: "6px", fontSize: "0.85rem" }}
                            >
                              {activeBankAccounts.map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.bank} - {acc.accountType === "ahorros" ? "Ahorros" : "Corriente"}
                                </option>
                              ))}
                            </select>

                            {/* Render details of selected account */}
                            {(() => {
                              const acc = activeBankAccounts.find((a: any) => a.id.toString() === selectedBankAccId.toString());
                              if (!acc) return null;
                              return (
                                <div style={{
                                  fontSize: "13px",
                                  backgroundColor: "var(--bg-tertiary)",
                                  padding: "10px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--border-light)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px"
                                }}>
                                  <div><strong>Banco:</strong> {acc.bank}</div>
                                  <div><strong>Titular:</strong> {acc.ownerName}</div>
                                  <div><strong>Tipo:</strong> {acc.accountType === "ahorros" ? "Ahorros" : "Corriente"}</div>
                                  <div><strong>Número:</strong> {acc.accountNumber}</div>
                                  <div><strong>RUC/Cédula:</strong> {acc.ownerDoc}</div>
                                  {acc.ownerEmail && <div><strong>Correo:</strong> {acc.ownerEmail}</div>}
                                  
                                  {acc.qrImage && (
                                    <div style={{ marginTop: "8px", textAlign: "center" }}>
                                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>Código QR de Pago:</div>
                                      <img
                                        src={acc.qrImage}
                                        alt="QR de Pago"
                                        style={{ maxWidth: "150px", maxHeight: "150px", borderRadius: "4px", border: "1px solid var(--border-light)" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {/* File Upload for receipt */}
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: "13px", fontWeight: "600" }}>Subir Comprobante de Pago</label>
                              <input
                                type="file"
                                accept="image/*"
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
                              {paymentReceipt && (
                                <div style={{ marginTop: "6px", fontSize: "13px", color: "var(--success)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <Check size={12} /> Comprobante cargado correctamente.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {orderType === "DINE_IN" && (
                      <div className="input-group">
                        <label>Selecciona tu Mesa</label>
                        {activeTableId ? (
                          <input
                            type="text"
                            className="input-field"
                            readOnly
                            value={`Mesa ${(() => {
                              for (const area of diningAreas) {
                                const found = area.tables.find(t => t.id.toString() === activeTableId.toString());
                                if (found) return found.number;
                              }
                              return activeTableId;
                            })()}`}
                            style={{ background: "var(--success-glow)", borderColor: "var(--success)", fontWeight: "bold" }}
                          />
                        ) : (
                          <select className="input-field" required={orderType === "DINE_IN"} value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
                            <option value="">-- Selecciona --</option>
                            {diningAreas.map((area) => (
                              <optgroup key={area.id} label={area.name}>
                                {area.tables.map((t) => (
                                  <option key={t.id} value={t.id}>Mesa {t.number}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* QR Ordering Toggle Guard */}
                    {orderType === "DINE_IN" && !restaurant.qrOrderingEnabled ? (
                      <div style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid var(--accent-primary)", padding: "15px", borderRadius: "var(--radius-md)", display: "flex", gap: "12px", color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                        <AlertCircle size={24} style={{ flexShrink: 0, color: "var(--accent-primary)" }} />
                        <p><strong>Pedidos QR Desactivados:</strong> El restaurante no tiene activo el autopendiente desde mesas. Por favor contacta a un mesero para realizar tu orden.</p>
                      </div>
                    ) : (
                      <button type="submit" className="glow-btn" style={{ width: "100%" }} disabled={submitting}>
                        {submitting ? "Procesando..." : "Confirmar Pedido"}
                      </button>
                    )}
                  </>
                )}
              </form>
            )}
          </div>

          {/* Local Information Card (Address, Phone, WiFi, Hours, Reference, Map) */}
          <div className="glass-card" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              <MapPin size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: "1.05rem", margin: 0, fontWeight: "700", color: "var(--text-primary)" }}>
                Información del Local
              </h3>
            </div>

            {/* Physical Address */}
            {restaurant.address && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 71, 87, 0.1)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}>
                  <MapPin size={15} />
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>
                    Dirección
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "500", lineHeight: 1.4 }}>
                    {restaurant.address}
                  </span>
                </div>
              </div>
            )}

            {/* Phone */}
            {restaurant.phone && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(46, 213, 115, 0.1)",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}>
                  <Phone size={15} />
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>
                    Teléfono / Contacto
                  </span>
                  <a
                    href={`tel:${restaurant.phone}`}
                    style={{ fontSize: "13px", color: "var(--accent-primary)", fontWeight: "600", textDecoration: "none" }}
                  >
                    {restaurant.phone}
                  </a>
                </div>
              </div>
            )}

            {/* WiFi de Cortesía */}
            {restaurant.wifiSsid && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}>
                  <Wifi size={15} />
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>
                    Wi-Fi de Cortesía
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                    Red: <strong>{restaurant.wifiSsid}</strong>
                    {restaurant.wifiPassword && (
                      <span style={{ marginLeft: "6px", color: "var(--text-secondary)" }}>
                        • Clave: <code style={{ backgroundColor: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: "4px" }}>{restaurant.wifiPassword}</code>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Opening hours */}
            {restaurant.openingHours && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}>
                  <Clock size={15} />
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>
                    Horarios de Atención
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "500" }}>
                    {restaurant.openingHours}
                  </span>
                </div>
              </div>
            )}

            {/* Reference */}
            {restaurant.reference && (
              <div style={{
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)"
              }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "3px" }}>
                  Referencia de Ubicación
                </span>
                <p style={{ fontSize: "13px", margin: 0, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  {restaurant.reference}
                </p>
              </div>
            )}

            {/* Google Map Embedded */}
            {(() => {
              const embedUrl = getMapEmbedUrl(restaurant.mapIframe);
              const hasCoords = Boolean(restaurant.mapLatitude && restaurant.mapLongitude);
              const directMapUrl = restaurant.mapIframe && restaurant.mapIframe.startsWith("https://")
                ? restaurant.mapIframe
                : hasCoords
                  ? `https://www.google.com/maps/search/?api=1&query=${restaurant.mapLatitude},${restaurant.mapLongitude}`
                  : restaurant.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`
                    : null;

              if (!embedUrl && !hasCoords && !directMapUrl) return null;

              return (
                <div style={{ marginTop: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                    Ubicación en el Mapa
                  </span>

                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="190"
                      style={{
                        border: "1px solid var(--border-light)",
                        borderRadius: "12px",
                        display: "block",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                      }}
                      allowFullScreen
                      loading="lazy"
                      title="Ubicación del Local"
                    />
                  ) : hasCoords ? (
                    <iframe
                      src={`https://maps.google.com/maps?q=${restaurant.mapLatitude},${restaurant.mapLongitude}&z=16&output=embed`}
                      width="100%"
                      height="190"
                      style={{
                        border: "1px solid var(--border-light)",
                        borderRadius: "12px",
                        display: "block",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                      }}
                      allowFullScreen
                      loading="lazy"
                      title="Ubicación del Local"
                    />
                  ) : null}

                  {directMapUrl && (
                    <a
                      href={directMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-btn"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: "13px",
                        marginTop: "8px",
                        textDecoration: "none",
                        borderRadius: "8px"
                      }}
                    >
                      <MapPin size={13} />
                      Abrir en Google Maps
                    </a>
                  )}
                </div>
              );
            })()}

            {/* Soporte y Atención al Cliente Button */}
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "14px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  color: "#2563eb",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
              >
                <HelpCircle size={16} />
                ¿Necesitas Ayuda? Soporte GoEats
              </button>
            </div>
          </div>
        </aside>

      </div>

      {/* FAQs Section - Solo se muestra si el dueño del restaurante configuró preguntas frecuentes */}
      {(() => {
        let parsedFaqs: Array<{ question: string; answer: string }> = [];
        if (restaurant.faqsJson) {
          try {
            const parsed = JSON.parse(restaurant.faqsJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedFaqs = parsed.filter((f: any) => f && f.question && f.question.trim());
            }
          } catch (e) {
            console.error("Error parsing FAQs JSON", e);
          }
        }
        if (parsedFaqs.length === 0) return null;

        return (
          <div style={{ maxWidth: "1200px", margin: "40px auto 80px auto", padding: "0 20px" }}>
            <h2 style={{ 
              fontSize: "1.8rem", 
              fontWeight: "800",
              color: "#202124",
              marginBottom: "25px", 
              borderBottom: "1px solid var(--border-light)", 
              paddingBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              Preguntas Frecuentes
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {parsedFaqs.map((faq: any, index: number) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div 
                    key={index} 
                    style={{
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "#ffffff",
                      overflow: "hidden",
                      transition: "all var(--transition-fast)"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px 25px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "1.05rem",
                        fontWeight: "700",
                        color: "#202124"
                      }}
                    >
                      <span>{faq.question}</span>
                      <span style={{ 
                        fontSize: "1.3rem", 
                        fontWeight: "400",
                        color: "var(--accent-primary)",
                        transform: isOpen ? "rotate(45deg)" : "none",
                        transition: "transform var(--transition-fast)"
                      }}>
                        ＋
                      </span>
                    </button>
                    
                    {isOpen && (
                      <div style={{
                        padding: "0 25px 20px 25px",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        color: "var(--text-secondary)"
                      }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Payphone Simulator Modal */}
      {showPayphoneSimulator && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "380px", padding: "25px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#ff5a00", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" }}>P</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, color: "#ff5a00" }}>Payphone: demostración, sin cobro real</h3>
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
                Estás realizando un pago simulado por un total de <strong>${(getCartTotal() + currentShippingCost + currentTip).toFixed(2)}</strong> a favor de {restaurant.name}.
              </div>

              <div className="input-group">
                <label style={{ fontSize: "13px" }}>Número de Tarjeta</label>
                <input type="text" className="input-field" placeholder="4111 1111 1111 1111" defaultValue="4111 1111 1111 1111" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="input-group">
                  <label style={{ fontSize: "13px" }}>Fecha Vencimiento</label>
                  <input type="text" className="input-field" placeholder="12/28" defaultValue="12/28" />
                </div>
                <div className="input-group">
                  <label style={{ fontSize: "13px" }}>CVV</label>
                  <input type="password" className="input-field" placeholder="123" defaultValue="123" />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontSize: "13px" }}>Titular de la Tarjeta</label>
                <input type="text" className="input-field" placeholder="Juan Pérez" defaultValue={customerName || "Juan Pérez"} />
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
                Confirmar Pago Exitoso
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowPayphoneSimulator(false)}
                style={{ width: "100%", padding: "10px" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating cart button for mobile */}
      {cart.length > 0 && !isCartMobileOpen && (
        <div
          className="mobile-show-flex animate-fade-in"
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            right: "20px",
            zIndex: 90,
            justifyContent: "center",
            display: "none"
          }}
        >
          <button
            onClick={() => setIsCartMobileOpen(true)}
            className="glow-btn"
            style={{
              width: "100%",
              padding: "16px 24px",
              fontSize: "16px",
              boxShadow: "0 10px 25px rgba(255, 71, 87, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "var(--radius-xl)"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShoppingCart size={20} />
              Ver Pedido ({cart.reduce((sum, item) => sum + item.quantity, 0)} ítems)
            </span>
            <strong>${(getCartTotal() + currentShippingCost + currentTip).toFixed(2)}</strong>
          </button>
        </div>
      )}

      {/* Support & Help Center Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultRole="CUSTOMER"
        restaurantName={restaurant.name}
      />

      {reserveOpen && slug && (
        <ReserveTable
          slug={slug}
          restaurantName={restaurant.name}
          defaultName={user?.name || ""}
          defaultPhone={user?.phone || ""}
          onClose={() => setReserveOpen(false)}
        />
      )}
    </div>
  );
};
