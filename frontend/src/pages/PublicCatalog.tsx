import React, { useEffect, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { ShoppingCart, Wifi, MapPin, Phone, Utensils, Check, Plus, Minus, AlertCircle, Clock, X, ArrowLeft, BellRing, Receipt, HelpCircle, Trash2 } from "lucide-react";
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
import { WifiQR } from "../components/WifiQR";
import { BrandLogo } from "../components/BrandLogo";
import { ChefIllustration } from "../components/LandingIllustrations";
import { Drawer } from "vaul";
import { describeWeek, getOpenStatus, parseWeeklyHours } from "../utils/openingHours";
import { useReveal } from "../utils/useReveal";
import "../styles/catalog.css";

// Pago con tarjeta apagado hasta tener proveedor (VITE_CARD_PAYMENTS=true lo enciende)
const CARD_PAYMENTS_ENABLED = import.meta.env.VITE_CARD_PAYMENTS === "true";


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

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
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
  // "Pedir de nuevo": datos del pedido anterior para no escribirlos otra vez
  const [reorderPrefs] = useState<{
    type?: "DELIVERY" | "TAKEOUT";
    address?: string;
    lat?: number | null;
    lng?: number | null;
    phone?: string;
    paymentMethod?: "CASH" | "CARD" | "TRANSFER";
  } | null>(() => {
    try {
      const key = `goeats_reorder_prefs_${slug}`;
      const raw = sessionStorage.getItem(key);
      sessionStorage.removeItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [orderType, setOrderType] = useState<"DINE_IN" | "DELIVERY" | "TAKEOUT">(() =>
    reorderPrefs?.type === "TAKEOUT" ? "TAKEOUT" : "DELIVERY"
  );
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(() => reorderPrefs?.address || user?.deliveryAddress || "");
  const [deliveryReference, setDeliveryReference] = useState(() =>
    [user?.deliveryFloorApartment, user?.deliverySecondaryStreet, user?.deliveryReferences]
      .filter(Boolean)
      .join(", ")
  );
  const [deliveryPhone, setDeliveryPhone] = useState(() => reorderPrefs?.phone || user?.phone || "");
  // Note for the whole order; kitchen and comanda show it (bosses, 17 nov)
  const [orderNote, setOrderNote] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(() =>
    reorderPrefs?.lat != null && reorderPrefs?.lng != null ? reorderPrefs.lat : user?.deliveryLatitude ?? null
  );
  const [deliveryLng, setDeliveryLng] = useState<number | null>(() =>
    reorderPrefs?.lat != null && reorderPrefs?.lng != null ? reorderPrefs.lng : user?.deliveryLongitude ?? null
  );
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
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

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
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">(() => {
    const previous = reorderPrefs?.paymentMethod;
    if (previous === "TRANSFER") return "TRANSFER";
    if (previous === "CARD" && CARD_PAYMENTS_ENABLED) return "CARD";
    return "CASH";
  });
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
        // "Pedir de nuevo": abrir el carrito y contar lo que cambio desde el pedido anterior
        const reorderKey = `goeats_reorder_${slug}`;
        let isReorder = false;
        try {
          isReorder = sessionStorage.getItem(reorderKey) === "1";
          sessionStorage.removeItem(reorderKey);
        } catch {
          // Sin almacenamiento no hay aviso, el carrito igual funciona
        }
        setCart((saved) => {
          const kept = saved
            .filter((line) => variants.has(line.variantId))
            .map((line) => ({ ...line, price: Number(variants.get(line.variantId)!.price) }));

          if (isReorder) {
            const removed = saved.length - kept.length;
            const repriced = kept.filter((line) => {
              const before = saved.find((old) => old.variantId === line.variantId);
              return before && Math.abs(Number(before.price) - line.price) > 0.001;
            }).length;
            const notes: string[] = ["Cargamos tu pedido anterior. Quita o agrega lo que quieras y confirma."];
            if (removed > 0) notes.push(removed === 1 ? "1 plato ya no está disponible y se quitó." : `${removed} platos ya no están disponibles y se quitaron.`);
            if (repriced > 0) notes.push(repriced === 1 ? "1 plato cambió de precio; se usa el precio actual." : `${repriced} platos cambiaron de precio; se usa el precio actual.`);
            setReorderNotice(notes.join(" "));
            setIsCartMobileOpen(true);
          }
          return kept;
        });

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
        // Si viene de "pedir de nuevo" con otra direccion, no marcar la principal como elegida
        if (!reorderPrefs?.address || reorderPrefs.address === main.address) setSelectedAddressId(main.id);
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

  const updateItemNote = (variantId: number, note: string) => {
    setCart(cart.map((c) => (c.variantId === variantId ? { ...c, comments: note.slice(0, 120) } : c)));
  };

  // Quitar un producto del carrito de una sola vez
  const removeFromCart = (variantId: number) => {
    setCart(cart.filter((c) => c.variantId !== variantId));
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

    if (!customerName.trim()) {
      alert(orderType === "TAKEOUT" ? "Escribe el nombre de quien va a retirar el pedido." : "Por favor ingresa tu nombre");
      return;
    }

    if (orderType === "TAKEOUT" && !/^\+?\d[\d ()-]{6,19}$/.test(deliveryPhone.trim())) {
      alert("Escribe un teléfono para avisarte cuando tu pedido esté listo.");
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
        comments: orderNote.trim() || null,
        deliveryAddress: orderType === "DELIVERY" 
          ? deliveryAddress
          : null,
        deliveryReference: orderType === "DELIVERY" ? deliveryReference : null,
        deliveryObservation: orderType === "DELIVERY" ? deliveryReference : null,
        deliveryPhone: orderType === "DELIVERY" || orderType === "TAKEOUT" ? deliveryPhone.trim() : null,
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

  // Las categorias y la informacion del local aparecen al bajar, como en la landing
  const pageRef = useRef<HTMLDivElement>(null);
  useReveal(pageRef, `${loading}-${categories.length}`);

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

  // Horario por dias: abierto o cerrado ahora (hora de Ecuador)
  const weeklyHours = parseWeeklyHours(restaurant.openingHours);
  const openStatus = weeklyHours ? getOpenStatus(weeklyHours) : null;
  const closedNow = !!openStatus && !openStatus.isOpen && orderType !== "DINE_IN";

  // Contenido del carrito: en computadora va al costado, en celular dentro de la hoja deslizable
  const cartPanel = (
    <>
          <div className="glass-card pc-cart">
            <div className="pc-cart-head">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShoppingCart size={20} />
                <h2 className="pc-cart-title">Tu pedido</h2>
                {cart.length > 0 && (
                  <span className="pc-cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                )}
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

            {reorderNotice && (
              <div
                role="status"
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(30, 143, 78, 0.08)",
                  border: "1px solid rgba(30, 143, 78, 0.25)",
                  fontSize: "13px",
                  lineHeight: 1.45,
                  color: "var(--text-primary)",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>{reorderNotice}</span>
                <button
                  type="button"
                  onClick={() => setReorderNotice(null)}
                  aria-label="Cerrar aviso"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--text-secondary)", padding: 0 }}
                >
                  ×
                </button>
              </div>
            )}
            {cart.length === 0 ? (
              <EmptyState size={56} title="¿Qué se te antoja hoy?" message="Tu carrito está vacío. Toca un plato del menú para agregarlo." />
            ) : (
              <form onSubmit={handleCheckout}>
                {/* Cart Items List */}
                <ul className="pc-cart-items">
                  {cart.map((item) => (
                    <li key={item.variantId} className="pc-cart-item">
                      <div className="pc-cart-item-top">
                        <div style={{ minWidth: 0 }}>
                          <div className="pc-cart-item-name">{item.itemName}</div>
                          <div className="pc-cart-item-variant">{item.name} · ${item.price.toFixed(2)} c/u</div>
                        </div>
                        <button
                          type="button"
                          className="pc-cart-remove"
                          onClick={() => removeFromCart(item.variantId)}
                          aria-label={`Quitar ${item.itemName} ${item.name} del pedido`}
                          title="Quitar del pedido"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="pc-cart-item-bottom">
                        <div className="pc-stepper" role="group" aria-label={`Cantidad de ${item.itemName}`}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, -1)}
                            aria-label={item.quantity === 1 ? `Quitar ${item.itemName}` : `Uno menos de ${item.itemName}`}
                          >
                            {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                          </button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, 1)}
                            aria-label={`Uno más de ${item.itemName}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <strong className="pc-cart-item-total">${(item.price * item.quantity).toFixed(2)}</strong>
                      </div>
                      <input
                        type="text"
                        className="pc-cart-note"
                        maxLength={120}
                        value={item.comments || ""}
                        onChange={(e) => updateItemNote(item.variantId, e.target.value)}
                        placeholder="Nota para cocina (opcional): sin cebolla, bien cocido…"
                        aria-label={`Nota para cocina de ${item.itemName}`}
                      />
                    </li>
                  ))}
                </ul>
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
                  <label htmlFor="pc-customer-name">{orderType === "TAKEOUT" ? "¿Quién retira el pedido?" : orderType === "DELIVERY" ? "¿Quién lo recibe?" : "Tu nombre"}</label>
                  <input id="pc-customer-name" type="text" className="input-field" required maxLength={80} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ej: Juan Pérez" />
                </div>

                {/* Order Type Toggle */}
                {activeTableId ? (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "rgba(30, 143, 78, 0.05)",
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
                    backgroundColor: "color-mix(in srgb, var(--brand-red) 5%, transparent)",
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
                            <span style={{ backgroundColor: "color-mix(in srgb, var(--brand-red) 10%, transparent)", color: "var(--brand-red)", padding: "2px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: "800" }}>
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

                    {orderType === "TAKEOUT" && (
                      <div className="input-group">
                        <label htmlFor="pc-pickup-phone">Teléfono para avisarte</label>
                        <input id="pc-pickup-phone" type="tel" inputMode="tel" className="input-field" required value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} placeholder="Ej: 0998765432" />
                      </div>
                    )}

                    <div className="input-group">
                      <label htmlFor="pc-order-note">Observaciones del pedido (opcional)</label>
                      <textarea
                        id="pc-order-note"
                        className="input-field pc-order-note"
                        rows={2}
                        maxLength={180}
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        placeholder={orderType === "DINE_IN" ? "Ej: traer los platos juntos, una silla para bebé" : orderType === "TAKEOUT" ? "Ej: paso en 20 minutos, con cubiertos" : "Ej: tocar el timbre, sin cubiertos"}
                      />
                    </div>

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
                            disabled={!CARD_PAYMENTS_ENABLED}
                            title={CARD_PAYMENTS_ENABLED ? undefined : "El pago con tarjeta estará disponible pronto"}
                            onClick={() => {
                              setPaymentMethod("CARD");
                              setPaymentReceipt("");
                              setPayphoneTransactionId("");
                            }}
                            style={{ padding: "8px 4px", fontSize: "0.85rem", opacity: CARD_PAYMENTS_ENABLED ? 1 : 0.5, cursor: CARD_PAYMENTS_ENABLED ? "pointer" : "not-allowed" }}
                          >
                            {CARD_PAYMENTS_ENABLED ? "Tarjeta" : "Tarjeta (pronto)"}
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
                                backgroundColor: "rgba(30, 143, 78, 0.05)",
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
                                style={{ width: "100%", padding: "10px", backgroundColor: "var(--brand-orange)", borderColor: "var(--brand-orange)" }}
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
                      <div style={{ background: "color-mix(in srgb, var(--brand-red) 10%, transparent)", border: "1px solid var(--accent-primary)", padding: "15px", borderRadius: "var(--radius-md)", display: "flex", gap: "12px", color: "var(--text-primary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                        <AlertCircle size={24} style={{ flexShrink: 0, color: "var(--accent-primary)" }} />
                        <p><strong>Pedidos QR Desactivados:</strong> El restaurante no tiene activo el autopendiente desde mesas. Por favor contacta a un mesero para realizar tu orden.</p>
                      </div>
                    ) : (
                      <>
                        {closedNow && (
                          <p role="status" style={{ margin: "0 0 10px", padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--brand-red-tint)", color: "var(--brand-red)", fontSize: "13px", fontWeight: 600 }}>
                            {openStatus?.label}. Puedes armar tu pedido y enviarlo cuando abra.
                          </p>
                        )}
                        <button type="submit" className="glow-btn" style={{ width: "100%" }} disabled={submitting || closedNow}>
                          {submitting ? "Procesando..." : closedNow ? "Restaurante cerrado" : "Confirmar Pedido"}
                        </button>
                      </>
                    )}
                  </>
                )}
              </form>
            )}
          </div>

          {/* Chef animado (como en la landing): acompana el menu mientras se baja */}
          {!isMobile && (
            <div className="pc-chef" aria-hidden="true">
              <div className="pc-chef-art">
                <ChefIllustration />
              </div>
              <p className="pc-chef-title">Hecho al momento</p>
              <p className="pc-chef-text">Tu pedido se cocina cuando lo pides, no antes. Elige tranquilo.</p>
            </div>
          )}
    </>
  );

  // Informacion del local y mapa: banda negra debajo del menu (web y celular)
  const localInfo = (
    <section className="pc-visit" aria-label="Información del local" data-reveal>
      <div className="pc-visit-inner">
              {/* Informacion del local en tarjeta negra: el mapa resalta */}
              <div className="pc-info">
                <h3 className="pc-info-title">
                  <MapPin size={18} /> Información del local
                </h3>

                {restaurant.address && (
                  <div className="pc-info-row">
                    <span className="pc-info-ico"><MapPin size={16} /></span>
                    <div className="pc-info-text">
                      <span className="pc-info-label">Dirección</span>
                      <span className="pc-info-value">{restaurant.address}</span>
                    </div>
                  </div>
                )}

                {restaurant.phone && (
                  <div className="pc-info-row">
                    <span className="pc-info-ico"><Phone size={16} /></span>
                    <div className="pc-info-text">
                      <span className="pc-info-label">Teléfono</span>
                      <a className="pc-info-value pc-info-link" href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
                    </div>
                  </div>
                )}

                {restaurant.wifiSsid && (
                  <div className="pc-info-row">
                    <span className="pc-info-ico"><Wifi size={16} /></span>
                    <div className="pc-info-text">
                      <span className="pc-info-label">Wi-Fi de cortesía</span>
                      <span className="pc-info-value">
                        Red: <strong>{restaurant.wifiSsid}</strong>
                        {restaurant.wifiPassword && (
                          <span className="pc-info-muted"> • Clave: <code className="pc-info-code">{restaurant.wifiPassword}</code></span>
                        )}
                      </span>
                      {restaurant.wifiPassword && (
                        <div className="pc-info-qr">
                          <WifiQR ssid={restaurant.wifiSsid} password={restaurant.wifiPassword} size={120} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {restaurant.openingHours && (
                  <div className="pc-info-row">
                    <span className="pc-info-ico"><Clock size={16} /></span>
                    <div className="pc-info-text">
                      <span className="pc-info-label">Horario de atención</span>
                      {weeklyHours ? (
                        <>
                          <span className={`pc-info-status ${openStatus?.isOpen ? "is-open" : "is-closed"}`}>
                            {openStatus?.label}
                          </span>
                          {describeWeek(weeklyHours).map((line) => (
                            <span key={line} className="pc-info-value">{line}</span>
                          ))}
                        </>
                      ) : (
                        <span className="pc-info-value">{restaurant.openingHours}</span>
                      )}
                    </div>
                  </div>
                )}

                {restaurant.reference && (
                  <div className="pc-info-ref">
                    <span className="pc-info-label">Referencia</span>
                    <p>{restaurant.reference}</p>
                  </div>
                )}


                <button type="button" className="pc-info-btn pc-info-btn--ghost" onClick={() => setSupportModalOpen(true)}>
                  <HelpCircle size={16} />
                  ¿Necesitas ayuda? Soporte GoEats
                </button>
              </div>
                {(() => {
                  const hasCoords = Boolean(restaurant.mapLatitude && restaurant.mapLongitude);
                  // Las coordenadas son las que usa el reparto: mandan sobre el mapa pegado a mano
                  const embedUrl = hasCoords
                    ? `https://maps.google.com/maps?q=${restaurant.mapLatitude},${restaurant.mapLongitude}&z=16&output=embed`
                    : getMapEmbedUrl(restaurant.mapIframe);
                  const directMapUrl = restaurant.mapIframe && restaurant.mapIframe.startsWith("https://")
                    ? restaurant.mapIframe
                    : hasCoords
                      ? `https://www.google.com/maps/search/?api=1&query=${restaurant.mapLatitude},${restaurant.mapLongitude}`
                      : restaurant.address
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`
                        : null;

                  if (!embedUrl && !directMapUrl) return null;

                  return (
                    <div className="pc-map">
                      {embedUrl && (
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="220"
                          allowFullScreen
                          loading="lazy"
                          title="Ubicación del local"
                        />
                      )}
                      <div className="pc-map-foot">
                        <div style={{ minWidth: 0 }}>
                          <span className="pc-map-label">Cómo llegar</span>
                          {restaurant.address && <p className="pc-map-address">{restaurant.address}</p>}
                        </div>
                        {directMapUrl && (
                          <a href={directMapUrl} target="_blank" rel="noopener noreferrer" className="pc-map-btn">
                            <MapPin size={15} />
                            Abrir mapa
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
      </div>
    </section>
  );

  return (
    <div className="pc-page" ref={pageRef} style={{ minHeight: "100vh" }}>
      {/* Barra superior: crema translucida y al ancho del contenido */}
      <nav className="pc-nav" style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        padding: isMobile ? "10px 16px" : "12px max(20px, calc((100% - 1200px) / 2))",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "20px", flex: 1 }}>
          <button
            type="button"
            className="pc-back"
            onClick={() => navigate("/restaurants")}
            aria-label="Volver a los restaurantes"
          >
            <ArrowLeft size={16} />
            {!isMobile && <span>Volver</span>}
          </button>

          <BrandLogo size={isMobile ? 26 : 32} onClick={() => navigate("/restaurants")} />
        </div>

        <div style={{ display: "flex", gap: isMobile ? "6px" : "12px", alignItems: "center" }}>
          {!isMobile && (
            <Link to="/plus" style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "var(--brand-black)",
              padding: "8px 16px",
              borderRadius: "30px",
              backgroundColor: "var(--brand-yellow)",
              border: "none",
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
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand-black)" }}>{user.name}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{user.role}</div>
                </div>
              )}

              {user.role === "CUSTOMER" && (
                <Link to="/customer/dashboard" style={{
                  fontSize: isMobile ? "12px" : "13px",
                  fontWeight: "600",
                  color: "var(--brand-red)",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid var(--brand-red)",
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
                  color: "var(--brand-red)",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid var(--brand-red)",
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
                  color: "var(--brand-red)",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid var(--brand-red)",
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
                  color: "var(--brand-red)",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "30px",
                  border: "1px solid var(--brand-red)",
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
                  backgroundColor: "color-mix(in srgb, var(--brand-red) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--brand-red) 20%, transparent)",
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
                backgroundColor: "var(--brand-black)",
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

      {/* Portada del restaurante: foto redondeada y datos del local */}
      <header className="pc-hero">
        <div
          className="pc-hero-cover"
          style={restaurant.coverImage ? { backgroundImage: `url("${restaurant.coverImage}")` } : undefined}
        />
        <div className="pc-hero-body">
          <div className="pc-hero-logo">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                onError={(e) => {
                  e.currentTarget.src = "/logos/prueba.svg";
                }}
              />
            ) : (
              <span>{restaurant.name[0].toUpperCase()}</span>
            )}
          </div>

          <div className="pc-hero-info">
            <h1 className="pc-hero-name">{restaurant.name}</h1>
            {restaurant.description && <p className="pc-hero-desc">{restaurant.description}</p>}
            <div className="pc-hero-chips">
              <span className="pc-chip pc-chip--rating">
                <StarAverage average={restaurant.ratingAverage} count={restaurant.ratingCount} />
              </span>
              {openStatus && (
                <span className={`pc-chip ${openStatus.isOpen ? "pc-chip--open" : "pc-chip--closed"}`}>
                  <Clock size={14} /> {openStatus.isOpen ? "Abierto" : "Cerrado"}
                </span>
              )}
              {restaurant.address && (
                <span className="pc-chip pc-chip--address">
                  <MapPin size={14} /> {restaurant.address}
                </span>
              )}
              {restaurant.phone && (
                <a className="pc-chip" href={`tel:${restaurant.phone}`}>
                  <Phone size={14} /> {restaurant.phone}
                </a>
              )}
              {restaurant.reservationsEnabled && !activeTableId && (
                <button
                  type="button"
                  className="pc-chip pc-chip--action"
                  onClick={() => (isAuthenticated && user?.role === "CUSTOMER" ? setReserveOpen(true) : navigate(loginPath))}
                >
                  Reservar mesa
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
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
      <div className="mobile-column-stack pc-main" style={{ maxWidth: "1200px", margin: "28px auto 40px", padding: "0 20px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "32px" }}>
        
        {/* Menu Catalog Section */}
        <main>
          {/* Bar de Servicio en Mesa (Salón QR) */}
          {orderType === "DINE_IN" && (
            <div style={{
              background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-orange) 8%, transparent), rgba(30, 143, 78, 0.08))",
              border: "1px solid color-mix(in srgb, var(--brand-orange) 30%, transparent)",
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
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "var(--brand-orange)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.4rem" }}>
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
                    background: "var(--brand-orange)",
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
                    boxShadow: "0 2px 8px color-mix(in srgb, var(--brand-orange) 30%, transparent)",
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
                    background: "#1e8f4e",
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
              background: "rgba(30, 143, 78, 0.15)",
              border: "1px solid #1e8f4e",
              color: "#1e8f4e",
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
                      {systemIconForEmoji("🛵")} {activeOrder?.status === "DELIVERED" ? "Pedido entregado con éxito" : activeOrder?.status === "CANCELLED" ? "Pedido cancelado" : "Pedido a Domicilio en Curso"}
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
                    backgroundColor: activeOrder?.status === "DELIVERED" ? "rgba(30, 143, 78, 0.15)" : activeOrder?.status === "DELIVERING" ? "var(--brand-black)" : "color-mix(in srgb, var(--brand-orange) 15%, transparent)",
                    color: activeOrder?.status === "DELIVERED" ? "#1e8f4e" : activeOrder?.status === "DELIVERING" ? "var(--brand-yellow)" : "var(--brand-orange)"
                  }}>
                    {activeOrder?.status === "DELIVERED" ? "✓ ENTREGADO" : activeOrder?.status === "DELIVERING" ? "EN CAMINO" : activeOrder?.status === "READY" ? "EMPACADO" : "EN PREPARACIÓN"}
                  </div>
                </div>

                {/* PIN DE ENTREGA DESTACADO */}
                {activeOrder?.deliveryPin && activeOrder?.status !== "DELIVERED" && activeOrder?.status !== "CANCELLED" && (
                  <div style={{
                    background: "#fdf8ee",
                    border: "2px solid var(--brand-black)",
                    borderRadius: "14px",
                    padding: "20px",
                    margin: "20px 0",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--brand-black)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      {systemIconForEmoji("🔑")} CÓDIGO DE ENTREGA
                    </div>
                    <div style={{ fontSize: "3.2rem", fontWeight: "900", letterSpacing: "12px", color: "var(--brand-black)", margin: "10px 0", fontFamily: "monospace" }}>
                      {activeOrder.deliveryPin}
                    </div>
                    <p style={{ margin: 0, fontSize: "1rem", color: "#333333", lineHeight: 1.5 }}>
                      <strong>Muéstrale este código al motorizado cuando te entregue el pedido.</strong> Sin el código no puede cerrar la entrega. También está en "Mis pedidos".
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
                        background: step.active ? "#1e8f4e" : "var(--brand-cream)",
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
                  <button className="secondary-btn" onClick={() => navigate("/restaurants")} style={{ padding: "12px 24px" }}>
                    Ver más restaurantes
                  </button>
                  <button className="glow-btn" onClick={() => navigate("/customer/dashboard")} style={{ padding: "12px 24px" }}>
                    Ver en Mis pedidos
                  </button>
                </div>
              </div>
            ) : (
              /* CONFIRMACIÓN EN MESA (DINE-IN QR) */
              <div className="glass-card" style={{ padding: "40px", textAlign: "center", background: "rgba(30, 143, 78, 0.05)", borderColor: "var(--success)" }}>
                <Check size={48} color="var(--success)" style={{ marginBottom: "15px" }} />
                <h2 className="brand-accent-text" style={{ marginBottom: "10px" }}>¡Comanda Enviada a Cocina!</h2>
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
            <div className="pc-menu">
              {/* Atajos a cada categoria de la carta */}
              {categories.length > 1 && (
                <nav className="cat-chips" aria-label="Categorías de la carta">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      {cat.name}
                    </button>
                  ))}
                </nav>
              )}
              {categories.map((cat, catIndex) => (
                <section key={cat.id} id={`cat-${cat.id}`} className={`cat-section pc-band pc-band--${["sun", "white", "peach", "blush"][catIndex % 4]}`} data-reveal>
                  <h2 className="brand-marker pc-band-title">{cat.name}</h2>
                  {cat.description && <p className="pc-band-desc">{cat.description}</p>}

                  <div className="pc-dishes">
                    {cat.items.map((item) => (
                      <article key={item.id} className="pc-dish">
                        <div className="pc-dish-text">
                          <h3 className="pc-dish-name">{item.name}</h3>
                          {item.description && <p className="pc-dish-desc">{item.description}</p>}

                          {/* Presentaciones y precios: cada una se agrega al pedido */}
                          <div className="pc-dish-prices">
                            {item.variants.map((v) => (
                              <button key={v.id} className="price-pill" onClick={() => addToCart(v, item)} aria-label={`Agregar ${item.name} ${v.name} al pedido`}>
                                <span className="price-pill-plus"><Plus size={14} color="#ffffff" strokeWidth={3} /></span>
                                <span>{v.name}: <strong>${v.price.toFixed(2)}</strong></span>
                                {v.regularPrice && (
                                  <span data-testid="catalog-promo" style={{ fontSize: "0.85rem" }}>
                                    <s style={{ opacity: 0.7 }}>${v.regularPrice.toFixed(2)}</s>{" "}
                                    <span className="pc-promo">Promo</span>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.image ? (
                          <img className="pc-dish-img" src={item.image} alt={item.name} loading="lazy" />
                        ) : (
                          <div className="pc-dish-img pc-dish-img--empty" aria-hidden="true">
                            <Utensils size={28} />
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>

        {/* Sidebar Cart & Info Section */}
        {/* Sidebar Cart & Info Section */}
        {isMobile ? (
          // En celular el carrito es una hoja que sube desde abajo y se cierra deslizando hacia abajo
          <Drawer.Root open={isCartMobileOpen} onOpenChange={setIsCartMobileOpen}>
            <Drawer.Portal>
              <Drawer.Overlay className="sheet-overlay" />
              <Drawer.Content className="sheet-content" aria-describedby={undefined}>
                <div className="sheet-handle" aria-hidden="true" />
                <Drawer.Title className="sr-only">Tu carrito</Drawer.Title>
                <div className="sheet-body">{cartPanel}</div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <aside className="mobile-cart-aside pc-aside">
            {cartPanel}
          </aside>
        )}

      </div>

      {localInfo}

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
              color: "var(--brand-black)",
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
                        color: "var(--brand-black)"
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
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--brand-orange)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" }}>P</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, color: "var(--brand-orange)" }}>Payphone: demostración, sin cobro real</h3>
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
                style={{ width: "100%", padding: "12px", backgroundColor: "var(--brand-orange)", borderColor: "var(--brand-orange)", marginTop: "10px" }}
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
              boxShadow: "0 10px 25px color-mix(in srgb, var(--brand-red) 30%, transparent)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "var(--radius-xl)"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              Ver mi pedido
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
