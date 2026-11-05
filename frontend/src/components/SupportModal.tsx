import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MessageSquare,
  Mail,
  Phone,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "../utils/api";
import { systemIconForEmoji } from "../utils/systemIcons";


export interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "CUSTOMER" | "RESTAURANT" | "MOTORIZADO";
  orderId?: string | number;
  restaurantName?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  defaultRole = "CUSTOMER",
  orderId,
  restaurantName,
}) => {
  const [activeTab, setActiveTab] = useState<"direct" | "ticket">("direct");
  const [selectedRole, setSelectedRole] = useState<"CUSTOMER" | "RESTAURANT" | "MOTORIZADO">(defaultRole);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formOrderId, setFormOrderId] = useState(orderId ? String(orderId) : "");
  const [loading, setLoading] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill user from localStorage if logged in
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("goeats_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name && !name) setName(u.name);
        if (u.email && !email) setEmail(u.email);
        if (u.phone && !phone) setPhone(u.phone);
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const supportPhone = "+593988888888"; // Central de Soporte GoEats
  const supportEmail = "eatsgo015@gmail.com";

  // Categories per role
  const categoriesByRole = {
    CUSTOMER: [
      "Demora en la entrega",
      "Producto incorrecto o faltante",
      "Problema con el cobro o factura",
      "Duda sobre el menú del restaurante",
      "Fallo en la aplicación o cuenta",
      "Otro asunto",
    ],
    RESTAURANT: [
      "Soporte POS / Caja Registradora",
      "Configuración de Impresora Térmica",
      "Problema con pedidos en curso",
      "Modificación de carta / platos",
      "Liquidaciones y pagos de ventas",
      "Otro asunto",
    ],
    MOTORIZADO: [
      "Cliente no responde / no aparece",
      "Demora excesiva en cocina del local",
      "Dirección de entrega incorrecta",
      "Incidente o avería mecánica en ruta",
      "Dudas sobre comisiones o propinas",
      "Otro asunto",
    ],
  };

  const getWhatsAppMessage = () => {
    let msg = "";
    if (selectedRole === "CUSTOMER") {
      msg = `¡Hola Soporte GoEats! Soy cliente${name ? ` (${name})` : ""}.${orderId ? ` Necesito ayuda urgente con mi pedido #${orderId}.` : " Tengo una consulta sobre un pedido."}`;
    } else if (selectedRole === "RESTAURANT") {
      msg = `¡Hola Soporte GoEats! Me comunico desde el restaurante ${restaurantName || ""}.${name ? ` (Contacto: ${name})` : ""} Requiero soporte operativo o técnico.`;
    } else {
      msg = `[SOPORTE EN RUTA] Hola GoEats, soy motorizado/repartidor${name ? ` (${name})` : ""}.${orderId ? ` Tengo un problema en curso con la entrega #${orderId}.` : " Requiero asistencia inmediata."}`;
    }
    return encodeURIComponent(msg);
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage("Por favor completa tu Nombre, Correo y el Detalle del problema.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("/support/ticket", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role: selectedRole,
          category: category || categoriesByRole[selectedRole][0],
          subject: customSubject.trim() || `${category || "Soporte"} - ${name.trim()}`,
          message: message.trim(),
          orderId: formOrderId.trim() || undefined,
          restaurantName: restaurantName || undefined,
        }),
      });

      if (res && res.success) {
        setSubmittedCode(res.ticketCode || "TK-EXITO");
      } else {
        throw new Error(res?.error || "No se pudo registrar el ticket.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor de soporte.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "20px",
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: "20px 24px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #dbeafe",
                flexShrink: 0,
              }}
            >
              <HelpCircle size={22} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a", lineHeight: 1.3 }}>
                Centro de Ayuda & Soporte
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                Canal oficial de atención para la comunidad GoEats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e2e8f0";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#64748b";
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS (SEGMENTED CONTROL) */}
        <div style={{ padding: "16px 20px 0 20px", backgroundColor: "#ffffff" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              backgroundColor: "#f1f5f9",
              padding: "4px",
              borderRadius: "12px",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab("direct"); setSubmittedCode(null); }}
              style={{
                padding: "9px 12px",
                fontSize: "13px",
                fontWeight: "700",
                border: "none",
                borderRadius: "9px",
                backgroundColor: activeTab === "direct" ? "#ffffff" : "transparent",
                color: activeTab === "direct" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "direct" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <Phone size={14} color={activeTab === "direct" ? "#0f172a" : "#64748b"} />
              Contactos
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("ticket"); setSubmittedCode(null); }}
              style={{
                padding: "9px 12px",
                fontSize: "13px",
                fontWeight: "700",
                border: "none",
                borderRadius: "9px",
                backgroundColor: activeTab === "ticket" ? "#ffffff" : "transparent",
                color: activeTab === "ticket" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "ticket" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
            >
              <Mail size={14} color={activeTab === "ticket" ? "#0f172a" : "#64748b"} />
              Enviar Ticket
            </button>
          </div>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, minHeight: 0 }}>

          {/* TAB 2: TICKET EMAIL FORM */}
          {activeTab === "ticket" && (
            <div>
              {submittedCode ? (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px auto",
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "#0f172a" }}>
                    ¡Ticket Registrado con Éxito!
                  </h3>
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor: "#f1f5f9",
                      padding: "8px 20px",
                      borderRadius: "20px",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#ff4757",
                      margin: "10px 0",
                    }}
                  >
                    Código: #{submittedCode}
                  </div>
                  <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "420px", margin: "10px auto 25px auto" }}>
                    Hemos enviado una confirmación a tu correo. Un asesor revisará los detalles y te responderá a la brevedad.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedCode(null);
                      setMessage("");
                    }}
                    style={{
                      padding: "10px 24px",
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Enviar Otra Solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendTicket} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {errorMessage && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#b91c1c",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertCircle size={16} />
                      {errorMessage}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                        Tu Nombre *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                        Teléfono / Celular
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 0987654321"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                        Nº de Pedido (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formOrderId}
                        onChange={(e) => setFormOrderId(e.target.value)}
                        placeholder="Ej. 1024"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                        Tu Perfil
                      </label>
                      <select
                        value={selectedRole}
                        onChange={(e) => {
                          const newRole = e.target.value as "CUSTOMER" | "RESTAURANT" | "MOTORIZADO";
                          setSelectedRole(newRole);
                          setCategory(categoriesByRole[newRole][0]);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <option value="CUSTOMER">Cliente</option>
                        <option value="RESTAURANT">Restaurante / POS</option>
                        <option value="MOTORIZADO">Repartidor</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                        Motivo / Categoría
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {categoriesByRole[selectedRole].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                      Asunto / Título (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Ej. Mi pedido no ha llegado / Error en impresora térmica"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>
                      Detalle de tu problema o consulta *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe qué ocurrió, si hubo algún error o cómo podemos asistirte..."
                      rows={4}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "12px",
                      backgroundColor: "#ff4757",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(255, 71, 87, 0.3)",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    <Send size={16} />
                    {loading ? "Enviando ticket..." : "Enviar Solicitud a Soporte"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 1: CONTACTOS DIRECTOS */}
          {activeTab === "direct" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* WhatsApp Card */}
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      backgroundColor: "#f0fdf4",
                      color: "#16a34a",
                      border: "1px solid #dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                        WhatsApp
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "#f0fdf4",
                          color: "#15803d",
                          fontSize: "10.5px",
                          fontWeight: "600",
                          padding: "2px 7px",
                          borderRadius: "10px",
                          border: "1px solid #dcfce7",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            backgroundColor: "#22c55e",
                          }}
                        />
                        En línea
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {supportPhone} · Asistencia rápida
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, "")}?text=${getWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "12px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                    boxShadow: "0 1px 3px rgba(22, 163, 74, 0.2)",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                >
                  <MessageSquare size={13} />
                  <span>Chatear</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Email Card */}
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                      Correo Electrónico
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {supportEmail}
                    </div>
                  </div>
                </div>
                <a
                  href={`mailto:${supportEmail}?subject=Consulta%20GoEats%20[${selectedRole}]`}
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "#f8fafc",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "12px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <Mail size={13} />
                  <span>Escribir</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Horario de Atención (Sutil y Elegante) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                  fontSize: "12px",
                  color: "#64748b",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                  marginTop: "2px",
                }}
              >
                <span>{systemIconForEmoji("🕐")}</span>
                <span>
                  <strong>Atención operadores:</strong> Lun a Dom &bull; 8:00 AM &ndash; 11:30 PM
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
