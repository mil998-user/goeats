import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Save, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  ShieldCheck, 
  Lock, 
  Crown,
  Heart,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { FoodPreferencesModal } from "./FoodPreferencesModal";
import { FOOD_PREFERENCE_CATEGORIES, normalizeFoodPreferences } from "../utils/foodPreferences";
import { Link } from "react-router-dom";
import { systemIconForEmoji } from "../utils/systemIcons";


export const CustomerProfileView: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [cedula, setCedula] = useState(user?.cedula || "");
  const [username, setUsername] = useState(user?.username || "");
  const [createdAt, setCreatedAt] = useState(user?.createdAt || "");
  const [isPlus, setIsPlus] = useState(user?.isPlus || false);
  const [preferences, setPreferences] = useState<string[]>(user?.preferences || []);

  // Password Change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences Modal
  const [prefModalOpen, setPrefModalOpen] = useState(false);

  // Account Deletion States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiRequest("/auth/profile", { method: "GET" });
      if (res.success && res.user) {
        const u = res.user;
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setCedula(u.cedula || "");
        setUsername(u.username || "");
        setCreatedAt(u.createdAt || "");
        setIsPlus(u.isPlus || false);
        setPreferences(normalizeFoodPreferences(u.preferences || []));

        updateUser({
          name: u.name,
          email: u.email,
          phone: u.phone,
          cedula: u.cedula,
          isPlus: u.isPlus,
          createdAt: u.createdAt,
          preferences: u.preferences,
        });
      }
    } catch (err: unknown) {
      console.warn("Error loading profile:", err);
      // Fallback to local user
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setCedula(user.cedula || "");
        setUsername(user.username || "");
        setIsPlus(user.isPlus || false);
      }
    } finally {
      setLoading(false);
    }
  }, [updateUser, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("El nombre no puede estar vacío.");
      return;
    }

    if (showPasswordChange && newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("Las contraseñas no coinciden.");
        return;
      }
    }

    try {
      setSaving(true);
      const payload: {
        name: string;
        phone: string | null;
        cedula: string | null;
        password?: string;
      } = {
        name: name.trim(),
        phone: phone.trim() || null,
        cedula: cedula.trim() || null,
      };

      if (showPasswordChange && newPassword) {
        payload.password = newPassword.trim();
      }

      const res = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setSuccessMsg("¡Tu información ha sido guardada exitosamente!");
        updateUser({
          name: res.user.name,
          phone: res.user.phone,
          cedula: res.user.cedula,
        });
        if (showPasswordChange) {
          setNewPassword("");
          setConfirmPassword("");
          setShowPasswordChange(false);
        }
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.message || "No se pudo actualizar el perfil.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al conectar con el servidor.";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "ELIMINAR") {
      setDeleteError("Por favor escribe exactamente la palabra ELIMINAR para confirmar.");
      return;
    }

    try {
      setDeletingAccount(true);
      setDeleteError(null);
      const res = await apiRequest("/auth/profile", {
        method: "DELETE",
      });
      if (res.success) {
        alert("Tu cuenta ha sido eliminada permanentemente. Esperamos verte de nuevo pronto.");
        logout();
        window.location.href = "/";
      } else {
        setDeleteError(res.message || "No se pudo eliminar la cuenta.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al procesar la eliminación de la cuenta.";
      setDeleteError(message);
    } finally {
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchProfile]);

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Reciente";

  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  // Match selected preferences with categories info
  const selectedPrefCategories = FOOD_PREFERENCE_CATEGORIES.filter((cat) =>
    preferences.includes(cat.id)
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
        <Loader2 size={36} className="spinner" style={{ color: "#ff4757", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", paddingBottom: "40px" }} className="animate-fade-in">
      {/* Header Profile Badge Card */}
      <div
        className="customer-profile-hero"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "20px",
          padding: "28px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
          marginBottom: "24px",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div
            className="customer-profile-hero-avatar"
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: isPlus
                ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                : "linear-gradient(135deg, #ff4757 0%, #e84118 100%)",
              color: isPlus ? "#78350f" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "800",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
              border: "3px solid rgba(255, 255, 255, 0.2)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, color: "#ffffff" }}>
                {name || "Comensal"}
              </h2>
              {isPlus && (
                <span
                  style={{
                    backgroundColor: "rgba(251, 191, 36, 0.2)",
                    border: "1px solid #fbbf24",
                    color: "#fde047",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Crown size={12} />
                  GOEATS PLUS
                </span>
              )}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
              @{username || "usuario"} · Comensal
            </div>
            <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Calendar size={13} />
              <span>Registrado el {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Plus status tag */}
        <div>
          {isPlus ? (
            <div
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                padding: "8px 16px",
                borderRadius: "14px",
                textAlign: "left",
              }}
            >
              <div style={{ color: "#fbbf24", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} /> Envíos Gratis Ilimitados
              </div>
              <div style={{ color: "#cbd5e1", fontSize: "11px", marginTop: "2px" }}>Membresía activa</div>
            </div>
          ) : (
            <Link
              to="/plus"
              style={{
                backgroundColor: "#f59e0b",
                color: "#1e1b4b",
                fontWeight: "700",
                fontSize: "13px",
                padding: "9px 18px",
                borderRadius: "30px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
              }}
            >
              <Crown size={15} />
              Hazte Plus {systemIconForEmoji("✨")}
            </Link>
          )}
        </div>
      </div>

      {/* Success & Error alerts */}
      {successMsg && (
        <div
          style={{
            padding: "14px 18px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "12px",
            color: "#065f46",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle size={18} color="#10b981" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: "14px 18px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            color: "#991b1b",
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={18} color="#ef4444" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        {/* Card: Datos Personales */}
        <div
          className="customer-profile-card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "26px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
            <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#fef2f2", color: "#ff4757" }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                Información Personal
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
                Actualiza tus datos de contacto y facturación para tus pedidos en GoEats
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px", marginBottom: "20px" }}>
              {/* Nombre Completo */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Nombre Completo *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      color: "#1e293b",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                  />
                </div>
              </div>

              {/* Correo Electrónico (Solo Lectura) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Correo Electrónico
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email"
                    disabled
                    value={email || "Sin correo"}
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      fontSize: "14px",
                      color: "#64748b",
                      outline: "none",
                      boxSizing: "border-box",
                      cursor: "not-allowed",
                    }}
                  />
                </div>
                <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                  Vinculado a tu inicio de sesión
                </span>
              </div>

              {/* Teléfono Móvil */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Teléfono / Celular para Entregas
                </label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 0991234567"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      color: "#1e293b",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  El repartidor se comunicará a este número al entregar tu pedido
                </span>
              </div>

              {/* Cédula o RUC para Facturación SRI */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Cédula o RUC (Facturación Electrónica SRI)
                </label>
                <div style={{ position: "relative" }}>
                  <CreditCard size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    maxLength={13}
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej. 1712345678"
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 40px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      color: "#1e293b",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Requerido por los restaurantes para emitir tu factura electrónica
                </span>
              </div>
            </div>

            {/* Toggle Cambiar Contraseña */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginTop: "12px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff4757",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: 0,
                }}
              >
                <Lock size={14} />
                {showPasswordChange ? "Cancelar cambio de contraseña" : "¿Deseas cambiar tu contraseña?"}
              </button>

              {showPasswordChange && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "14px", marginTop: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={saving}
                className="customer-profile-btn-full"
                style={{
                  backgroundColor: "#ff4757",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(255, 71, 87, 0.25)",
                  transition: "all 0.2s ease",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card: Preferencias Gastronómicas */}
        <div
          className="customer-profile-card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "26px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#fff7ed", color: "#f97316" }}>
                <Heart size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  Tus Gustos y Preferencias Gastronómicas
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
                  Usamos esto para recomendarte los mejores restaurantes y platos en la app
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPrefModalOpen(true)}
              className="customer-profile-btn-full"
              style={{
                backgroundColor: "#fff1f2",
                color: "#e11d48",
                border: "1px solid #fecdd3",
                padding: "8px 16px",
                borderRadius: "30px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Sparkles size={14} />
              Personalizar Gustos
            </button>
          </div>

          {selectedPrefCategories.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
              {selectedPrefCategories.map((cat) => {
                const CategoryIcon = cat.icon;
                return (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 14px",
                      borderRadius: "30px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#334155",
                    }}
                  >
                    <CategoryIcon size={16} />
                    <span>{cat.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Aún no has configurado tus comidas favoritas. Haz clic en "Personalizar Gustos" para recibir recomendaciones personalizadas.
              </p>
            </div>
          )}
        </div>

        {/* Card: Seguridad y Privacidad */}
        <div
          className="customer-profile-card"
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <ShieldCheck size={26} color="#10b981" />
          <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
            <strong>Privacidad de tus datos:</strong> Tu información personal y número de cédula se almacenan de manera segura bajo encriptación y solo se utilizan para la emisión de comprobantes autorizados y para la logística de entrega de tus pedidos.
          </div>
        </div>

        {/* Card: Zona de Peligro / Eliminar Cuenta */}
        <div
          className="customer-profile-card"
          style={{
            backgroundColor: "#fff5f5",
            borderRadius: "16px",
            border: "1px solid #fed7d7",
            padding: "22px 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", maxWidth: "600px" }}>
            <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#fee2e2", color: "#e53e3e", marginTop: "2px" }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#9b2c2c", margin: 0 }}>
                Zona de Peligro: Eliminar Cuenta
              </h3>
              <p style={{ fontSize: "13px", color: "#742a2a", margin: "4px 0 0", lineHeight: "1.5" }}>
                Si decides eliminar tu cuenta, se borrarán todos tus datos personales, direcciones de entrega y accesos permanentemente. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setDeleteModalOpen(true);
            }}
            className="customer-profile-btn-full"
            style={{
              backgroundColor: "#e53e3e",
              color: "#ffffff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(229, 62, 62, 0.25)",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Trash2 size={16} />
            Eliminar mi cuenta
          </button>
        </div>
      </div>

      {/* Modal de Preferencias */}
      <FoodPreferencesModal
        isOpen={prefModalOpen}
        onClose={() => setPrefModalOpen(false)}
        onPreferencesUpdated={(newPrefs) => {
          setPreferences(newPrefs);
          updateUser({ preferences: newPrefs });
        }}
      />

      {/* Modal de Confirmación para Eliminar Cuenta */}
      {deleteModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              maxWidth: "480px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#fee2e2", color: "#e53e3e" }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                  ¿Eliminar tu cuenta definitivamente?
                </h3>
                <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: "700" }}>Acción irreversible</span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
              Esta acción eliminará de forma permanente tu usuario <strong>@{username}</strong>, tu perfil de cliente y tus preferencias gastronómicas. Ya no podrás iniciar sesión con este correo ni recuperar tu cuenta.
            </p>

            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#991b1b", marginBottom: "8px" }}>
                Para confirmar, escribe la palabra <span style={{ textDecoration: "underline" }}>ELIMINAR</span> a continuación:
              </label>
              <input
                type="text"
                placeholder="Escribe ELIMINAR"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError(null);
                }}
                disabled={deletingAccount}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #fca5a5",
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  color: "#991b1b",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {deleteError && (
              <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600" }}>
                {systemIconForEmoji("⚠️")} {deleteError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingAccount}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: deletingAccount ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== "ELIMINAR" || deletingAccount}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: deleteConfirmText.trim().toUpperCase() === "ELIMINAR" ? "#e53e3e" : "#cbd5e1",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: deleteConfirmText.trim().toUpperCase() === "ELIMINAR" && !deletingAccount ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                {deletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingAccount ? "Eliminando..." : "Sí, eliminar mi cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
