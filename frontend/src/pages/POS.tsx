import { appConfirm } from "../components/AppDialogs";
import React, { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShoppingBag,
  Utensils,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Search,
  CheckCircle2,
  Truck,
  Sliders,
  X,
  Store,
  Bell,
  Volume2,
  VolumeX,
  LayoutGrid
} from "lucide-react";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";
import { escapeHtml } from "../utils/html";


export interface WaiterNotification {
  id: string;
  type: "ALMOST_READY" | "ALL_READY" | "CALL_WAITER";
  orderId: number;
  tableId?: number | null;
  tableNumber?: string;
  tableName: string;
  mozoId?: number | null;
  readyItems: number;
  totalItems: number;
  itemJustReady?: string;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

interface Table {
  id: number;
  number: string;
  capacity: number;
  status: "FREE" | "OCCUPIED";
}

interface DiningArea {
  id: number;
  name: string;
  tables: Table[];
}

interface MenuItemVariant {
  id: number;
  name: string;
  price: number;
  regularPrice?: number | null; // normal price while the dish is on promotion
  stockLimit: number | null;
  options: string | null;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  variants: MenuItemVariant[];
}

interface MenuCategory {
  id: number;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  variantId: number;
  name: string;
  menuItemName: string;
  price: number;
  quantity: number;
  comments: string;
}

interface Client {
  id: number;
  name: string;
  identification: string;
  typeId: string;
  address: string;
  email: string;
  phone: string;
}

export const POS: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const isLoadingOrderRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view") || "menu";

