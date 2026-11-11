import React, { useState } from "react";
import { PlatformBankInfo } from "../components/PlatformBankInfo";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import { 
  ShieldCheck, 
  Heart,
  Sparkles,
  Zap,
  Loader2,
  CheckCircle,
  Clock
} from "lucide-react";
import { systemIconForEmoji } from "../utils/systemIcons";

// Pago con tarjeta apagado hasta tener proveedor (VITE_CARD_PAYMENTS=true lo enciende)
const CARD_PAYMENTS_ENABLED = import.meta.env.VITE_CARD_PAYMENTS === "true";



export const PlusPromo: React.FC = () => {
  const { user, token, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  React.useEffect(() => {
    // Sin sesión la sección de planes no se muestra; no se piden al servidor.
    if (!isAuthenticated) {
      setLoadingPlans(false);
      return;
    }
    const fetchPlans = async () => {
      try {
        const res = await apiRequest("/saas/plans");
        if (res.success) {
          setPlans(res.plans || []);
        }
      } catch (err) {
        console.error("Error loading plans in promo page:", err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (location.hash !== "#pricing-plans") return;
    const timer = window.setTimeout(() => {
      document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  // Scroll to plans
  const scrollToPlans = () => {
    document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth" });
  };

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [modalStep, setModalStep] = useState<"auth" | "checkout" | "success">("auth");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCedula, setRegCedula] = useState("");

  // Checkout states
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "TRANSFER">(CARD_PAYMENTS_ENABLED ? "CARD" : "TRANSFER");
  const [paymentReceipt, setPaymentReceipt] = useState<string>("");
  const [payphoneTransactionId, setPayphoneTransactionId] = useState<string>("");
  const [showPayphoneSimulator, setShowPayphoneSimulator] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);

  // Handle plan card click
  const handleSelectPlan = (plan: { name: string; amount: number; desc: string }) => {
    setSelectedPlan(plan);
    setPaymentReceipt("");
    setPayphoneTransactionId("");
    setAuthError(null);

    if (isAuthenticated) {
      setModalStep("checkout");
    } else {
      setModalStep("auth");
      setAuthTab("login");
    }
    setShowModal(true);
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        setModalStep("checkout");
      }
    } catch (err: any) {
      setAuthError(err.message || "Credenciales incorrectas");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      // 1. Register customer
      const regRes = await apiRequest("/auth/register-customer", {
        method: "POST",
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword,
          cedula: regCedula,
        }),
      });

      if (regRes.success) {
        // 2. Automatically log in after registration
        const logRes = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            username: regUsername,
            password: regPassword,
          }),
        });

        if (logRes.success && logRes.token && logRes.user) {
          login(logRes.token, logRes.user);
          setModalStep("checkout");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Error al registrarse");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
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
        if (paymentMethod === "CARD" && user) {
          login(token!, {
            ...user,
            isPlus: true,
          } as any);
        }
        setModalStep("success");
      }
    } catch (err: any) {
      alert(err.message || "Error al adquirir membresía");
    } finally {
      setSubmittingSub(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "var(--bg-primary)", 
      color: "var(--text-primary)", 
      fontFamily: "var(--font-body)", 
      overflowX: "hidden" 
    }}>
      {/* Navbar overlay */}
      <nav style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "20px 40px", 
        maxWidth: "1200px", 
        margin: "0 auto",
        borderBottom: "1px solid var(--border-light)"
      }}>
        <Link to="/restaurants" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", textDecoration: "none", fontWeight: 800, fontSize: "20px" }}>
          <span style={{ color: "#ff4757" }}>GoEats</span> <span style={{ color: "#fbbf24" }}>Plus {systemIconForEmoji("✨")}</span>
        </Link>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link to="/restaurants" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
            Inicio
          </Link>
          {isAuthenticated && user ? (
            <Link to="/customer/dashboard" style={{ 
              backgroundColor: "var(--text-primary)", 
              color: "var(--bg-primary)", 
              border: "none", 
              padding: "8px 18px", 
              borderRadius: "20px", 
              fontWeight: "bold", 
              fontSize: "14px", 
              textDecoration: "none"
            }}>
              Mi Panel
            </Link>
          ) : (
            <Link to="/login?role=customer&mode=register" style={{ 
              backgroundColor: "var(--text-primary)", 
              color: "var(--bg-primary)", 
              border: "none", 
              padding: "8px 18px", 
              borderRadius: "20px", 
              fontWeight: "bold", 
              fontSize: "14px", 
              textDecoration: "none"
            }}>
              Crear cuenta
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        textAlign: "center", 
        padding: "80px 20px 60px 20px", 
        maxWidth: "800px", 
        margin: "0 auto",
        position: "relative"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          color: "#d97706",
          padding: "6px 16px",
          borderRadius: "50px",
          fontSize: "13px",
          fontWeight: 700,
          marginBottom: "24px"
        }}>
          <Sparkles size={14} /> CLUB EXCLUSIVO GOEATS
        </div>
        <h1 style={{ 
          fontSize: "clamp(28px, 6vw, 52px)", 
          fontWeight: 900, 
          lineHeight: "1.15", 
          margin: "0 0 20px 0",
          background: "linear-gradient(135deg, var(--text-primary) 0%, #d97706 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Tus comidas favoritas, con envíos gratis e ilimitados.
        </h1>
        <p style={{ 
          fontSize: "clamp(15px, 3.5vw, 18px)", 
          color: "var(--text-secondary)", 
          lineHeight: "1.6", 
          margin: "0 auto 35px auto",
          maxWidth: "600px" 
        }}>
          Únete a <strong>GoEats Plus</strong> y despídete del costo de envío. Disfruta de la máxima prioridad en cada orden y apoya a los motorizados sin comisiones.
        </p>
        <button 
          onClick={scrollToPlans}
          style={{ 
            backgroundColor: "#000000", 
            color: "#ffffff", 
            border: "none", 
            padding: "16px 36px", 
            borderRadius: "50px", 
            fontWeight: 800, 
            fontSize: "16px", 
            cursor: "pointer", 
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          Únete al Club Plus {systemIconForEmoji("✨")}
        </button>
      </section>

      {/* Benefits grid */}
      <section style={{ 
        maxWidth: "1100px", 
        margin: "40px auto 80px auto", 
        padding: "0 20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "24px"
      }}>
        {/* Benefit 1 */}
        <div style={{ 
          backgroundColor: "var(--bg-secondary)", 
          border: "1px solid var(--border-light)", 
          borderRadius: "16px", 
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}>
          <div style={{ backgroundColor: "rgba(46, 213, 115, 0.1)", color: "#2ed573", padding: "12px", borderRadius: "12px", width: "fit-content" }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "var(--text-primary)" }}>Envíos Gratis Ilimitados</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
            Ordena de cualquier local afiliado en la plataforma tantas veces como quieras. El costo de envío será siempre de $0.00 en todos los pedidos de delivery.
          </p>
        </div>

        {/* Benefit 2 */}
        <div style={{ 
          backgroundColor: "var(--bg-secondary)", 
          border: "1px solid var(--border-light)", 
          borderRadius: "16px", 
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}>
          <div style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", color: "#d97706", padding: "12px", borderRadius: "12px", width: "fit-content" }}>
            <Heart size={24} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "var(--text-primary)" }}>Apoyo e Incentivo al Repartidor</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
            ¡Tus envíos gratis no afectan al conductor! Al contrario: los repartidores no pagan comisión por tu pedido y reciben un <strong>bono adicional de $0.50</strong> pagado directamente por GoEats. Tus pedidos vuelan {systemIconForEmoji("🛵")}.
          </p>
        </div>

        {/* Benefit 3 */}
        <div style={{ 
          backgroundColor: "var(--bg-secondary)", 
          border: "1px solid var(--border-light)", 
          borderRadius: "16px", 
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "15px"
        }}>
          <div style={{ backgroundColor: "rgba(52, 152, 219, 0.1)", color: "#3498db", padding: "12px", borderRadius: "12px", width: "fit-content" }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "var(--text-primary)" }}>Soporte y Prioridad Premium</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
            Tus pedidos entran con etiqueta prioritaria a la cocina de los locales y son asignados de inmediato al conductor más cercano. Atención al cliente VIP en caso de cualquier novedad.
          </p>
        </div>
      </section>

      {/* Pricing packages */}
      <section id="pricing-plans" style={{ 
        backgroundColor: "var(--bg-secondary)", 
        padding: "80px 20px", 
        borderTop: "1px solid var(--border-light)"
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, margin: "0 0 10px 0", color: "var(--text-primary)" }}>Planes Flexibles para Todos</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 40px 0", fontSize: "14px" }}>Elige la suscripción que mejor se adapte a tus necesidades de consumo.</p>

          {!isAuthenticated ? (
            <div style={{ maxWidth: "560px", margin: "0 auto", padding: "30px 24px", border: "1px solid var(--border-light)", borderRadius: "16px", backgroundColor: "var(--bg-primary)" }}>
              <h3 style={{ margin: "0 0 10px", color: "var(--text-primary)" }}>Regístrate para ver los planes</h3>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 20px", fontSize: "14px", lineHeight: 1.5 }}>
                Para consultar los planes de suscripción de GoEats Plus, primero necesitas crear una cuenta.
              </p>
              <Link
                to="/login?role=customer&mode=register&returnTo=%2Fplus%23pricing-plans"
                className="glow-btn"
                style={{ display: "inline-flex", padding: "12px 22px", borderRadius: "24px", textDecoration: "none", fontWeight: 700 }}
              >
                Crear cuenta
              </Link>
            </div>
          ) : <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", 
            gap: "24px",
            alignItems: "stretch"
          }}>
            {loadingPlans ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "30px", width: "100%" }}>
                <Loader2 className="spinner" size={32} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : plans.filter(p => p.type === "PLUS_SUBSCRIPTION").length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No hay planes de suscripción disponibles.</p>
            ) : (
              plans.filter(p => p.type === "PLUS_SUBSCRIPTION").map((plan) => {
                const isRecommended = plan.discount && plan.discount.toLowerCase().includes("ahorra 33%") || plan.name.includes("Anual");
                return (
                  <div key={plan.id} style={{ 
                    backgroundColor: "var(--bg-primary)", 
                    border: isRecommended ? "2px solid #fbbf24" : "1px solid var(--border-light)", 
                    borderRadius: "16px", 
                    padding: "40px 30px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    textAlign: "left",
                    position: "relative"
                  }}>
                    {plan.discount && (
                      <div style={{
                        position: "absolute",
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#fbbf24",
                        color: "#78350f",
                        fontSize: "13px",
                        fontWeight: 900,
                        padding: "4px 12px",
                        borderRadius: "50px",
                        letterSpacing: "0.5px"
                      }}>
                        {plan.discount.toUpperCase()}
                      </div>
                    )}
                    <h3 style={{ fontSize: "18px", color: isRecommended ? "#d97706" : "var(--text-secondary)", margin: 0 }}>{plan.name}</h3>
                    <div style={{ display: "flex", alignItems: "baseline" }}>
                      <span style={{ fontSize: "42px", fontWeight: 900 }}>${plan.amount.toFixed(2)}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "4px" }}>/ {plan.period || "mes"}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>{plan.description}</p>
                    <ul style={{ paddingLeft: "20px", color: "var(--text-primary)", fontSize: "13px", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                      <li>Envíos gratis ilimitados ($0.00)</li>
                      <li>Bono de $0.50 para el repartidor</li>
                      <li>Despacho prioritario en cocina</li>
                      <li>Soporte al cliente preferencial</li>
                    </ul>
                    <button 
                      onClick={() => handleSelectPlan(plan)}
                      style={{ 
                        marginTop: "auto", 
                        backgroundColor: isRecommended ? "#fbbf24" : "#ffffff", 
                        color: isRecommended ? "#000000" : "var(--text-primary)", 
                        border: isRecommended ? "none" : "1px solid var(--border-light)", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        fontWeight: "bold", 
                        cursor: "pointer",
                        boxShadow: isRecommended ? "0 4px 12px rgba(251, 191, 36, 0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
                      }}
                    >
                      {isRecommended ? "Adquirir Plan" : "Elegir Plan"}
                    </button>
                  </div>
                );
              })
            )}
          </div>}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        textAlign: "center", 
        padding: "40px 20px", 
        color: "var(--text-secondary)", 
        fontSize: "13px",
        borderTop: "1px solid var(--border-light)",
        backgroundColor: "var(--bg-secondary)"
      }}>
        &copy; {new Date().getFullYear()} GoEats SaaS Platform. Todos los derechos reservados.
      </footer>

      {/* Dynamic Auth + Checkout Modal */}
      {showModal && selectedPlan && (
        <div className="global-modal-overlay">
          <div className="global-modal-card" style={{ maxWidth: "480px" }}>
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "1.5rem"
              }}
            >
              &times;
            </button>

            {/* STEP 1: AUTHENTICATION */}
            {modalStep === "auth" && (
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>
                  Únete a Club GoEats Plus
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Para adquirir el <strong>{selectedPlan.name}</strong> (${selectedPlan.amount.toFixed(2)}), necesitas iniciar sesión o registrarte.
                </p>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "2px solid var(--border-light)", marginBottom: "20px" }}>
                  <button
                    onClick={() => { setAuthTab("login"); setAuthError(null); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "none",
                      border: "none",
                      borderBottom: authTab === "login" ? "2px solid #ff4757" : "none",
                      fontWeight: authTab === "login" ? "bold" : "normal",
                      color: authTab === "login" ? "#ff4757" : "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => { setAuthTab("register"); setAuthError(null); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "none",
                      border: "none",
                      borderBottom: authTab === "register" ? "2px solid #ff4757" : "none",
                      fontWeight: authTab === "register" ? "bold" : "normal",
                      color: authTab === "register" ? "#ff4757" : "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Crear Cuenta
                  </button>
                </div>

                {authError && (
                  <div style={{
                    padding: "10px 14px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fee2e2",
                    color: "#dc2626",
                    fontSize: "13px",
                    borderRadius: "6px",
                    marginBottom: "15px"
                  }}>
                    {authError}
                  </div>
                )}

                {authTab === "login" ? (
                  <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Nombre de Usuario</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Ingresa tu usuario"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Contraseña</label>
                      <input
                        type="password"
                        required
                        className="input-field"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="glow-btn"
                      style={{ padding: "12px", marginTop: "10px", width: "100%" }}
                    >
                      {authLoading ? <Loader2 size={16} className="spinner" style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} /> : "Ingresar y Continuar"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Nombre Completo</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Juan Pérez"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Nombre de Usuario</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="juanperez123"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Cédula Ecuatoriana (10 dígitos)</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        className="input-field"
                        placeholder="1726354728"
                        value={regCedula}
                        onChange={(e) => setRegCedula(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        className="input-field"
                        placeholder="juan@ejemplo.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Contraseña</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="input-field"
                        placeholder="Mínimo 8, con letras y números"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="glow-btn"
                      style={{ padding: "12px", marginTop: "10px", width: "100%" }}
                    >
                      {authLoading ? <Loader2 size={16} className="spinner" style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} /> : "Registrarse y Continuar"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: CHECKOUT & PAYMENT */}
            {modalStep === "checkout" && (
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "5px" }}>
                  Confirmar Suscripción
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                  Completa tu orden para activar tu membresía Plus.
                </p>

                <form onSubmit={handleCheckoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {/* Summary Box */}
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "6px"
                  }}>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "bold", textTransform: "uppercase" }}>Plan Seleccionado:</div>
                    <div style={{ fontWeight: "bold", fontSize: "15px", margin: "2px 0" }}>{selectedPlan.name}</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#d97706" }}>${selectedPlan.amount.toFixed(2)}</div>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600" }}>Forma de Pago</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        disabled={!CARD_PAYMENTS_ENABLED}
                        title={CARD_PAYMENTS_ENABLED ? undefined : "El pago con tarjeta estará disponible pronto"}
                        type="button"
                        onClick={() => {
                          setPaymentMethod("CARD");
                          setPaymentReceipt("");
                          setPayphoneTransactionId("");
                        }}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "13px",
                          border: paymentMethod === "CARD" ? "2px solid #fbbf24" : "1px solid var(--border-light)",
                          backgroundColor: paymentMethod === "CARD" ? "rgba(251, 191, 36, 0.08)" : "var(--bg-secondary)",
                          color: "var(--text-primary)"
                        }}
                      >
                        {systemIconForEmoji("💳")} {CARD_PAYMENTS_ENABLED ? "Tarjeta" : "Tarjeta (pronto)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("TRANSFER");
                          setPayphoneTransactionId("");
                        }}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "13px",
                          border: paymentMethod === "TRANSFER" ? "2px solid #fbbf24" : "1px solid var(--border-light)",
                          backgroundColor: paymentMethod === "TRANSFER" ? "rgba(251, 191, 36, 0.08)" : "var(--bg-secondary)",
                          color: "var(--text-primary)"
                        }}
                      >
                        {systemIconForEmoji("🏦")} Transferencia
                      </button>
                    </div>
                  </div>

                  {/* Payment CARD flow */}
                  {paymentMethod === "CARD" && (
                    <div style={{ margin: "5px 0" }}>
                      {payphoneTransactionId ? (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "rgba(46, 213, 115, 0.05)",
                          border: "1px solid var(--success)",
                          padding: "12px",
                          borderRadius: "6px",
                          color: "var(--success)",
                          fontSize: "13px"
                        }}>
                          <CheckCircle size={18} />
                          <div>
                            <div style={{ fontWeight: "bold" }}>Pago Procesado Exitosamente</div>
                            <div style={{ fontSize: "13px" }}>Transacción: {payphoneTransactionId}</div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPayphoneSimulator(true)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            backgroundColor: "#ff5a00",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                        >
                          Pagar con Tarjeta (Payphone)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Payment TRANSFER flow */}
                  {paymentMethod === "TRANSFER" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <PlatformBankInfo />

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "13px", fontWeight: "600" }}>Subir Foto del Comprobante</label>
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
                          style={{ fontSize: "13px" }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="glow-btn"
                    disabled={submittingSub || (paymentMethod === "CARD" && !payphoneTransactionId) || (paymentMethod === "TRANSFER" && !paymentReceipt)}
                    style={{ padding: "14px", width: "100%", marginTop: "10px" }}
                  >
                    {submittingSub ? "Procesando..." : paymentMethod === "CARD" ? "Confirmar Suscripción" : "Enviar Comprobante"}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {modalStep === "success" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                {paymentMethod === "CARD" ? (
                  <>
                    <CheckCircle size={56} color="var(--success)" style={{ margin: "0 auto 15px auto" }} />
                    <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>¡Bienvenido al Club! {systemIconForEmoji("🎉")}</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "25px" }}>
                      Tu suscripción <strong>{selectedPlan.name}</strong> ha sido activada de inmediato. Ya puedes disfrutar de envíos 100% gratis en todos tus pedidos delivery.
                    </p>
                    <button
                      onClick={() => { setShowModal(false); navigate("/customer/dashboard"); }}
                      className="glow-btn"
                      style={{ padding: "12px 24px" }}
                    >
                      Ir a mi Panel de Cliente
                    </button>
                  </>
                ) : (
                  <>
                    <Clock size={56} color="#d97706" style={{ margin: "0 auto 15px auto" }} />
                    <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>Comprobante Recibido {systemIconForEmoji("⏳")}</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "25px" }}>
                      Hemos enviado tu comprobante al SuperAdministrador. Tan pronto sea verificado y aprobado, se activará tu membresía Club GoEats Plus.
                    </p>
                    <button
                      onClick={() => { setShowModal(false); navigate("/restaurants"); }}
                      className="glow-btn"
                      style={{ padding: "12px 24px" }}
                    >
                      Inicio
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payphone Simulator Modal */}
      {showPayphoneSimulator && selectedPlan && (
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
                Estás realizando un pago de suscripción por <strong>${selectedPlan.amount.toFixed(2)}</strong> a favor de GoEats SaaS.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Número de Tarjeta</label>
                <input type="text" style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} placeholder="4111 1111 1111 1111" defaultValue="4111 1111 1111 1111" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Vencimiento</label>
                  <input type="text" style={{ padding: "8px", borderRadius: "4px", border: "1px solid var(--border-light)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} placeholder="12/28" defaultValue="12/28" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>CVV</label>
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
        </div>
      )}
    </div>
  );
};
