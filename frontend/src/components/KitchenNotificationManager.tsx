import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, X, Clock, Volume2, VolumeX, CheckCircle2, Sparkles } from "lucide-react";
import { systemIconForEmoji, systemTextWithIcons } from "../utils/systemIcons";


export interface KitchenNotification {
  id: string;
  type: "ALMOST_READY" | "ALL_READY" | "CALL_WAITER";
  orderId: number;
  restaurantId?: number;
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

export const KitchenNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<KitchenNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<KitchenNotification | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  });
  // Closing the notice is remembered on this device, so it doesn't come back on every reload
  const [dismissedPushBanner, setDismissedPushBanner] = useState(() => {
    try {
      return localStorage.getItem("goeats_push_notice_closed") === "1";
    } catch {
      return false;
    }
  });
  const closePushBanner = () => {
    setDismissedPushBanner(true);
    try {
      localStorage.setItem("goeats_push_notice_closed", "1");
    } catch {
      /* private mode: closes only for this visit */
    }
  };
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Register Service Worker on mount for real native background Push Notifications
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[ServiceWorker] Registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[ServiceWorker] Registration error:", err);
        });
    }

  }, []);

  // 2. Audio Chime Synthesizer via HTML5 Web Audio API
  const playSoundAlert = (type: "ALMOST_READY" | "ALL_READY" | "CALL_WAITER") => {
    if (!soundEnabled) return;
    try {
      const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;

      const audioCtx = new AudioCtor();
      const now = audioCtx.currentTime;

      if (type === "ALMOST_READY") {
        // Gentle double-ding (E5 -> G#5) for "Casi Listo"
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(830.61, now + 0.18);
        gain2.gain.setValueAtTime(0.25, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.55);
      } else {
        // Restaurant service bell chime (C6 -> G5 -> E6) for ALL_READY or CALL_WAITER
        const notes = [
          { freq: 1046.50, start: 0, dur: 0.35 },
          { freq: 783.99, start: 0.18, dur: 0.35 },
          { freq: 1318.51, start: 0.36, dur: 0.7 }
        ];
        notes.forEach(note => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.freq, now + note.start);
          gain.gain.setValueAtTime(0.4, now + note.start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + note.start);
          osc.stop(now + note.start + note.dur);
        });
      }
    } catch (e) {
      console.warn("Could not play audio chime:", e);
    }
  };

  // 3. Dispatch Native OS Push Notification (Service Worker + fallback)
  const fireNativePush = async (title: string, message: string, tableId?: number | null, orderId?: number) => {
    // Haptic vibration for mobile phones
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 300]);
      } catch {
        // Some browsers reject vibration requests; ignore the error.
      }
    }

    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const options: NotificationOptions = {
      body: message,
      icon: "/icons/goeats-192.png",
      badge: "/icons/goeats-192.png",
      tag: `goeats-order-${orderId || Date.now()}`,
      requireInteraction: true,
      data: {
        url: tableId ? `/pos?tableId=${tableId}` : "/pos"
      }
    };

    // Primary: Service Worker showNotification (works on Android Chrome & desktop background)
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, options);
        return;
      } catch (swErr) {
        console.warn("[Push] SW showNotification error:", swErr);
      }
    }

    // Fallback: Standard window Notification
    try {
      const nativeNotif = new Notification(title, options);
      nativeNotif.onclick = () => {
        window.focus();
        if (tableId) {
          navigate(`/pos?tableId=${tableId}`);
        } else {
          navigate("/pos");
        }
        nativeNotif.close();
      };
    } catch (err) {
      console.error("[Push] window.Notification error:", err);
    }
  };

  // 4. Request Push Notification Permission
  const handleRequestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones de escritorio/push.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);

      if (perm === "granted") {
        playSoundAlert("ALL_READY");
        await fireNativePush(
          "¡Notificaciones push activadas con éxito!",
          "A partir de ahora recibirás avisos del cocinero aquí directamente en tu pantalla.",
          null,
          0
        );
      } else if (perm === "denied") {
        alert("Las notificaciones están bloqueadas en tu navegador. Puedes desbloquearlas haciendo clic en el candado junto a la dirección del sitio en la barra de direcciones.");
      }
    } catch (err) {
      console.error("Error requesting push permission:", err);
    }
  };

  // 5. Test Push Notification button
  const handleTestPush = async () => {
    if (pushPermission !== "granted") {
      handleRequestPushPermission();
      return;
    }
    playSoundAlert("CALL_WAITER");
    await fireNativePush(
      "Prueba de notificación push - GoEats",
      "¡Excelente! Las notificaciones push funcionan correctamente en tu dispositivo.",
      null,
      9999
    );
  };

  // 6. Socket Listener
  useEffect(() => {
    if (!socket) return;

    const handleWaiterNotification = (payload: {
      restaurantId?: number | string;
      orderId?: number;
      tableId?: number | null;
      tableNumber?: string | number;
      tableName?: string;
      mozoId?: number | null;
      readyItems?: number;
      totalItems?: number;
      itemJustReady?: string;
      title?: string;
      message?: string;
      timestamp?: string;
      type?: KitchenNotification["type"];
    }) => {
      console.log("[KitchenNotificationManager] Received event:", payload);

      // Verify tenant restaurant context if available
      if (payload.restaurantId && user?.restaurantId && Number(payload.restaurantId) !== Number(user.restaurantId)) {
        return;
      }

      const normalizedRestaurantId = payload.restaurantId == null ? undefined : Number(payload.restaurantId);
      const normalizedTableId = payload.tableId == null ? undefined : Number(payload.tableId);
      const normalizedOrderId = Number(payload.orderId ?? 0);
      const normalizedMozoId = payload.mozoId == null ? undefined : Number(payload.mozoId);
      const normalizedReadyItems = Number(payload.readyItems ?? 0);
      const normalizedTotalItems = Number(payload.totalItems ?? 0);
      const normalizedTableNumber = payload.tableNumber == null ? undefined : String(payload.tableNumber);

      const notif: KitchenNotification = {
        id: `${Date.now()}-${Math.random()}`,
        type: payload.type || "CALL_WAITER",
        orderId: normalizedOrderId,
        restaurantId: normalizedRestaurantId,
        tableId: normalizedTableId,
        tableNumber: normalizedTableNumber,
        tableName: payload.tableName || (normalizedTableNumber ? `Mesa ${normalizedTableNumber}` : "Mesa"),
        mozoId: normalizedMozoId,
        readyItems: normalizedReadyItems,
        totalItems: normalizedTotalItems,
        itemJustReady: payload.itemJustReady,
        title: payload.title || "Llamada de cocina",
        message: payload.message || "Cocina solicita atención para un pedido.",
        timestamp: payload.timestamp || new Date().toISOString(),
        read: false,
      };

      // 1. Update history and unread badge
      setNotifications(prev => [notif, ...prev.slice(0, 39)]);
      setUnreadCount(prev => prev + 1);

      // 2. Play sound chime
      playSoundAlert(notif.type);

      // 3. Dispatch native system push notification
      fireNativePush(notif.title, notif.message, notif.tableId, notif.orderId);

      // 4. Show top floating toast card
      setActiveToast(notif);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 10000);
    };

    socket.on("waiter-order-notification", handleWaiterNotification);

    return () => {
      socket.off("waiter-order-notification", handleWaiterNotification);
    };
  }, [socket, user?.restaurantId, soundEnabled, pushPermission]);

  const handleOpenTable = (notif: KitchenNotification) => {
    setActiveToast(null);
    setShowDrawer(false);
    if (notif.tableId) {
      navigate(`/pos?tableId=${notif.tableId}`);
    } else {
      navigate("/pos");
    }
  };

  // The push notice lives in the layout slot above the page, so it never covers buttons
  const [noticeSlot, setNoticeSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setNoticeSlot(document.getElementById("layout-notices"));
  }, []);

  // Only render for roles that attend tables or supervise (waiter, cashier, owner)
  const isRelevantRole = user && (user.role === "MOZO" || user.role === "CAJERO" || user.role === "RESTAURANT_OWNER");
  if (!isRelevantRole) return null;

  return (
    <>
      {/* 1. Request Push Permission Top Bar (if not yet granted) */}
      {pushPermission !== "granted" && !dismissedPushBanner && noticeSlot && createPortal(
        <div
          data-testid="push-notice"
          style={{
            backgroundColor: "#111111",
            borderBottom: "1px solid #444444",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            animation: "slideDown 0.3s ease-out"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0
            }}>
              <BellRing size={18} />
            </div>
            <div>
              <strong style={{ fontSize: "15px", color: "#ffffff", display: "block" }}>
                Avisos de cocina
              </strong>
              <span style={{ fontSize: "14px", color: "#d4d4d4" }}>
                {pushPermission === "denied"
                  ? "Las notificaciones están bloqueadas en tu navegador. Haz clic en el candado de la dirección para permitirlas."
                  : "Permite los avisos para enterarte al instante cuando un plato esté casi listo o el cocinero te llame."}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {pushPermission !== "denied" && (
              <button
                type="button"
                onClick={handleRequestPushPermission}
                style={{
                  background: "#ffffff",
                  color: "#111111",
                  border: "none",
                  minHeight: "44px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Sparkles size={14} />
                Activar avisos
              </button>
            )}
            <button
              type="button"
              onClick={closePushBanner}
              aria-label="Cerrar aviso"
              style={{
                background: "none",
                border: "1px solid #555555",
                borderRadius: "8px",
                color: "#ffffff",
                cursor: "pointer",
                padding: "10px",
                minWidth: "44px",
                minHeight: "44px"
              }}
              title="Cerrar aviso"
            >
              <X size={18} />
            </button>
          </div>
        </div>,
        noticeSlot
      )}

      {/* 2. Top-Layer Floating Toast Banner via createPortal */}
      {activeToast && createPortal(
        <div
          style={{
            position: "fixed",
            top: "18px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999999,
            width: "calc(100vw - 32px)",
            maxWidth: "480px",
            boxSizing: "border-box",
            backgroundColor: "var(--bg-secondary)",
            border: `2px solid ${activeToast.type === "ALMOST_READY" ? "var(--warning)" : "var(--success)"}`,
            borderRadius: "var(--radius-lg)",
            boxShadow: activeToast.type === "ALMOST_READY"
              ? "0 16px 40px rgba(255, 165, 2, 0.45)"
              : "0 16px 40px rgba(46, 213, 115, 0.55)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            backdropFilter: "blur(16px)",
            animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            backgroundColor: activeToast.type === "ALMOST_READY" ? "rgba(255, 165, 2, 0.15)" : "rgba(46, 213, 115, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: activeToast.type === "ALMOST_READY" ? "var(--warning)" : "var(--success)"
          }}>
            {activeToast.type === "ALMOST_READY" ? <Clock size={24} /> : <BellRing size={24} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: activeToast.type === "ALMOST_READY" ? "rgba(255, 165, 2, 0.2)" : "rgba(46, 213, 115, 0.2)",
                  color: activeToast.type === "ALMOST_READY" ? "var(--warning)" : "var(--success)",
                  letterSpacing: "0.5px"
                }}>
                  {activeToast.type === "ALMOST_READY" ? "CASI LISTO" : "LISTO PARA SERVIR"}
                </span>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
                  {activeToast.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: "6px 0 10px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {activeToast.message}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => handleOpenTable(activeToast)}
                className={activeToast.type === "ALMOST_READY" ? "secondary-btn" : "glow-btn"}
                style={{
                  padding: "6px 14px",
                  fontSize: "13px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {systemIconForEmoji("🍽️")} Ir a {activeToast.tableName}
              </button>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="secondary-btn"
                style={{ padding: "6px 12px", fontSize: "13px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. Floating Persistent Quick-Access Bell Button (Bottom-Right) */}
      {createPortal(
        <div className="floating-kitchen-bell-container" style={{ position: "fixed", bottom: "25px", right: "25px", zIndex: 99999 }}>
          <button
            type="button"
            onClick={() => {
              setShowDrawer(prev => !prev);
              if (!showDrawer) {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }
            }}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: unreadCount > 0 ? "var(--success)" : "var(--bg-secondary)",
              color: unreadCount > 0 ? "#ffffff" : "var(--text-primary)",
              border: `2px solid ${unreadCount > 0 ? "var(--success)" : "var(--border-light)"}`,
              boxShadow: unreadCount > 0 ? "0 0 18px rgba(46, 213, 115, 0.6)" : "0 4px 16px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all var(--transition-fast)"
            }}
            title="Avisos de Cocina"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                backgroundColor: "var(--danger)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "bold",
                borderRadius: "10px",
                padding: "2px 6px",
                lineHeight: 1,
                border: "2px solid var(--bg-secondary)"
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer Popup */}
          {showDrawer && (
            <div
              className="glass-card animate-fade-in kitchen-bell-drawer"
              style={{
                position: "absolute",
                bottom: "65px",
                right: 0,
                width: "min(360px, 90vw)",
                maxHeight: "480px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Bell size={18} style={{ color: "var(--accent-primary)" }} />
                  <strong style={{ fontSize: "14px" }}>Avisos de Cocina</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(prev => !prev)}
                    title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
                    style={{ background: "none", border: "none", cursor: "pointer", color: soundEnabled ? "var(--success)" : "var(--text-muted)" }}
                  >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestPush}
                    title="Enviar notificación de prueba a tu sistema"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--accent-primary)", fontWeight: 600 }}
                  >
                    Probar Push
                  </button>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifications([]);
                        setUnreadCount(0);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-muted)" }}
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Status bar */}
              <div style={{
                padding: "6px 16px",
                fontSize: "13px",
                backgroundColor: pushPermission === "granted" ? "rgba(46, 213, 115, 0.1)" : "rgba(255, 71, 87, 0.1)",
                color: pushPermission === "granted" ? "var(--success)" : "var(--danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <span>
                  {pushPermission === "granted" ? systemTextWithIcons("🟢 Push: Activadas") : systemTextWithIcons("🔴 Push: Desactivadas")}
                </span>
                {pushPermission !== "granted" && (
                  <button
                    type="button"
                    onClick={handleRequestPushPermission}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-primary)",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "13px",
                      textDecoration: "underline"
                    }}
                  >
                    Activar
                  </button>
                )}
              </div>

              {/* Drawer List */}
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "360px" }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "35px 20px", color: "var(--text-muted)", fontSize: "13px" }}>
                    <CheckCircle2 size={30} style={{ margin: "0 auto 10px auto", opacity: 0.3 }} />
                    No hay avisos pendientes de cocina.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleOpenTable(notif)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border-light)",
                        cursor: "pointer",
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
                      <div style={{ fontSize: "13px", color: "var(--accent-primary)", fontWeight: 600, marginTop: "4px" }}>
                        {systemIconForEmoji("👉")} Click para abrir {notif.tableName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};