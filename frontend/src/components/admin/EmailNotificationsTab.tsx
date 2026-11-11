import React, { useState, useEffect } from "react";
import { apiRequest } from "../../utils/api";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface EmailLog {
  id: number;
  userId: number | null;
  recipientEmail: string;
  type: string;
  template: string;
  subject: string;
  status: "PENDING" | "SENDING" | "SENT" | "FAILED";
  providerMessageId: string | null;
  error: string | null;
  eventId: string | null;
  metadataJson: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  gmailConfig: {
    isReady: boolean;
    isOAuthReady?: boolean;
    isGmailSmtp?: boolean;
    smtpHost?: string;
    user: string | null;
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasRefreshToken: boolean;
  };
}

export const EmailNotificationsTab: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Test email state
  const [testEmail, setTestEmail] = useState("");
  const [testRole, setTestRole] = useState<"CUSTOMER" | "DRIVER" | "RESTAURANT">("CUSTOMER");
  const [sendingTest, setSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Retry state
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);

  // Direct config state
  const [refreshTokenInput, setRefreshTokenInput] = useState("");
  const [appPasswordInput, setAppPasswordInput] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        apiRequest(`/notifications/logs?status=${filterStatus}&search=${encodeURIComponent(searchTerm)}`),
        apiRequest("/notifications/stats"),
      ]);
      setLogs(logsRes.logs || []);
      setStats(statsRes.stats || null);
    } catch (err: any) {
      console.error("Error loading email notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    try {
      setSendingTest(true);
      setTestMessage(null);
      const res = await apiRequest("/notifications/test-email", {
        method: "POST",
        body: JSON.stringify({ to: testEmail, role: testRole }),
      });
      setTestMessage({ text: res.message || "Correo de prueba enviado con éxito", type: "success" });
      loadData();
    } catch (err: any) {
      setTestMessage({ text: err.message || "Error al enviar correo de prueba", type: "error" });
    } finally {
      setSendingTest(false);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      setRetryingId(id);
      await apiRequest(`/notifications/retry/${id}`, { method: "POST" });
      loadData();
    } catch (err: any) {
      alert("Error al reintentar: " + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      const res = await apiRequest("/notifications/retry-all", { method: "POST" });
      if (res.message) {
        alert(res.message);
      }
      await loadData();
    } catch (e: any) {
      alert("Error al reintentar correos: " + e.message);
    } finally {
      setRetryingAll(false);
    }
  };

  const handleSaveRefreshToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refreshTokenInput.trim()) return;
    setSavingConfig(true);
    setConfigSuccessMsg(null);
    try {
      const res = await apiRequest("/notifications/config", {
        method: "POST",
        body: JSON.stringify({
          gmailUser: "eatsgo015@gmail.com",
          gmailRefreshToken: refreshTokenInput.trim(),
        }),
      });
      if (res.success) {
        setConfigSuccessMsg("¡Gmail API activada correctamente!");
        setRefreshTokenInput("");
        loadData();
      }
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveAppPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appPasswordInput.trim()) return;
    setSavingConfig(true);
    setConfigSuccessMsg(null);
    try {
      const res = await apiRequest("/notifications/config", {
        method: "POST",
        body: JSON.stringify({
          smtpHost: "smtp.gmail.com",
          smtpPort: 465,
          smtpSecure: true,
          smtpUser: "eatsgo015@gmail.com",
          smtpPass: appPasswordInput.trim().replace(/\s+/g, ""),
        }),
      });
      if (res.success) {
        setConfigSuccessMsg("¡Gmail SMTP con Contraseña de Aplicación activado!");
        setAppPasswordInput("");
        loadData();
      }
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. STATUS CARD & OAUTH HEALTH */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                padding: "8px",
                borderRadius: "10px",
                background: "rgba(255, 71, 87, 0.1)",
                color: "#ff4757"
              }}>
                <Mail size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 700 }}>
                  Sistema de Correos con Gmail API & OAuth2
                </h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                  Arquitectura unificada por Roles (Clientes, Repartidores, Restaurantes) y prevención de duplicados
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", minWidth: 0, maxWidth: "100%" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 700,
              backgroundColor: stats?.gmailConfig.isReady ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
              color: stats?.gmailConfig.isReady ? "#10b981" : "#f59e0b",
              border: stats?.gmailConfig.isReady ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)"
            }}>
              {stats?.gmailConfig.isOAuthReady ? (
                <>
                  <ShieldCheck size={16} />
                  <span>Gmail API OAuth2 Activo ({stats.gmailConfig.user})</span>
                </>
              ) : stats?.gmailConfig.isGmailSmtp ? (
                <>
                  <ShieldCheck size={16} />
                  <span>Gmail SMTP Activo ({stats.gmailConfig.user})</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Gmail Pendiente (Configurar OAuth2 o Contraseña de App)</span>
                </>
              )}
            </div>

            <button
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Info size={14} />
              <span>Instrucciones OAuth2</span>
              {showConfigGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* GUÍA DE CONFIGURACIÓN DESPLEGABLE */}
        {showConfigGuide && (
          <div style={{
            marginTop: "20px",
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#e2e8f0",
            fontSize: "13px",
            lineHeight: 1.6
          }}>
            {configSuccessMsg && (
              <div style={{
                padding: "12px 16px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid #10b981",
                borderRadius: "8px",
                color: "#34d399",
                fontWeight: "600",
                marginBottom: "16px"
              }}>
                ✓ {configSuccessMsg}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "20px" }}>
              {/* OPCION 1: OAUTH2 GMAIL API */}
              <div style={{ padding: "16px", backgroundColor: "#1e293b", borderRadius: "10px", border: "1px solid #334155" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#38bdf8", fontSize: "14px", fontWeight: "700" }}>
                  Opción 1: Activar Gmail API con OAuth2 (Oficial)
                </h4>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                  Conecta directamente con la API REST de Google sobre HTTPS (puerto 443).
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <a
                    href="https://developers.google.com/oauthplayground"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 14px",
                      backgroundColor: "#0284c7",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      textDecoration: "none"
                    }}
                  >
                    1. Clic aquí para Autorizar con tu Gmail (eatsgo015@gmail.com) <ExternalLink size={13} />
                  </a>

                  <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                    Configura las credenciales OAuth en el entorno del backend (<code>GMAIL_CLIENT_ID</code> y <code>GMAIL_CLIENT_SECRET</code>). En OAuth Playground, usa esas credenciales, autoriza Gmail y copia el <strong>Refresh token</strong>.
                  </p>

                  <form onSubmit={handleSaveRefreshToken} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="text"
                      placeholder="Pega el Refresh Token (1//0...)"
                      value={refreshTokenInput}
                      onChange={(e) => setRefreshTokenInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #475569",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        fontSize: "13px"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={savingConfig || !refreshTokenInput.trim()}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: savingConfig ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {savingConfig ? "Guardando..." : "Activar Gmail API"}
                    </button>
                  </form>
                </div>
              </div>

              {/* OPCION 2: CONTRASEÑA DE APLICACION (GMAIL SMTP) */}
              <div style={{ padding: "16px", backgroundColor: "#1e293b", borderRadius: "10px", border: "1px solid #334155" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#f59e0b", fontSize: "14px", fontWeight: "700" }}>
                  Opción 2: Usar Contraseña de Aplicación (Gmail SMTP)
                </h4>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                  Si prefieres SMTP con SSL en puerto 465 mediante contraseña de 16 caracteres.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 14px",
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      color: "#fbbf24",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      textDecoration: "none"
                    }}
                  >
                    1. Crear Contraseña de Aplicación en Google <ExternalLink size={13} />
                  </a>

                  <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                    Inicia sesión con <code>eatsgo015@gmail.com</code>, crea una contraseña con nombre "GoEats" y copia las 16 letras.
                  </p>

                  <form onSubmit={handleSaveAppPassword} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="password"
                      placeholder="Contraseña de 16 letras"
                      value={appPasswordInput}
                      onChange={(e) => setAppPasswordInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #475569",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        fontSize: "13px"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={savingConfig || !appPasswordInput.trim()}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: "#f59e0b",
                        color: "#0f172a",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: savingConfig ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {savingConfig ? "Guardando..." : "Activar Gmail SMTP"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* METRICS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginTop: "20px"
        }}>
          <div style={{ padding: "16px", background: "var(--bg-tertiary)", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>TOTAL CORREOS</div>
            <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{stats?.total ?? 0}</div>
          </div>
          <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <div style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>ENVIADOS CON ÉXITO</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>{stats?.sent ?? 0}</div>
          </div>
          <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <div style={{ fontSize: "13px", color: "#ef4444", fontWeight: 600 }}>FALLIDOS / ERRORES</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>{stats?.failed ?? 0}</div>
          </div>
          <div style={{ padding: "16px", background: "rgba(59, 130, 246, 0.05)", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <div style={{ fontSize: "13px", color: "#3b82f6", fontWeight: 600 }}>PROTECCIÓN DUPLICADOS</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", marginTop: "8px" }}>Activa (EventId Lock)</div>
          </div>
        </div>
      </div>

      {/* 2. SEND TEST EMAIL FORM */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "20px 24px",
      }}>
        <h3 style={{ fontSize: "15px", margin: "0 0 14px 0", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <Send size={16} color="var(--accent-primary)" />
          Probar Envío en Vivo
        </h3>
        <form onSubmit={handleSendTest} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <input
            type="email"
            placeholder="Introduce tu correo personal para recibir la prueba..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            required
            style={{
              flex: "1 1 260px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              fontSize: "13px"
            }}
          />
          <select
            value={testRole}
            onChange={(e: any) => setTestRole(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              fontSize: "13px"
            }}
          >
            <option value="CUSTOMER">Plantilla: Cliente (Bienvenida)</option>
            <option value="DRIVER">Plantilla: Repartidor (Bienvenida)</option>
            <option value="RESTAURANT">Plantilla: Restaurante (Solicitud recibida)</option>
          </select>
          <button
            type="submit"
            disabled={sendingTest}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#ff4757",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              cursor: sendingTest ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(255, 71, 87, 0.3)"
            }}
          >
            {sendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            {sendingTest ? "Enviando..." : "Enviar Prueba"}
          </button>
        </form>

        {testMessage && (
          <div style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            backgroundColor: testMessage.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: testMessage.type === "success" ? "#10b981" : "#ef4444",
            border: testMessage.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {testMessage.text}
          </div>
        )}
      </div>

      {/* 3. LOGS TABLE */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        overflow: "hidden"
      }}>
        {/* Table Filters Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ fontSize: "16px", margin: 0, fontWeight: 700 }}>Historial de Notificaciones</h3>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>({logs.length} registros)</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", maxWidth: "100%" }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: "13px"
              }}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="SENT">Enviados (SENT)</option>
              <option value="FAILED">Fallidos (FAILED)</option>
              <option value="SENDING">En Proceso (SENDING)</option>
            </select>

            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "6px", maxWidth: "100%" }}>
              <input
                type="text"
                placeholder="Buscar correo o asunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  width: "180px"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Buscar
              </button>
            </form>

            {logs.some(l => l.status === "FAILED") && (
              <button
                onClick={handleRetryAll}
                disabled={retryingAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: retryingAll ? "not-allowed" : "pointer"
                }}
                title="Reintentar todos los correos fallidos"
              >
                <RefreshCw size={12} className={retryingAll ? "animate-spin" : ""} />
                <span>{retryingAll ? "Reintentando..." : "Reintentar Fallidos"}</span>
              </button>
            )}

            <button
              onClick={loadData}
              title="Refrescar"
              style={{
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: "auto" }}>
          <table className="mobile-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-light)" }}>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Fecha / Hora</th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Destinatario</th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Evento / Asunto</th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Plantilla</th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Estado</th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                    Cargando historial de correos...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No se encontraron correos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("es-EC", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {log.recipientEmail}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.subject}</div>
                      <div style={{ fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>
                        {log.type} {log.eventId ? `• [${log.eventId}]` : ""}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "13px", fontFamily: "monospace" }}>
                      {log.template}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {log.status === "SENT" && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 700,
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          color: "#10b981",
                        }}>
                          <CheckCircle size={12} /> ENVIADO
                        </span>
                      )}
                      {log.status === "FAILED" && (
                        <div>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "13px",
                            fontWeight: 700,
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                          }} title={log.error || undefined}>
                            <XCircle size={12} /> FALLÓ
                          </span>
                          {log.error && (
                            <div style={{
                              fontSize: "13px",
                              color: "#f87171",
                              marginTop: "4px",
                              maxWidth: "200px",
                              lineHeight: 1.3,
                              wordBreak: "break-word"
                            }}>
                              {log.error}
                            </div>
                          )}
                        </div>
                      )}
                      {(log.status === "PENDING" || log.status === "SENDING") && (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 700,
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                          color: "#3b82f6",
                        }}>
                          <Clock size={12} /> PROCESANDO
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {log.status === "FAILED" && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            cursor: retryingId === log.id ? "not-allowed" : "pointer"
                          }}
                        >
                          <RefreshCw size={10} className={retryingId === log.id ? "animate-spin" : ""} />
                          {retryingId === log.id ? "Reintentando..." : "Reintentar"}
                        </button>
                      )}
                      {log.status === "SENT" && (
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {log.providerMessageId ? "ID: " + log.providerMessageId.substring(0, 16) + "..." : "Completado"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