  const [diningAreas, setDiningAreas] = useState<DiningArea[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEOUT" | "DELIVERY">("DINE_IN");
  const [customerName, setCustomerName] = useState("Varios");
  const [orderComments, setOrderComments] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"menu" | "tables" | "cart">("menu");

  // Sync floating elements when cart pill is visible on mobile
  useEffect(() => {
    if (cart.length > 0 && activeMobileTab !== "cart") {
      document.body.classList.add("has-mobile-cart-pill");
    } else {
      document.body.classList.remove("has-mobile-cart-pill");
    }
    return () => {
      document.body.classList.remove("has-mobile-cart-pill");
    };
  }, [cart.length, activeMobileTab]);

  // Search input state
  const [searchTerm, setSearchTerm] = useState("");

  // External (Delivery/Takeout) Orders State
  const [externalOrders, setExternalOrders] = useState<any[]>([]);
  const [activeOrderObj, setActiveOrderObj] = useState<any>(null);

  // Active cashier session check
  const [hasCashSession, setHasCashSession] = useState(false);
  const [registers, setRegisters] = useState<any[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState("");
  const [openAmount, setOpenAmount] = useState("0");

  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("01"); // 01 = Cash, 20 = Card
  const [discount, setDiscount] = useState("0.00");
  // Optional tip for the waiter: charged with the bill but kept out of the sale and the invoice
  const [tip, setTip] = useState("0.00");
  const tipValue = orderType === "DELIVERY" ? 0 : Math.max(0, Math.round((parseFloat(tip) || 0) * 100) / 100);
  // Off by default: the SRI connection is not set up yet, so the cashier turns it on only when the restaurant has it
  const [fiscalEmit, setFiscalEmit] = useState(false);
  // Blocks a second click while the order is being sent, so it is not saved twice
  const [placingOrder, setPlacingOrder] = useState(false);
  const placingOrderRef = useRef(false);

  // Client Search/Register State
  const [clientSearchIdent, setClientSearchIdent] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientTypeId, setNewClientTypeId] = useState("05"); // Cédula default
  const [newClientIdent, setNewClientIdent] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [orderCustomer, setOrderCustomer] = useState<{
    name: string;
    typeId: string;
    identification: string;
    email: string;
    phone: string;
    address: string;
  } | null>(null);
  const [showTransferReceiptModal, setShowTransferReceiptModal] = useState(false);

  // Kitchen Notification & Sound State for Waiters
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [incomingDeliveryOrder, setIncomingDeliveryOrder] = useState<any>(null);
  const [tableReadinessMap, setTableReadinessMap] = useState<Record<number, {
    status: "ALMOST_READY" | "ALL_READY" | "CALL_WAITER";
    readyItems: number;
    totalItems: number;
    timestamp: string;
  }>>({});

  const playKitchenNotificationSound = (type: "ALMOST_READY" | "ALL_READY" | "CALL_WAITER") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (type === "ALMOST_READY") {
        // Gentle double-ding (E5 -> G#5) for "Casi Listo"
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(659.25, now); // E5
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(830.61, now + 0.16); // G#5
        gain2.gain.setValueAtTime(0.25, now + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.16);
        osc2.stop(now + 0.5);
      } else {
        // High-clarity restaurant service bell chime (C6 -> G5 -> E6) for ALL_READY / CALL_WAITER
        const notes = [
          { freq: 1046.50, start: 0, dur: 0.25 },   // C6
          { freq: 783.99, start: 0.18, dur: 0.25 },  // G5
          { freq: 1318.51, start: 0.36, dur: 0.6 }   // E6
        ];
        notes.forEach(note => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.freq, now + note.start);
          gain.gain.setValueAtTime(0.3, now + note.start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + note.start);
          osc.stop(now + note.start + note.dur);
        });
      }
    } catch (e) {
      console.warn("Could not play notification sound:", e);
    }
  };

  const handleSelectTableById = (tableId: number) => {
    for (const area of diningAreas) {
      const tbl = area.tables?.find(t => t.id === tableId);
      if (tbl) {
        handleSelectTable(tbl);
        return;
      }
    }
  };

  const loadExternalOrders = async () => {
    try {
      const orderRes = await apiRequest("/orders");
      const filtered = orderRes.orders.filter(
        (o: any) => (o.type === "DELIVERY" || o.type === "TAKEOUT") && o.status !== "DELIVERED" && o.status !== "CANCELLED"
      );
      setExternalOrders(filtered);
    } catch (error) {
      console.error("Error loading external orders:", error);
    }
  };

  const handleOpenCashSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegisterId) {
      alert("Por favor selecciona una caja registradora");
      return;
    }
    try {
      const res = await apiRequest("/cash/sessions/open", {
        method: "POST",
        body: JSON.stringify({
          cashRegisterId: parseInt(selectedRegisterId, 10),
          openAmount: parseFloat(openAmount) || 0,
        }),
      });
      if (res.success) {
        alert(res.message || "Sesión de caja abierta con éxito");
        setHasCashSession(true);
        loadInitialData();
      }
    } catch (err: any) {
      alert(err.message || "Error al abrir la sesión de caja");
    }
  };

  const loadInitialData = async () => {
    try {
      // Check active cash session
      const cashRes = await apiRequest("/cash/sessions/active");
      const activeSession = cashRes.session;
      setHasCashSession(!!activeSession);

      if (!activeSession) {
        // Cash register is closed, fetch available registers to show in open cash modal
        const registersRes = await apiRequest("/cash/registers");
        if (registersRes.success) {
          const list = registersRes.registers || [];
          setRegisters(list);
          // Find register assigned to this user, if any
          const assigned = list.find((r: any) => r.assignedUserId === user?.id && r.isActive);
          if (assigned) {
            setSelectedRegisterId(String(assigned.id));
          } else if (list.length > 0) {
            // Select first active register
            const firstActive = list.find((r: any) => r.isActive);
            if (firstActive) {
              setSelectedRegisterId(String(firstActive.id));
            }
          }
        }
      }

      // Load tables & dining areas
      const tableRes = await apiRequest("/tables/dining-areas");
      setDiningAreas(tableRes.diningAreas || []);

      // Load menus
      const menuRes = await apiRequest("/menu/categories");
      setMenuCategories(menuRes.categories || []);
      if (menuRes.categories && menuRes.categories.length > 0) {
        setSelectedCategory(menuRes.categories[0].id);
      }

      setDocumentTypes([
        { id: 1, name: "FACTURA", code: "01" },
        { id: 2, name: "NOTA DE VENTA", code: "02" },
        { id: 4, name: "TICKET", code: "09" },
      ]);
      setSelectedDocTypeId("1");

      // Load external orders
      loadExternalOrders();
    } catch (error) {
      console.error("Error loading POS data:", error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (user?.role === "CAJERO" && (!viewParam || viewParam === "menu")) {
      setSearchParams({ view: "tables" });
    }
  }, [user, viewParam]);

  useEffect(() => {
    const tableIdParam = searchParams.get("tableId") || searchParams.get("table");
    const orderIdParam = searchParams.get("orderId") || searchParams.get("order");

    if (diningAreas.length > 0 && tableIdParam) {
      const tid = parseInt(tableIdParam, 10);
      let foundTable = null;
      for (const area of diningAreas) {
        const tbl = area.tables?.find((t: any) => t.id === tid);
        if (tbl) {
          foundTable = tbl;
          break;
        }
      }
      if (foundTable) {
        handleSelectTable(foundTable);
      }
    } else if (orderIdParam) {
      const oid = parseInt(orderIdParam, 10);
      const fetchAndLoadOrder = async () => {
        try {
          isLoadingOrderRef.current = true;
          const res = await apiRequest(`/orders/${oid}`);
          if (res.success && res.order) {
            const order = res.order;
            setActiveOrderId(order.id);
            setCustomerName(order.customerName);
            setOrderComments(order.comments || "");
            setOrderType(order.type);
            const formattedCart = order.items.map((item: any) => ({
              variantId: item.variantId,
              name: item.variant.name,
              menuItemName: item.variant.menuItem.name,
              price: item.price,
              quantity: item.quantity,
              comments: item.comments || ""
            }));
            setCart(formattedCart);
            if (order.tableId && diningAreas.length > 0) {
              for (const area of diningAreas) {
                const tbl = area.tables?.find((t: any) => t.id === order.tableId);
                if (tbl) {
                  setSelectedTable(tbl);
                  break;
                }
              }
            }
            // Trigger checkout modal if parameter is passed
            if (searchParams.get("checkout") === "true") {
              openCheckoutModal(order.id);
            }
          }
          isLoadingOrderRef.current = false;
        } catch (err) {
          console.error("Error loading order from search param:", err);
          isLoadingOrderRef.current = false;
        }
      };
      fetchAndLoadOrder();
    }
  }, [diningAreas, searchParams]);

  // Update active order object details
  useEffect(() => {
    if (activeOrderId) {
      const extOrder = externalOrders.find(o => o.id === activeOrderId);
      if (extOrder) {
        setActiveOrderObj(extOrder);
      } else {
        setActiveOrderObj(null);
      }
    } else {
      setActiveOrderObj(null);
    }
  }, [activeOrderId, externalOrders]);

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    
    // When order is updated or table status changes, reload dining areas and external orders
    const handleTableChange = () => {
      apiRequest("/tables/dining-areas").then(res => {
        const areas = res.diningAreas || [];
        setDiningAreas(areas);
        // Clear readiness for tables that have become FREE
        setTableReadinessMap(prev => {
          const updated = { ...prev };
          areas.forEach((a: any) => {
            a.tables?.forEach((t: any) => {
              if (t.status === "FREE" && updated[t.id]) {
                delete updated[t.id];
              }
            });
          });
          return updated;
        });
      });
      loadExternalOrders();
    };

    const handleCashSessionChange = () => {
      loadInitialData();
    };

    const handleWaiterNotification = (notif: any) => {
      console.log("[POS] Received waiter notification:", notif);
      const newNotif: WaiterNotification = {
        id: `${Date.now()}-${Math.random()}`,
        type: notif.type,
        orderId: notif.orderId,
        tableId: notif.tableId,
        tableNumber: notif.tableNumber,
        tableName: notif.tableName,
        mozoId: notif.mozoId,
        readyItems: notif.readyItems,
        totalItems: notif.totalItems,
        itemJustReady: notif.itemJustReady,
        title: notif.title,
        message: notif.message,
        timestamp: notif.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
      setUnreadNotifsCount((prev) => prev + 1);

      // Note: Sound, push notifications and top toast are handled globally by KitchenNotificationManager
      if (notif.tableId) {
        setTableReadinessMap((prev) => ({
          ...prev,
          [notif.tableId]: {
            status: notif.type,
            readyItems: notif.readyItems,
            totalItems: notif.totalItems,
            timestamp: notif.timestamp || new Date().toISOString(),
          },
        }));
      }

      playKitchenNotificationSound(notif.type);
      apiRequest("/tables/dining-areas").then((res) => setDiningAreas(res.diningAreas || []));
    };

    const handleNewOrder = (order: any) => {
      handleTableChange();
      if (order && (order.type === "DELIVERY" || order.type === "TAKEOUT")) {
        setIncomingDeliveryOrder(order);
        playKitchenNotificationSound("CALL_WAITER");
      }
    };

    socket.on("order-status-updated", handleTableChange);
    socket.on("new-order", handleNewOrder);
    socket.on("order-cancelled", handleTableChange);
    socket.on("cash-session-changed", handleCashSessionChange);
    socket.on("waiter-order-notification", handleWaiterNotification);

    return () => {
      socket.off("order-status-updated", handleTableChange);
      socket.off("new-order", handleNewOrder);
      socket.off("order-cancelled", handleTableChange);
      socket.off("cash-session-changed", handleCashSessionChange);
      socket.off("waiter-order-notification", handleWaiterNotification);
    };
  }, [socket]);

  const handleSelectExternalOrder = (order: any) => {
    setSelectedTable(null); // Deselect table
    setActiveOrderId(order.id);
    setCustomerName(order.customerName);
    setOrderType(order.type);
    setOrderComments(order.comments || "");
    setDeliveryAddress(order.deliveryAddress || "");
    setDeliveryReference(order.deliveryObservation || "");
    setDeliveryPhone(order.deliveryPhone || "");
    
    const formattedCart = order.items.map((item: any) => ({
      variantId: item.variantId,
      name: item.variant.name,
      menuItemName: item.variant.menuItem.name,
      price: item.price,
      quantity: item.quantity,
      comments: item.comments || ""
    }));
    setCart(formattedCart);
    
    if (user?.role === "CAJERO") {
      setSearchParams({ view: "external" });
    } else {
      setSearchParams({}); // Return to menu view
    }
  };

  // Load existing table order
  const handleSelectTable = async (table: Table) => {
    isLoadingOrderRef.current = true;
    setSelectedTable(table);
    setCart([]);
    setActiveOrderId(null);
    setOrderComments("");
    setCustomerName("Varios");
    setOrderType("DINE_IN");

    if (table.status === "OCCUPIED") {
      try {
        const orderRes = await apiRequest("/orders");
        const tableOrder = orderRes.orders.find((o: any) => o.tableId === table.id && o.status !== "DELIVERED" && o.status !== "CANCELLED");
        if (tableOrder) {
          setActiveOrderId(tableOrder.id);
          setCustomerName(tableOrder.customerName);
          setOrderComments(tableOrder.comments || "");
          const formattedCart = tableOrder.items.map((item: any) => ({
            variantId: item.variantId,
            name: item.variant.name,
            menuItemName: item.variant.menuItem.name,
            price: item.price,
            quantity: item.quantity,
            comments: item.comments || ""
          }));
          setCart(formattedCart);
        }
      } catch (error) {
        console.error("Error loading table order:", error);
      }
    }
    isLoadingOrderRef.current = false;
    setActiveMobileTab("menu");
    
    if (user?.role === "CAJERO") {
      setSearchParams({ view: "tables" });
    } else {
      setSearchParams({}); // Return to menu view
    }
  };

  const handleAddToCart = (item: MenuItem, variant: MenuItemVariant) => {
    if (orderType === "DINE_IN" && !selectedTable) {
      alert("Por favor, selecciona una mesa antes de agregar productos.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.variantId === variant.id);
      if (existing) {
        return prev.map(i => i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        variantId: variant.id,
        name: variant.name,
        menuItemName: item.name,
        price: variant.price,
        quantity: 1,
        comments: ""
      }];
    });
  };

  const handleUpdateQty = (variantId: number, diff: number) => {
    if (orderType === "DINE_IN" && !selectedTable) {
      alert("Por favor, selecciona una mesa antes de modificar cantidades.");
      return;
    }
    setCart(prev =>
      prev.map(i => {
        if (i.variantId === variantId) {
          const newQty = i.quantity + diff;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (variantId: number) => {
    if (orderType === "DINE_IN" && !selectedTable) {
      alert("Por favor, selecciona una mesa antes de quitar productos.");
      return;
    }
    setCart(prev => prev.filter(i => i.variantId !== variantId));
  };



  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const disc = parseFloat(discount) || 0;
    return Math.max(0, sub - disc);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || placingOrderRef.current) return;
    placingOrderRef.current = true;
    setPlacingOrder(true);
    try {
      const body = {
        type: orderType,
        customerName,
        comments: orderComments,
        deliveryAddress: orderType === "DELIVERY"
          ? deliveryAddress
          : undefined,
        deliveryReference: orderType === "DELIVERY" ? deliveryReference : undefined,
        deliveryObservation: orderType === "DELIVERY" ? deliveryReference : undefined,
        deliveryPhone: orderType === "DELIVERY" ? deliveryPhone : undefined,
        tableId: orderType === "DINE_IN" ? selectedTable?.id : undefined,
        items: cart.map(i => ({
          variantId: i.variantId.toString(),
          quantity: i.quantity.toString(),
          comments: i.comments
        }))
      };

      if (activeOrderId) {
        // Update existing order
        await apiRequest(`/orders/${activeOrderId}`, {
          method: "PUT",
          body: JSON.stringify(body)
        });
        alert("Pedido actualizado y enviado a la cocina.");
      } else {
        // Create new order
        await apiRequest("/orders", {
          method: "POST",
          body: JSON.stringify(body)
        });
        alert("Pedido enviado a la cocina con éxito.");
      }

      setCart([]);
      setSelectedTable(null);
      setActiveOrderId(null);
      setDeliveryAddress("");
      setDeliveryReference("");
      setDeliveryPhone("");
      loadInitialData(); // Refresh table layout
    } catch (error: any) {
      alert(error.message || "Error al procesar el pedido");
    } finally {
      placingOrderRef.current = false;
      setPlacingOrder(false);
    }
  };

  const handlePrintComanda = () => {
    if (cart.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes para poder imprimir.");
      return;
    }

    const itemsHtml = cart.map(i => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 6px 0; font-size: 14px;">${i.quantity}x ${escapeHtml(i.menuItemName)} (${escapeHtml(i.name)})</td>
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

    const dateStr = new Date().toLocaleString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda - GoEats</title>
          <style>
            @page { margin: 0; }
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
            <div><strong>Tipo:</strong> ${orderType === "DINE_IN" ? "SERVICIO EN MESA" : orderType === "TAKEOUT" ? "RECOGER EN LOCAL" : "DOMICILIO / DELIVERY"}</div>
            ${selectedTable ? `<div><strong>Mesa:</strong> Mesa ${selectedTable.number}</div>` : ""}
            <div><strong>Cliente:</strong> ${escapeHtml(customerName || "Varios")}</div>
            ${activeOrderId ? `<div><strong>Nro Pedido:</strong> #${activeOrderId}</div>` : ""}
          </div>
          <table class="table-items">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            <span>TOTAL</span>
            <span>$${calculateTotal().toFixed(2)}</span>
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

  // Client search
  const handleSearchClient = async () => {
    const term = clientSearchIdent.trim();
    if (!term) return;
    try {
      const res = await apiRequest("/clients");
      const byName = res.clients.filter((c: any) => (c.name || "").toLowerCase().includes(term.toLowerCase()));
      const client = res.clients.find((c: any) => c.identification === term) || (byName.length === 1 ? byName[0] : null);
      const isNumber = /^\d+$/.test(term);
      if (client) {
        setSelectedClient(client);
        // El buscador muestra al cliente elegido
        setClientSearchIdent(client.identification);
        setShowNewClientForm(false);
      } else if (byName.length > 1) {
        alert(`Hay ${byName.length} clientes con ese nombre: ${byName.slice(0, 5).map((c: any) => c.name).join(", ")}. Busca por cédula para elegir uno.`);
      } else if (!isNumber) {
        alert("No hay un cliente con ese nombre. Busca por cédula o RUC para registrarlo.");
      } else if (orderCustomer && orderCustomer.identification === clientSearchIdent.trim()) {
        // The customer of this order is not yet a billing client of the restaurant: prefill their data
        setNewClientName(orderCustomer.name);
        setNewClientTypeId(orderCustomer.typeId);
        setNewClientIdent(orderCustomer.identification);
        setNewClientEmail(orderCustomer.email);
        setNewClientPhone(orderCustomer.phone);
        setNewClientAddress(orderCustomer.address);
        setShowNewClientForm(true);
        setSelectedClient(null);
      } else {
        alert("Cliente no registrado. Ingrese los datos para crearlo.");
        setNewClientIdent(clientSearchIdent);
        setShowNewClientForm(true);
        setSelectedClient(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Client registration
  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = await apiRequest("/clients", {
        method: "POST",
        body: JSON.stringify({
          name: newClientName,
          typeId: newClientTypeId,
          identification: newClientIdent,
          address: newClientAddress,
          email: newClientEmail,
          phone: newClientPhone
        })
      });
      setSelectedClient(client.client || client);
      setShowNewClientForm(false);
      alert("Cliente creado correctamente.");
    } catch (error: any) {
      alert(error.message || "Error al crear cliente");
    }
  };

  // orderId is passed when the order was just loaded from the URL and activeOrderId is not updated yet
  const openCheckoutModal = (orderId: number | null = activeOrderId) => {
    setSelectedClient(null);
    setShowNewClientForm(false);
    setClientSearchIdent("");
    setOrderCustomer(null);
    // If an app customer placed this order, suggest their ID so the cashier does not retype it
    if (orderId) {
      apiRequest(`/orders/${orderId}/billing-customer`)
        .then((res) => {
          if (res.customer) {
            setOrderCustomer(res.customer);
            setClientSearchIdent(res.customer.identification);
          }
        })
        .catch(() => setOrderCustomer(null));
    }
    setNewClientName("");
    setNewClientIdent("");
    setNewClientAddress("");
    setNewClientEmail("");
    setNewClientPhone("");
    setTip("0.00");
    setShowCheckout(true);
  };

  // Checkout / Payment Process
  const handleCheckout = async () => {
    if (!activeOrderId) {
      alert("Debe guardar/enviar el pedido a cocina antes de facturar.");
      return;
    }

    try {
      if (tipValue > 100) {
        alert("La propina puede ser de $0 a $100.");
        return;
      }
      const totalAmt = Math.round((calculateTotal() + tipValue) * 100) / 100;
      const body = {
        orderId: activeOrderId.toString(),
        docTypeId: selectedDocTypeId,
        paymentMethod,
        paymentCash: paymentMethod === "01" ? totalAmt : 0,
        paymentCard: paymentMethod === "20" ? totalAmt : 0,
        discount: parseFloat(discount) || 0,
        tip: tipValue > 0 ? tipValue : undefined,
        clientId: selectedClient?.id || undefined,
        fiscalEmit
      };

      const res = await apiRequest("/sales", {
        method: "POST",
        body: JSON.stringify(body)
      });

      if (res.fiscal && !res.fiscal.success) {
        alert(`Pago registrado. La factura electrónica no se emitió: ${res.fiscal.error}`);
      } else {
        alert("Pago registrado con éxito.");
      }
      
      setShowCheckout(false);
      setCart([]);
      setSelectedTable(null);
      setActiveOrderId(null);
      loadInitialData(); // Refresh tables
    } catch (error: any) {
      alert(error.message || "Error al procesar el pago");
    }
  };

  const renderNotificationBell = () => (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setShowNotifDrawer(prev => !prev);
          if (!showNotifDrawer) {
            setUnreadNotifsCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }
        }}
        className={unreadNotifsCount > 0 ? "glow-btn" : "secondary-btn"}
        style={{
          padding: "8px 14px",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderRadius: "var(--radius-sm)",
          backgroundColor: unreadNotifsCount > 0 ? "rgba(17, 17, 17, 0.2)" : undefined,
          borderColor: unreadNotifsCount > 0 ? "var(--accent-primary)" : undefined,
          cursor: "pointer"
        }}
        title="Avisos de Cocina"
      >
        <Bell size={16} />
        <span style={{ fontWeight: 600 }}>Cocina</span>
        {unreadNotifsCount > 0 && (
          <span style={{
            backgroundColor: "var(--accent-primary)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "bold",
            padding: "2px 6px",
            borderRadius: "10px",
            lineHeight: 1
          }}>
            {unreadNotifsCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {showNotifDrawer && (
        <div
          className="glass-card animate-fade-in"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "10px",
            width: "360px",
            maxHeight: "480px",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-tertiary)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={16} style={{ color: "var(--accent-primary)" }} />
              <strong style={{ fontSize: "14px" }}>Avisos de Cocina</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                title={soundEnabled ? "Sonido activado (click para silenciar)" : "Sonido silenciado (click para activar)"}
                style={{ background: "none", border: "none", cursor: "pointer", color: soundEnabled ? "var(--success)" : "var(--text-muted)" }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNotifications([]);
                    setUnreadNotifsCount(0);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-muted)" }}
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNotifDrawer(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0", maxHeight: "400px" }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "13px" }}>
                <Bell size={32} style={{ margin: "0 auto 10px auto", opacity: 0.3 }} />
                No hay avisos recientes de cocina.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.tableId) handleSelectTableById(notif.tableId);
                    setShowNotifDrawer(false);
                  }}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-light)",
                    cursor: notif.tableId ? "pointer" : "default",
                    backgroundColor: notif.read ? "transparent" : "rgba(17, 17, 17, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    transition: "background-color 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: notif.type === "ALMOST_READY" ? "rgba(255, 165, 2, 0.15)" : "rgba(46, 213, 115, 0.15)",
                      color: notif.type === "ALMOST_READY" ? "var(--warning)" : "var(--success)"
                    }}>
                      {notif.type === "ALMOST_READY" ? systemTextWithIcons("🟡 Casi Listo") : systemTextWithIcons("🟢 ¡Listo para Servir!")}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-primary)", marginTop: "2px" }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                    {notif.message}
                  </div>
                  {notif.tableId && (
                    <div style={{ fontSize: "13px", color: "var(--accent-primary)", fontWeight: 600, marginTop: "4px" }}>
                      {systemIconForEmoji("👉")} Click para abrir mesa
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="mobile-pos-container"
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "var(--bg-primary)",
        position: "relative"
      }}
    >


      {(!hasCashSession && user?.role !== "MOZO" && user?.role !== "PRODUCCION") ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          textAlign: "center",
          background: "var(--bg-primary)"
        }}>
          <div className="glass-card" style={{
            maxWidth: "450px",
            width: "100%",
            padding: "40px",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-light)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(17, 17, 17, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
              marginBottom: "10px"
            }}>
              <Store size={32} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "var(--text-primary)" }}>
              Apertura de Caja Obligatoria
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Para poder tomar pedidos y utilizar el menú POS, es necesario que abras una sesión de caja registradora.
            </p>

            <form onSubmit={handleOpenCashSession} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px", textAlign: "left" }}>
              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Caja Registradora</label>
                <select
                  value={selectedRegisterId}
                  onChange={(e) => setSelectedRegisterId(e.target.value)}
                  className="input-field"
                  required
                  style={{ width: "100%", outline: "none", marginTop: "5px" }}
                >
                  <option value="">Selecciona una caja...</option>
                  {registers.map(r => {
                    const isBusy = r.sessions && r.sessions.length > 0;
                    return (
                      <option key={r.id} value={r.id} disabled={!r.isActive}>
                        {r.name} {!r.isActive ? " (Inactiva)" : ""} {r.assignedUserId === user?.id ? " (Asignada a ti)" : ""} {isBusy ? ` (Abierta por ${r.sessions[0].user.name} - Se vinculará automáticamente)` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>Monto Inicial de Apertura ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openAmount}
                  onChange={(e) => setOpenAmount(e.target.value)}
                  className="input-field"
                  required
                  placeholder="0.00"
                  style={{ width: "100%", outline: "none", marginTop: "5px" }}
                />
              </div>

              <button
                type="submit"
                className="glow-btn"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  marginTop: "10px",
                  fontWeight: 600
                }}
              >
                Abrir Caja y Continuar
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
      {/* Mobile Segmented Navigation Tab Bar */}
      <div className="mobile-show-flex mobile-pos-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveMobileTab("menu")}
          className={`mobile-pos-nav-tab ${activeMobileTab === "menu" ? "active" : ""}`}
        >
          <Utensils size={15} />
          <span>Carta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("tables")}
          className={`mobile-pos-nav-tab ${activeMobileTab === "tables" ? "active" : ""}`}
        >
          <LayoutGrid size={15} />
          <span>Mesas</span>
          {selectedTable && (
            <span className="mobile-tab-badge">
              M{selectedTable.number}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("cart")}
          className={`mobile-pos-nav-tab ${activeMobileTab === "cart" ? "active" : ""}`}
        >
          <ShoppingBag size={15} />
          <span>Pedido</span>
          {cart.length > 0 && (
            <span className="mobile-tab-badge-cart">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* CENTER: Main POS Workspace (Grid of items / Categories / Active tables) */}
      <div
        className={`pos-main-workspace mobile-full-width ${activeMobileTab === "menu" || activeMobileTab === "tables" ? "" : "mobile-hide"}`}
        style={{
          flex: 1,
          padding: "clamp(12px, 2.5vw, 20px)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
          marginTop: "0px",
          height: "100%"
        }}
      >
        {/* VIEW CONDITIONAL RENDERING */}
        {viewParam === "tables" || activeMobileTab === "tables" ? (
          /* ========================================================================= */
          /* TABLE SERVICES VIEW (Salones y Mesas plano completo)                     */
          /* ========================================================================= */
          <div className="glass-card animate-fade-in" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Utensils size={20} style={{ color: "var(--accent-primary)" }} />
                <h2 style={{ fontSize: "18px", margin: 0 }}>Servicios de Mesa — Salones</h2>
              </div>
              <div>
                {renderNotificationBell()}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              {diningAreas.map(area => (
                <div key={area.id} style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "20px" }}>
                  <h4 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {area.name}
                  </h4>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {area.tables.map(table => {
                      const isSelected = selectedTable?.id === table.id;
                      const isOccupied = table.status === "OCCUPIED";
                      const readiness = tableReadinessMap[table.id];
                      const isAllReady = readiness?.status === "ALL_READY" || readiness?.status === "CALL_WAITER";
                      const isAlmostReady = readiness?.status === "ALMOST_READY";

                      return (
                        <button
                          key={table.id}
                          onClick={() => handleSelectTable(table)}
                          style={{
                            width: "88px",
                            height: "88px",
                            borderRadius: "var(--radius-md)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            position: "relative",
                            transition: "all var(--transition-fast)",
                            backgroundColor: isSelected
                              ? "var(--accent-primary)"
                              : isAllReady
                              ? "rgba(46, 213, 115, 0.2)"
                              : isAlmostReady
                              ? "rgba(255, 165, 2, 0.15)"
                              : isOccupied
                              ? "rgba(17, 17, 17, 0.15)"
                              : "var(--bg-secondary)",
                            border: `2px solid ${
                              isSelected
                                ? "var(--accent-primary)"
                                : isAllReady
                                ? "var(--success)"
                                : isAlmostReady
                                ? "var(--warning)"
                                : isOccupied
                                ? "var(--accent-primary)"
                                : "var(--border-light)"
                            }`,
                            boxShadow: isAllReady
                              ? "0 0 14px rgba(46, 213, 115, 0.5)"
                              : isAlmostReady
                              ? "0 0 10px rgba(255, 165, 2, 0.4)"
                              : "none",
                            color: isSelected ? "#ffffff" : isOccupied ? "var(--accent-primary)" : "var(--text-primary)"
                          }}
                        >
                          {/* Readiness badge */}
                          {isAllReady && (
                            <span style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-8px",
                              backgroundColor: "var(--success)",
                              color: "#fff",
                              fontSize: "13px",
                              fontWeight: "bold",
                              borderRadius: "10px",
                              padding: "2px 6px",
                              boxShadow: "0 0 8px rgba(46, 213, 115, 0.8)",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              zIndex: 2
                            }}>
                              {systemIconForEmoji("🛎️")} ¡Listo!
                            </span>
                          )}
                          {isAlmostReady && (
                            <span style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-8px",
                              backgroundColor: "var(--warning)",
                              color: "#000",
                              fontSize: "13px",
                              fontWeight: "bold",
                              borderRadius: "10px",
                              padding: "2px 6px",
                              boxShadow: "0 0 8px rgba(255, 165, 2, 0.6)",
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              zIndex: 2
                            }}>
                              {systemIconForEmoji("⏳")} {readiness.readyItems}/{readiness.totalItems}
                            </span>
                          )}

                          <span style={{ fontSize: "20px", fontWeight: "bold" }}>{table.number}</span>
                          <span style={{ fontSize: "13px", opacity: 0.7 }}>{table.capacity} personas</span>
                          {isAllReady && (
                            <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: 700, marginTop: "2px" }}>
                              Servir {systemIconForEmoji("🛎️")}
                            </span>
                          )}
                          {isAlmostReady && (
                            <span style={{ fontSize: "13px", color: "var(--warning)", fontWeight: 700, marginTop: "2px" }}>
                              Casi listo
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : viewParam === "external" ? (
          /* ========================================================================= */
          /* EXTERNAL ORDERS VIEW (Pedidos de llevar / domicilio)                     */
          /* ========================================================================= */
          <div className="glass-card animate-fade-in" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Truck size={20} style={{ color: "var(--accent-primary)" }} />
                <h2 style={{ fontSize: "18px", margin: 0 }}>Pedidos Externos Activos</h2>
              </div>
              <div>
                {renderNotificationBell()}
              </div>
            </div>

            {externalOrders.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                No hay pedidos externos (Llevar / Delivery) pendientes de cobro o entrega.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "15px" }}>
                {externalOrders.map(order => {
                  const isSelected = activeOrderId === order.id;
                  const isPending = order.status === "PENDING";
                  return (
                    <button
                      key={order.id}
                      onClick={() => handleSelectExternalOrder(order)}
                      style={{
                        padding: "15px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: isSelected
                          ? "var(--accent-primary)"
                          : isPending
                          ? "rgba(17, 17, 17, 0.05)"
                          : "var(--bg-secondary)",
                        border: `1px solid ${
                          isSelected
                            ? "var(--accent-primary)"
                            : isPending
                            ? "var(--accent-primary)"
                            : "var(--border-light)"
                        }`,
                        color: isSelected ? "#ffffff" : "var(--text-primary)",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontWeight: "bold" }}>
                        <span>#{order.id} ({order.type})</span>
                        <span style={{ color: isSelected ? "#ffffff" : "var(--accent-primary)" }}>
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", opacity: 0.9 }}>
                        <strong>Cliente:</strong> {order.customerName}
                      </div>
                      {order.deliveryAddress && (
                        <div style={{ fontSize: "13px", opacity: 0.7, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%" }}>
                          <strong>Dirección:</strong> {order.deliveryAddress}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "5px" }}>
                        {order.status === "PENDING" && order.paymentMethodString === "TRANSFER" && (
                          <span style={{ fontSize: "13px", color: isSelected ? "#ffffff" : "var(--accent-primary)", fontWeight: "bold" }}>
                            TRANSFERENCIA POR CONFIRMAR
                          </span>
                        )}
                        <span style={{
                          fontSize: "13px",
                          fontWeight: "bold",
                          backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--bg-tertiary)",
                          padding: "2px 8px",
                          borderRadius: "10px"
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* STANDARD POS MENU GRID VIEW                                              */
          /* ========================================================================= */
          <>
            {/* Active Table Status Banner for Mobile & Quick Context */}
            {selectedTable ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(17, 17, 17, 0.08)",
                border: "1px solid rgba(17, 17, 17, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "8px 14px",
                gap: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{systemIconForEmoji("🪑")}</span>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>Mesa {selectedTable.number}</strong>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", marginLeft: "6px" }}>
                      ({selectedTable.status === "OCCUPIED" ? "En Servicio" : "Libre"})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("tables")}
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer"
                  }}
                >
                  Cambiar mesa
                </button>
              </div>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(255, 165, 2, 0.1)",
                border: "1px solid rgba(255, 165, 2, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "8px 14px",
                gap: "10px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>{systemIconForEmoji("⚠️")}</span>
                  <span style={{ fontSize: "13px", color: "var(--warning)", fontWeight: 700 }}>Ninguna mesa seleccionada</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMobileTab("tables")}
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#ffffff",
                    backgroundColor: "var(--warning)",
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer"
                  }}
                >
                  Elegir Mesa
                </button>
              </div>
            )}

            {/* Header: Search and Shortcuts */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap"
            }}>
              {/* Search Product Box (Chili POS style) */}
              <div
                className="glass-card pos-search-box"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 15px",
                  borderRadius: "var(--radius-xl)",
                  backgroundColor: "var(--bg-secondary)",
                  flex: 1,
                  maxWidth: "480px",
                  gap: "10px"
                }}
              >
                <Search size={18} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Buscar plato en el menú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    padding: "8px 0",
                    border: "none",
                    background: "none",
                    outline: "none",
                    color: "var(--text-primary)"
                  }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} style={{ cursor: "pointer", color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                )}
                <Sliders size={18} style={{ color: "var(--text-muted)", marginLeft: "5px" }} />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {renderNotificationBell()}
                {!hasCashSession && (user?.role === "RESTAURANT_OWNER" || user?.role === "CAJERO") && (
                  <Link to="/cash" className="glow-btn" style={{
                    backgroundColor: "var(--accent-primary)",
                    padding: "8px 16px",
                    fontSize: "13px"
                  }}>
                    {systemIconForEmoji("⚠️")} Abrir Caja Primero
                  </Link>
                )}
                {(user?.role === "RESTAURANT_OWNER" || user?.role === "PRODUCCION") && (
                  <Link to="/kitchen" className="secondary-btn" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    Cocina (KDS)
                  </Link>
                )}
                {(user?.role === "RESTAURANT_OWNER" || user?.role === "CAJERO") && (
                  <Link to="/cash" className="secondary-btn" style={{ padding: "8px 16px", fontSize: "13px" }}>
                    Caja
                  </Link>
                )}
              </div>
            </div>

            {/* Categories Card Slider */}
            <div className="pos-categories-slider">
              {/* "All" Category Card */}
              <div
                onClick={() => setSelectedCategory(null)}
                className={`pos-category-card ${selectedCategory === null ? "active" : ""}`}
              >
                <span className="pos-category-card-icon">{systemIconForEmoji("🍽️")}</span>
                <span className="pos-category-card-title">Todos</span>
                <span className="pos-category-card-count">
                  {menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)} platos
                </span>
              </div>

              {/* Dynamic Categories */}
              {menuCategories.map(cat => {
                // Pick emoji helper based on name
                let emoji = systemTextWithIcons("🍔");
                const nameLower = cat.name.toLowerCase();
                if (nameLower.includes("desayuno") || nameLower.includes("breakfast")) emoji = systemTextWithIcons("🍳");
                else if (nameLower.includes("sopa") || nameLower.includes("soup") || nameLower.includes("caldo")) emoji = systemTextWithIcons("🍜");
                else if (nameLower.includes("pasta") || nameLower.includes("tallarin")) emoji = systemTextWithIcons("🍝");
                else if (nameLower.includes("fuerte") || nameLower.includes("fondo") || nameLower.includes("carne") || nameLower.includes("chili")) emoji = systemTextWithIcons("🌮");
                else if (nameLower.includes("burger") || nameLower.includes("hamburguesa")) emoji = systemTextWithIcons("🍔");
                else if (nameLower.includes("bebida") || nameLower.includes("jugo") || nameLower.includes("drink")) emoji = systemTextWithIcons("🍹");
                else if (nameLower.includes("postre") || nameLower.includes("dulce")) emoji = systemTextWithIcons("🍰");
                else if (nameLower.includes("ensalada") || nameLower.includes("salad") || nameLower.includes("diet")) emoji = systemTextWithIcons("🥗");

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`pos-category-card ${selectedCategory === cat.id ? "active" : ""}`}
                  >
                    <span className="pos-category-card-icon">{emoji}</span>
                    <span className="pos-category-card-title">{cat.name}</span>
                    <span className="pos-category-card-count">{cat.items.length} platos</span>
                  </div>
                );
              })}
            </div>

            {/* Dishes Grid */}
            <div className="pos-dishes-wrapper" style={{ width: "100%", flexShrink: 0 }}>
              {/* Filter and search items */}
              {(() => {
                const activeCatId = selectedCategory;
                const activeCat = menuCategories.find(c => c.id === activeCatId);
                
                // Deduplicate items by id when showing "Todos" to avoid repeated dishes and key collisions
                const rawItems = activeCat 
                  ? activeCat.items 
                  : menuCategories.flatMap(c => c.items);
                
                const uniqueMap = new Map<number, MenuItem>();
                rawItems.forEach(item => {
                  if (!uniqueMap.has(item.id)) {
                    uniqueMap.set(item.id, item);
                  }
                });
                const itemsToRender = Array.from(uniqueMap.values());

                const searchedItems = itemsToRender.filter(item =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (searchedItems.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>
                      No se encontraron platos que coincidan con la búsqueda.
                    </div>
                  );
                }

                return (
                  <div
                    className="pos-dishes-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px"
                    }}
                  >
                    {searchedItems.map(item => {
                      // Find if item has quantity in cart
                      const cartItem = cart.find(c => c.menuItemName === item.name);
                      const isItemInCart = !!cartItem;
                      
                      // Check if it's taxable (production area is set)
                      // The tag shows the real menu category instead of guessing "meat" or "veg" from the dish name
                      const categoryLabel = menuCategories.find(c => c.items.some(i => i.id === item.id))?.name || "";

                      return (
                        <div
                          key={item.id}
                          className={`pos-dish-card ${isItemInCart ? "active" : ""}`}
                        >
                          {/* Image */}
                          <div className="pos-dish-card-img-container">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="pos-dish-card-img" />
                            ) : (
                              <div style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "var(--bg-tertiary)",
                                color: "var(--text-muted)"
                              }}>
                                <ShoppingBag size={32} />
                              </div>
                            )}
                            {item.variants[0]?.regularPrice && (
                              <span className="pos-dish-card-tag">Promo</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="pos-dish-card-content">
                            <h3 className="pos-dish-card-title">{item.name}</h3>
                            
                            <div className="pos-dish-card-meta">
                              <span className="pos-dish-card-price">
                                ${item.variants[0]?.price.toFixed(2) || "0.00"}
                                {item.variants[0]?.regularPrice && (
                                  <s style={{ marginLeft: "6px", fontSize: "0.8em", opacity: 0.7, fontWeight: 400 }}>${item.variants[0].regularPrice.toFixed(2)}</s>
                                )}
                              </span>
                              {categoryLabel && (
                                <span className="pos-dish-card-diet" style={{ color: "#4b5563", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={categoryLabel}>
                                  {categoryLabel}
                                </span>
                              )}
                            </div>

                            {/* Button or quantity counter */}
                            {isItemInCart && cartItem ? (
                              <div className="pos-dish-counter">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(cartItem.variantId, -1)}
                                  className="pos-dish-counter-btn"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="pos-dish-counter-value">{cartItem.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(item, item.variants[0])}
                                  className="pos-dish-counter-btn"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item, item.variants[0])}
                                className="pos-dish-card-btn"
                              >
                                Agregar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Bottom Active Tables Status Row */}
            <div className="mobile-hide">
              <h4 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Mesas Ocupadas en Servicio
              </h4>
              <div className="pos-tables-row">
                {(() => {
                  const occupiedTables = diningAreas.flatMap(area =>
                    area.tables.filter(t => t.status === "OCCUPIED").map(t => ({ ...t, areaName: area.name }))
                  );

                  if (occupiedTables.length === 0) {
                    return (
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic", padding: "10px 0" }}>
                        No hay mesas ocupadas actualmente.
                      </div>
                    );
                  }

                  return occupiedTables.map(table => {
                    const isSelected = selectedTable?.id === table.id;
                    const readiness = tableReadinessMap[table.id];
                    const isAllReady = readiness?.status === "ALL_READY" || readiness?.status === "CALL_WAITER";
                    const isAlmostReady = readiness?.status === "ALMOST_READY";

                    return (
                      <div
                        key={table.id}
                        onClick={() => handleSelectTable(table)}
                        className={`pos-table-pill ${isSelected ? "active" : ""}`}
                        style={{
                          border: isAllReady
                            ? "1px solid var(--success)"
                            : isAlmostReady
                            ? "1px solid var(--warning)"
                            : undefined,
                          boxShadow: isAllReady
                            ? "0 0 10px rgba(46, 213, 115, 0.4)"
                            : isAlmostReady
                            ? "0 0 8px rgba(255, 165, 2, 0.3)"
                            : undefined,
                          cursor: "pointer"
                        }}
                      >
                        <div
                          className="pos-table-pill-avatar"
                          style={{
                            backgroundColor: isAllReady
                              ? "var(--success)"
                              : isAlmostReady
                              ? "var(--warning)"
                              : undefined,
                            color: isAlmostReady ? "#000" : "#fff"
                          }}
                        >
                          {isAllReady ? systemTextWithIcons("🛎️") : `T${table.number}`}
                        </div>
                        <div className="pos-table-pill-info">
                          <span className="pos-table-pill-name">Mesa {table.number}</span>
                          <span className="pos-table-pill-status">{table.areaName}</span>
                          {isAllReady ? (
                            <span style={{ color: "var(--success)", fontWeight: "bold", fontSize: "13px" }}>
                              {systemIconForEmoji("🛎️")} ¡Listo para servir!
                            </span>
                          ) : isAlmostReady ? (
                            <span style={{ color: "var(--warning)", fontWeight: "bold", fontSize: "13px" }}>
                              {systemIconForEmoji("⏳")} Casi listo ({readiness.readyItems}/{readiness.totalItems})
                            </span>
                          ) : (
                            <span className="pos-table-pill-process">Cuentas</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDEBAR: Order Details / Cart */}
      <div
        className={`pos-cart-sidebar mobile-full-width ${activeMobileTab === "cart" ? "" : "mobile-hide"}`}
        style={{
          width: "380px",
          backgroundColor: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flexShrink: 0
        }}
      >
        {/* Header Table Info */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid var(--border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: "20px", margin: 0 }}>
              {selectedTable ? `Mesa ${selectedTable.number}` : "Pedido Externo"}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
              {selectedTable ? "Servicio en Mesa" : `Cliente: ${customerName}`}
            </p>
            {selectedTable && tableReadinessMap[selectedTable.id] && (
              <div style={{ marginTop: "6px" }}>
                {tableReadinessMap[selectedTable.id].status === "ALL_READY" || tableReadinessMap[selectedTable.id].status === "CALL_WAITER" ? (
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "var(--success)",
                    backgroundColor: "rgba(46, 213, 115, 0.15)",
                    padding: "3px 8px",
                    borderRadius: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    {systemIconForEmoji("🛎️")} ¡Todos los platos listos para servir!
                  </span>
                ) : (
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "var(--warning)",
                    backgroundColor: "rgba(255, 165, 2, 0.15)",
                    padding: "3px 8px",
                    borderRadius: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    {systemIconForEmoji("🟡")} Casi listo ({tableReadinessMap[selectedTable.id].readyItems}/{tableReadinessMap[selectedTable.id].totalItems} platos)
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveMobileTab("menu")}
              className="mobile-show secondary-btn"
              style={{
                display: "none",
                padding: "6px 12px",
                fontSize: "13px",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ← Carta
            </button>
            {/* Edit icon simulation */}
            <button style={{
              padding: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Sliders size={16} />
            </button>
          </div>
        </div>

        {/* Dine In / Take Away Tabs */}
        <div style={{ padding: "15px 20px 5px 20px" }}>
          <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--bg-tertiary)", padding: "4px", borderRadius: "var(--radius-sm)" }}>
            <button
              onClick={() => {
                setOrderType("DINE_IN");
                setCustomerName("Varios");
              }}
              className={`pos-service-tab ${orderType === "DINE_IN" ? "active" : ""}`}
              style={{ flex: 1 }}
            >
              Mesa
            </button>
            <button
              onClick={() => {
                setOrderType("TAKEOUT");
                setCustomerName("");
              }}
              className={`pos-service-tab ${orderType === "TAKEOUT" ? "active" : ""}`}
              style={{ flex: 1 }}
            >
              Llevar
            </button>
          </div>
        </div>

        {/* Input Details based on type */}
        <div style={{ padding: "5px 20px 10px 20px" }}>
          {orderType !== "DINE_IN" && (
            <div className="input-group" style={{ marginBottom: "10px", gap: "4px" }}>
              <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>Nombre de Cliente</label>
              <input
                type="text"
                className="input-field"
                style={{ padding: "8px 12px", fontSize: "13px" }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          )}

          {orderType === "DELIVERY" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
              <div className="input-group" style={{ marginBottom: 0, gap: "4px" }}>
                <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>Dirección de Entrega</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                  placeholder="Calle y Nro"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0, gap: "4px" }}>
                <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>Referencia de Entrega (Opcional)</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                  placeholder="Ej: Frente al parque, casa blanca"
                  value={deliveryReference}
                  onChange={(e) => setDeliveryReference(e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0, gap: "4px" }}>
                <label style={{ fontSize: "13px", color: "var(--text-muted)" }}>Teléfono</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                  placeholder="099..."
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Transfer receipt check banner (security feature) */}
          {activeOrderObj && activeOrderObj.status === "PENDING" && activeOrderObj.paymentMethodString === "TRANSFER" && (
            <div style={{
              backgroundColor: "rgba(17, 17, 17, 0.05)",
              border: "1px solid var(--accent-primary)",
              padding: "10px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{systemIconForEmoji("⚠️")} Comprobante por Verificar</span>
              </div>
              {user?.role === "MOZO" ? (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                  Pendiente de verificación por caja {systemIconForEmoji("🖥️")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTransferReceiptModal(true)}
                  className="glow-btn"
                  style={{ padding: "6px 12px", fontSize: "13px", backgroundColor: "var(--accent-primary)" }}
                >
                  Revisar Pago
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: "center",
              color: "var(--text-muted)",
              marginTop: "50px",
              fontSize: "14px"
            }}>
              <ShoppingBag size={48} style={{ opacity: 0.15, marginBottom: "15px" }} />
              <p>Comanda vacía.</p>
              <p style={{ fontSize: "13px", opacity: 0.7 }}>Seleccione platos del menú para agregarlos.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.variantId}
                style={{
                  display: "flex",
                  gap: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border-light)",
                  alignItems: "center"
                }}
              >
                {/* Mini details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-primary)" }}>
                    {item.menuItemName}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {item.name} • ${item.price.toFixed(2)}
                  </div>
                  
                  {/* Item comment input */}
                  <input
                    type="text"
                    placeholder="Nota de preparación..."
                    value={item.comments}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCart(prev => prev.map(i => i.variantId === item.variantId ? { ...i, comments: val } : i));
                    }}
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      width: "100%",
                      marginTop: "4px",
                      borderBottom: "1px dashed var(--border-light)",
                      paddingBottom: "2px"
                    }}
                  />
                </div>

                {/* Counter controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.variantId, -1)}
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "var(--bg-tertiary)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ fontSize: "13px", fontWeight: "bold" }}>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart({ name: item.menuItemName } as any, { id: item.variantId, name: item.name, price: item.price } as any)}
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "var(--bg-tertiary)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Plus size={12} />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item.variantId)}
                    style={{ color: "var(--danger)", padding: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer / Totals and Actions */}
        <div style={{
          padding: "20px",
          borderTop: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}>
          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--text-secondary)" }}>
              <span>Subtotal</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            {parseFloat(discount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--danger)" }}>
                <span>Descuento</span>
                <span>-${parseFloat(discount).toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "18px",
              fontWeight: "bold",
              color: "var(--text-primary)",
              paddingTop: "8px",
              borderTop: "1px dashed var(--border-light)"
            }}>
              <span>Total</span>
              <span style={{ color: "var(--accent-primary)" }}>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              {/* Imprimir Comanda */}
              <button
                type="button"
                onClick={handlePrintComanda}
                className="secondary-btn"
                style={{ flex: 1, padding: "12px", fontSize: "14px" }}
                disabled={cart.length === 0}
              >
                {systemIconForEmoji("🖨️")} Imprimir Comanda
              </button>

              {/* Pedir a Cocina / Guardar Pedido */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                className={user?.role === "MOZO" ? "glow-btn" : "secondary-btn"}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  backgroundColor: user?.role === "MOZO" ? undefined : "rgba(17, 17, 17, 0.08)",
                  borderColor: "var(--accent-primary)",
                  color: user?.role === "MOZO" ? "#ffffff" : "var(--accent-primary)"
                }}
                disabled={cart.length === 0 || placingOrder}
              >
                {systemIconForEmoji("🔥")} {placingOrder ? "Enviando..." : "Enviar a Cocina"}
              </button>
            </div>

            {user?.role !== "MOZO" && (
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                {/* Checkout / Cobrar button */}
                {activeOrderId ? (
                  activeOrderObj ? (
                    activeOrderObj.status === "PENDING" && activeOrderObj.paymentMethodString === "TRANSFER" ? (
                      <div style={{
                        flex: 1,
                        backgroundColor: "rgba(17, 17, 17, 0.05)",
                        border: "1px solid var(--accent-primary)",
                        color: "var(--accent-primary)",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        TRANSFERENCIA POR VERIFICAR
                      </div>
                    ) : activeOrderObj.status === "CANCELLED" ? (
                      <div style={{
                        flex: 1,
                        backgroundColor: "rgba(255, 71, 87, 0.1)",
                        border: "1px solid var(--accent-primary)",
                        color: "var(--accent-primary)",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        ORDEN CANCELADA
                      </div>
                    ) : activeOrderObj.type === "DELIVERY" && activeOrderObj.paymentStatus !== "APPROVED" && !activeOrderObj.payphoneTransactionId ? (
                      <div style={{
                        flex: 1,
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-secondary)",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        SE COBRA AL ENTREGAR
                      </div>
                    ) : activeOrderObj.paymentStatus === "APPROVED" || activeOrderObj.payphoneTransactionId ? (
                      <div style={{
                        flex: 1,
                        backgroundColor: "rgba(46, 213, 115, 0.1)",
                        border: "1px solid var(--success)",
                        color: "var(--success)",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        PAGADO ({activeOrderObj.status})
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCheckoutModal()}
                        className="glow-btn"
                        style={{ flex: 1, padding: "12px", fontSize: "14px" }}
                        disabled={!hasCashSession || cart.length === 0}
                      >
                        Cobrar
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCheckoutModal()}
                      className="glow-btn"
                      style={{ flex: 1, padding: "12px", fontSize: "14px" }}
                      disabled={!hasCashSession || cart.length === 0}
                    >
                      Cobrar
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className="glow-btn"
                    style={{ flex: 1, padding: "12px", fontSize: "14px", opacity: 0.5, cursor: "not-allowed" }}
                    disabled
                    title="Debe guardar el pedido antes de cobrar"
                  >
                    Cobrar
                  </button>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "600px" }}>
            <h2 style={{ marginBottom: "20px", fontSize: "22px", display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={22} style={{ color: "var(--success)" }} />
              Procesar Pago y Facturación
            </h2>

            {/* Client Lookup & Registration */}
            <div style={{
              padding: "15px",
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ fontSize: "14px", margin: 0 }}>Datos de Facturación / Cliente</h3>
                {!selectedClient && !showNewClientForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClientForm(true);
                      setNewClientTypeId("05");
                    }}
                    style={{ fontSize: "13px", color: "var(--accent-primary)", fontWeight: "bold", background: "none", border: "none", cursor: "pointer" }}
                  >
                    + Registrar Nuevo Cliente
                  </button>
                )}
              </div>

              {!showNewClientForm && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Cédula, RUC o nombre..."
                    className="input-field"
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                    value={clientSearchIdent}
                    onChange={(e) => setClientSearchIdent(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleSearchClient}
                    className="secondary-btn"
                    style={{ padding: "8px 16px" }}
                  >
                    <Search size={16} />
                  </button>
                </div>
              )}
              {!showNewClientForm && !selectedClient && orderCustomer && (
                <p role="status" style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px" }}>
                  Pedido hecho desde la app por {orderCustomer.name}. Pulsa la lupa para usar sus datos.
                </p>
              )}

              {/* Client Selection Status */}
              {selectedClient ? (
                <div style={{
                  padding: "10px",
                  backgroundColor: "rgba(46, 213, 115, 0.05)",
                  border: "1px solid var(--success)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  color: "var(--success)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={16} />
                    <span>Factura a: <strong>{selectedClient.name}</strong> ({selectedClient.identification})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setClientSearchIdent("");
                    }}
                    style={{ fontSize: "13px", color: "var(--danger)", fontWeight: "bold", cursor: "pointer", background: "none", border: "none" }}
                  >
                    [ Quitar ]
                  </button>
                </div>
              ) : (
                !showNewClientForm && (
                  <div style={{
                    padding: "10px",
                    backgroundColor: "rgba(17, 17, 17, 0.03)",
                    border: "1px dashed var(--border-light)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <CheckCircle2 size={16} style={{ color: "var(--text-muted)" }} />
                    <span>Factura a: <strong>CONSUMIDOR FINAL</strong> (Predeterminado)</span>
                  </div>
                )
              )}

              {showNewClientForm && (
                <form onSubmit={handleRegisterClient} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h4 style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Registro de Nuevo Cliente</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      required
                    />
                    <select
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                      value={newClientTypeId}
                      onChange={(e) => setNewClientTypeId(e.target.value)}
                    >
                      <option value="05">Cédula</option>
                      <option value="04">RUC</option>
                      <option value="06">Pasaporte</option>
                      <option value="07">Consumidor Final</option>
                    </select>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="Cédula/RUC/ID *"
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                      value={newClientIdent}
                      onChange={(e) => setNewClientIdent(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      className="input-field"
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Dirección"
                    className="input-field"
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Correo para Factura Electrónica"
                    className="input-field"
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                  />
                  
                  <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewClientForm(false);
                        setNewClientName("");
                        setNewClientIdent("");
                        setNewClientAddress("");
                        setNewClientEmail("");
                        setNewClientPhone("");
                      }}
                      className="secondary-btn"
                      style={{ flex: 1, padding: "8px", fontSize: "13px" }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="glow-btn" style={{ flex: 1, padding: "8px", fontSize: "13px" }}>
                      Guardar Cliente
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Document and Payment methods */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="input-group">
                <label>Tipo de Comprobante</label>
                <select
                  value={selectedDocTypeId}
                  onChange={(e) => setSelectedDocTypeId(e.target.value)}
                  className="input-field"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  {documentTypes.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input-field"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  <option value="01">Efectivo</option>
                  <option value="20">Tarjeta (Débito/Crédito)</option>
                </select>
              </div>
            </div>

            {/* Discount */}
            <div className="input-group" style={{ marginBottom: "20px" }}>
              <label htmlFor="pos-discount">Descuento Especial (USD)</label>
              <input
                id="pos-discount"
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            {orderType !== "DELIVERY" && (
              <div className="input-group" style={{ marginBottom: "20px" }}>
                <label htmlFor="pos-tip">Propina para el mesero (opcional, no va en la factura)</label>
                <input
                  id="pos-tip"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  inputMode="decimal"
                  className="input-field"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                />
              </div>
            )}

            {/* SRI electronic toggle */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "25px"
            }}>
              <input
                type="checkbox"
                id="sri-invoice"
                checked={fiscalEmit}
                onChange={(e) => setFiscalEmit(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--accent-primary)" }}
              />
              <label htmlFor="sri-invoice" style={{ fontSize: "14px", cursor: "pointer" }}>
                Emitir factura electrónica autorizada SRI (Ecuador)
              </label>
            </div>

            {/* Final Totals */}
            <div style={{
              padding: "20px",
              backgroundColor: "var(--bg-tertiary)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "25px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Total a Pagar</div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--success)" }}>
                  ${(calculateTotal() + tipValue).toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "right" }}>
                <div>Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                <div>Desc: -${(parseFloat(discount) || 0).toFixed(2)}</div>
                {tipValue > 0 && <div>Propina: +${tipValue.toFixed(2)}</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowCheckout(false)}
                className="secondary-btn"
                style={{ flex: 1, padding: "12px" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckout}
                className="glow-btn"
                style={{ flex: 1, padding: "12px" }}
              >
                Confirmar Pago ($)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER RECEIPT VERIFICATION MODAL */}
      {showTransferReceiptModal && activeOrderObj && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "550px" }}>
            <h2 style={{ fontSize: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", margin: 0 }}>
              Verificar Comprobante de Transferencia
            </h2>

            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Orden <strong>#{activeOrderObj.id}</strong> • Cliente: <strong>{activeOrderObj.customerName}</strong> • Total: <strong style={{ color: "var(--success)" }}>${activeOrderObj.total.toFixed(2)}</strong>
            </div>

            {/* Receipt Image Display */}
            {activeOrderObj.paymentReceipt ? (
              <div style={{
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-sm)",
                padding: "10px",
                backgroundColor: "var(--bg-tertiary)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                maxHeight: "400px",
                overflow: "auto"
              }}>
                <img
                  src={activeOrderObj.paymentReceipt}
                  alt="Comprobante de Pago"
                  style={{ maxWidth: "100%", maxHeight: "350px", objectFit: "contain" }}
                />
              </div>
            ) : (
              <div style={{
                padding: "30px",
                textAlign: "center",
                color: "var(--text-muted)",
                backgroundColor: "var(--bg-tertiary)",
                border: "1px dashed var(--border-light)",
                borderRadius: "var(--radius-sm)"
              }}>
                No se cargó ninguna imagen para este comprobante.
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "10px"
            }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiRequest(`/orders/${activeOrderObj.id}/status`, {
                      method: "PUT",
                      body: JSON.stringify({
                        status: "PREPARING",
                        paymentStatus: "APPROVED"
                      })
                    });
                    alert("Pago aprobado. El pedido ha sido enviado a la cocina.");
                    setShowTransferReceiptModal(false);
                    loadExternalOrders();
                    setCart([]);
                    setSelectedTable(null);
                    setActiveOrderId(null);
                  } catch (err: any) {
                    alert("Error al aprobar comprobante: " + err.message);
                  }
                }}
                className="glow-btn"
                style={{ padding: "12px", fontSize: "13px" }}
              >
                Aprobar y Enviar a Cocina
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (await appConfirm("¿Está seguro de que desea rechazar el comprobante y cancelar la orden?")) {
                    try {
                      await apiRequest(`/orders/${activeOrderObj.id}/status`, {
                        method: "PUT",
                        body: JSON.stringify({
                          status: "CANCELLED",
                          paymentStatus: "REJECTED"
                        })
                      });
                      alert("Pago rechazado. El pedido ha sido cancelado.");
                      setShowTransferReceiptModal(false);
                      loadExternalOrders();
                      setCart([]);
                      setSelectedTable(null);
                      setActiveOrderId(null);
                    } catch (err: any) {
                      alert("Error al rechazar comprobante: " + err.message);
                    }
                  }
                }}
                className="secondary-btn"
                style={{ padding: "12px", fontSize: "13px", color: "var(--danger)", borderColor: "var(--danger)" }}
              >
                Rechazar y Cancelar Orden
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowTransferReceiptModal(false)}
              className="secondary-btn"
              style={{ padding: "10px" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
          {/* Floating Bottom Cart Bar for Mobile (Visible when items in cart and not in cart tab) */}
          {cart.length > 0 && activeMobileTab !== "cart" && (
            <div
              className="mobile-show-flex mobile-bottom-cart-bar"
              onClick={() => setActiveMobileTab("cart")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", lineHeight: 1.1 }}>
                    ${calculateTotal().toFixed(2)}
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>
                    {selectedTable ? `Mesa ${selectedTable.number}` : "Pedido"} • {cart.length} {cart.length === 1 ? "plato" : "platos"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px" }}>
                <span>Ver Pedido</span>
                <span>➔</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Alerta de Nuevo Pedido de Delivery (Estilo PedidosYa) */}
      {incomingDeliveryOrder && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="glass-card" style={{
            background: "#ffffff",
            maxWidth: "480px",
            width: "100%",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 15px 50px rgba(0,0,0,0.3)",
            textAlign: "center",
            border: "2px solid #ff4757"
          }}>
            <div style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "rgba(255, 71, 87, 0.15)",
              color: "#ff4757",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: "2.2rem"
            }}>
              {systemIconForEmoji("🛵")}
            </div>

            <span style={{
              display: "inline-block",
              background: "#ff4757",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "800",
              letterSpacing: "1px",
              marginBottom: "8px"
            }}>
              ¡ALERTA PEDIDOSYA!
            </span>

            <h2 style={{ margin: "4px 0 8px 0", color: "#2f3542", fontSize: "1.6rem" }}>
              Nuevo Pedido de Delivery
            </h2>
            <p style={{ margin: "0 0 20px 0", color: "#747d8c", fontSize: "1rem" }}>
              Orden #{incomingDeliveryOrder.id} • Cliente: <strong>{incomingDeliveryOrder.customerName}</strong>
            </p>

            <div style={{
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "14px",
              padding: "16px",
              textAlign: "left",
              marginBottom: "24px",
              fontSize: "0.95rem",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div><strong>{systemIconForEmoji("📍")} Entrega:</strong> {incomingDeliveryOrder.deliveryAddress || "A domicilio"}</div>
              <div><strong>{systemIconForEmoji("📞")} Teléfono:</strong> {incomingDeliveryOrder.deliveryPhone || "No especificado"}</div>
              <div><strong>{systemIconForEmoji("💰")} Total:</strong> ${Number(incomingDeliveryOrder.total || 0).toFixed(2)}</div>
              <div><strong>{systemIconForEmoji("🍽️")} Platos:</strong> {incomingDeliveryOrder.items?.length || 1} producto(s)</div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIncomingDeliveryOrder(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", fontWeight: "600" }}
              >
                Cerrar Aviso
              </button>
              <button
                type="button"
                className="glow-btn"
                onClick={() => {
                  handleSelectExternalOrder(incomingDeliveryOrder);
                  setIncomingDeliveryOrder(null);
                }}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#2ed573",
                  color: "#fff",
                  fontWeight: "800",
                  fontSize: "1rem",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Aceptar Pedido ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
