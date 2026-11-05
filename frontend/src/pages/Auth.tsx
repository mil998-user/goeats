import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import { LogIn, UserPlus, Shield, Store, Mail, Lock, User as UserIcon, Link, ShoppingBag, Truck, ArrowLeft, Eye, EyeOff, Phone, MapPin } from "lucide-react";


declare global {
  interface Window {
    google?: any;
    FB?: any;
  }
}

export const Auth: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<"customer" | "driver" | "restaurant" | "superadmin" | null>(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    return role === "superadmin" || role === "restaurant" || role === "driver" || role === "customer"
      ? role
      : "customer";
  });
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("role") === "superadmin" || params.get("mode") !== "register";
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedRole]);



  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cedula, setCedula] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [vehicleType, setVehicleType] = useState<"MOTO" | "BICI" | "AUTO">("MOTO");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const handleSlugChange = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
  };

  const handleRestaurantNameChange = (val: string) => {
    setRestaurantName(val);
    const autoSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  };

  const handleBack = () => {
    navigate("/");
  };


  const handleSocialSuccess = async (data: {
    provider: "google" | "facebook";
    idToken?: string;
    accessToken?: string;
  }) => {
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest("/auth/social-login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res?.success || !res?.token || !res?.user) {
        throw new Error(res?.message || "La autenticación social no fue autorizada por el servidor.");
      }

      login(res.token, res.user);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      if (res.user.role === "CUSTOMER" && returnTo === "/plus#pricing-plans") {
        navigate(returnTo);
      } else {
        navigate(res.user.role === "CUSTOMER" && !res.user.deliveryAddress ? "/customer/location-setup" : "/restaurants");
      }
    } catch (err: any) {
      console.error("Error en login social:", err);
      setError(err.message || "Error al autenticar credenciales con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Google Identity Services (GIS) automatic prompt & init
  useEffect(() => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              handleSocialSuccess({
                provider: "google",
                idToken: response.credential,
              });
            }
          },
          auto_select: false,
        });

        if (selectedRole === "customer") {
          window.google.accounts.id.prompt();
          setTimeout(() => {
            const btnContainer = document.getElementById("google-signin-official-btn");
            if (btnContainer && window.google?.accounts?.id) {
              window.google.accounts.id.renderButton(btnContainer, {
                theme: "outline",
                size: "large",
                width: 360,
                text: "continue_with",
                shape: "rectangular",
                logo_alignment: "center",
              });
            }
          }, 150);
        }
      } catch (err) {
        console.warn("Google GIS init error:", err);
      }
    }
  }, [selectedRole]);

  // Facebook SDK initialization
  useEffect(() => {
    const fbAppId = (import.meta as any).env.VITE_FACEBOOK_APP_ID;
    if (fbAppId) {
      const initFB = () => {
        if (window.FB) {
          window.FB.init({
            appId: fbAppId,
            cookie: true,
            xfbml: true,
            version: "v19.0",
          });
        }
      };
      if (window.FB) {
        initFB();
      } else {
        (window as any).fbAsyncInit = initFB;
      }
    }
  }, []);

  const handleGoogleClick = () => {
    setError(null);
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Para conectar con Google en vivo, debes colocar tu VITE_GOOGLE_CLIENT_ID en frontend/.env");
      return;
    }
    if (!window.google?.accounts?.id) {
      setError("El SDK de Google no está disponible. Revisa tu conexión a internet.");
      return;
    }

    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          setError("El selector de Google no se pudo desplegar automáticamente (" + notification.getNotDisplayedReason() + "). Verifica tus orígenes autorizados en Google Cloud Console.");
        }
      });
    } catch (err: any) {
      setError("Error iniciando Google Sign-In: " + err.message);
    }
  };

  const handleFacebookClick = () => {
    setError(null);
    const appId = (import.meta as any).env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      setError("Para conectar con Facebook en vivo, debes colocar tu VITE_FACEBOOK_APP_ID en frontend/.env");
      return;
    }
    if (!window.FB) {
      setError("El SDK de Facebook no está listo o fue bloqueado por una extensión de tu navegador.");
      return;
    }

    setLoading(true);
    try {
      window.FB.login((response: any) => {
        setLoading(false);
        if (response.authResponse?.accessToken) {
          handleSocialSuccess({
            provider: "facebook",
            accessToken: response.authResponse.accessToken,
          });
        } else {
          setError("Cancelaste el inicio de sesión con Facebook o no se concedieron los permisos requeridos.");
        }
      }, { scope: (import.meta as any).env.VITE_FACEBOOK_SCOPE || "public_profile" });
    } catch (err: any) {
      setLoading(false);
      setError("Error iniciando Facebook: " + err.message);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        login(res.token, res.user);
        if (res.user.role === "SUPER_ADMIN") {
          navigate("/admin/restaurants");
        } else if (res.user.role === "PRODUCCION") {
          navigate("/kitchen");
        } else if (res.user.role === "MOTORIZADO") {
          navigate("/delivery");
        } else if (res.user.role === "CUSTOMER") {
          navigate(res.user.deliveryAddress ? "/restaurants" : "/customer/location-setup");
        } else if (res.user.role === "RESTAURANT_OWNER") {
          navigate("/reports");
        } else {
          navigate("/pos");
        }
      } else {
        const currentRegType = selectedRole === "customer" ? "customer" : selectedRole === "driver" ? "driver" : "owner";
        let endpoint = "/auth/register-owner";
        let payload: any = { username, password, name, email };

        if (currentRegType === "owner") {
          endpoint = "/auth/register-owner";
          payload.restaurantName = restaurantName;
          payload.slug = slug;
          payload.address = address;
          payload.phone = phone;
        } else if (currentRegType === "customer") {
          endpoint = "/auth/register-customer";
          payload.cedula = cedula;
          payload.phone = phone;
        } else if (currentRegType === "driver") {
          endpoint = "/auth/register-driver";
          payload.cedula = cedula;
          payload.phone = phone;
          payload.vehicleType = vehicleType;
          payload.vehiclePlate = vehiclePlate;
        }

        const res = await apiRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (currentRegType === "customer") {
          login(res?.token || ("token-" + Date.now()), res?.user || {
            id: Date.now(),
            username,
            name: name || username,
            email: email || `${username}@gmail.com`,
            role: "CUSTOMER",
            cedula,
            walletBalance: 0,
            isPlus: false,
          });
          setError(null);
          const returnTo = new URLSearchParams(window.location.search).get("returnTo");
          navigate(returnTo === "/plus#pricing-plans" ? returnTo : "/customer/location-setup");
          return;
        }
        
        setIsLogin(true);
        setError(null);
        alert(
          currentRegType === "owner"
            ? "¡Restaurante registrado con éxito! Hemos enviado un correo de confirmación de tu solicitud. Ya puedes iniciar sesión."
            : "¡Repartidor registrado con éxito! Hemos enviado tu correo de bienvenida. Ya puedes iniciar sesión."
        );
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in" style={{
      display: "flex",
      alignItems: selectedRole === null ? "center" : "flex-start",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      background: "linear-gradient(135deg, var(--bg-primary) 0%, #e2e8f0 100%)"
    }}>
      {selectedRole === null ? (
        <div style={{ width: "100%", maxWidth: "900px", textAlign: "center" }} className="animate-fade-in">
          <h1 style={{
            fontSize: "42px",
            fontWeight: "800",
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "10px",
            fontFamily: "var(--font-title)"
          }}>
            GoEats
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "40px" }}>
            Selecciona tu perfil de ingreso para comenzar
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "25px",
            marginBottom: "30px"
          }}>
            {/* CARD 1: CLIENTE */}
            <div
              onClick={() => {
                setSelectedRole("customer");
                setIsLogin(true);
              }}
              style={{
                backgroundColor: "#ffffff",
                padding: "40px 30px",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all var(--transition-fast)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                e.currentTarget.style.borderColor = "#ff4757";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }}
            >
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 71, 87, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ff4757"
              }}>
                <ShoppingBag size={28} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Cliente Comensal
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                Pide comida a domicilio, agenda retiros en local o pide desde tu mesa con códigos QR.
              </p>
            </div>

            {/* CARD 2: REPARTIDOR */}
            <div
              onClick={() => {
                setSelectedRole("driver");
                setIsLogin(true);
              }}
              style={{
                backgroundColor: "#ffffff",
                padding: "40px 30px",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all var(--transition-fast)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                e.currentTarget.style.borderColor = "#2ed573";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }}
            >
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(46, 213, 115, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2ed573"
              }}>
                <Truck size={28} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Motorizado / Repartidor
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                Entrega pedidos a domicilio, recarga tu saldo de billetera y gestiona tus ganancias.
              </p>
            </div>

            {/* CARD 3: RESTAURANTE */}
            <div
              onClick={() => {
                setSelectedRole("restaurant");
                setIsLogin(true);
              }}
              style={{
                backgroundColor: "#ffffff",
                padding: "40px 30px",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all var(--transition-fast)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "15px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                e.currentTarget.style.borderColor = "#fbbf24";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }}
            >
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(251, 191, 36, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fbbf24"
              }}>
                <Store size={28} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                Restaurante (Interno)
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                Ingreso para Dueños de Restaurante, Cajeros, Cocineros y personal de Meseros.
              </p>
            </div>

          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            flexWrap: "wrap",
            marginTop: "10px"
          }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "10px 22px",
                borderRadius: "30px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--border-light)",
                color: "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "14px",
                boxShadow: "var(--shadow-sm)",
                transition: "all var(--transition-fast)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Volver a la Página Principal
            </button>

            <button
              onClick={() => {
                setSelectedRole("superadmin");
                setIsLogin(true);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "30px",
                backgroundColor: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                color: "#7c3aed",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                transition: "all var(--transition-fast)",
                boxShadow: "var(--shadow-sm)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#7c3aed";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.08)";
                e.currentTarget.style.color = "#7c3aed";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <Shield size={15} />
              Acceso SuperAdmin
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card animate-fade-in mobile-p-md mobile-full-width" style={{
          width: "100%",
          maxWidth: "480px",
          padding: "40px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "#ffffff",
          boxShadow: "var(--shadow-lg)"
        }}>
          {/* Header & Back Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <button
              onClick={handleBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                backgroundColor: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                fontSize: "13px"
              }}
            >
              <ArrowLeft size={16} />
              Volver
            </button>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              backgroundColor: "var(--bg-tertiary)",
              padding: "4px 10px",
              borderRadius: "12px",
              color: selectedRole === "customer" ? "#ff4757" : selectedRole === "driver" ? "#2ed573" : selectedRole === "superadmin" ? "#8b5cf6" : "#fbbf24"
            }}>
              {selectedRole === "customer" ? "Comensal" : selectedRole === "driver" ? "Motorizado" : selectedRole === "superadmin" ? "SuperAdmin" : "Restaurante"}
            </span>
          </div>

          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <h2 style={{ fontSize: "24px", color: "var(--text-primary)", fontWeight: "800", margin: "0 0 5px 0" }}>
              {isLogin ? "Iniciar Sesión" : selectedRole === "restaurant" ? "Registrar Restaurante" : selectedRole === "driver" ? "Registrar Conductor" : "Crear Cuenta"}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>
              {selectedRole === "restaurant" && isLogin
                ? "Dueños, Cajeros, Cocina y Meseros"
                : selectedRole === "superadmin"
                ? "Administrador Global de la Plataforma"
                : selectedRole === "customer" && !isLogin
                ? "Regístrate al instante con tu cuenta de Google o Facebook"
                : "Ingresa tus credenciales para continuar"}
            </p>
          </div>

          {/* Tab Selector (only for Customer/Driver OR Restaurant (as owner register)) */}
          {selectedRole !== "superadmin" && selectedRole !== "customer" && (
            <div style={{
              display: "flex",
              background: "var(--bg-tertiary)",
              borderRadius: "var(--radius-md)",
              padding: "4px",
              marginBottom: "25px",
              border: "1px solid var(--border-light)"
            }}>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(null); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: isLogin ? "#ffffff" : "transparent",
                  color: isLogin ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: isLogin ? "var(--shadow-sm)" : "none",
                  transition: "all var(--transition-fast)"
                }}
              >
                <LogIn size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: !isLogin ? "#ffffff" : "transparent",
                  color: !isLogin ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: !isLogin ? "var(--shadow-sm)" : "none",
                  transition: "all var(--transition-fast)"
                }}
              >
                <UserPlus size={15} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                {selectedRole === "restaurant" ? "Registrar Local" : "Registrarse"}
              </button>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: "rgba(255, 71, 87, 0.08)",
              border: "1px solid rgba(255, 71, 87, 0.2)",
              color: "var(--accent-primary)",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              marginBottom: "20px",
              fontSize: "13px"
            }}>
              {error}
            </div>
          )}

          {/* Social Auth Buttons for Customers */}
          {selectedRole === "customer" && (
            <div style={{ marginBottom: "26px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Google Button */}
                <div id="google-signin-official-btn" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      width: "100%",
                      height: "48px",
                      padding: "0 20px",
                      borderRadius: "12px",
                      border: "1.5px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      color: "#1e293b",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      transition: "all 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continuar con Google</span>
                  </button>
                </div>

                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={handleFacebookClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    width: "100%",
                    height: "48px",
                    padding: "0 20px",
                    borderRadius: "12px",
                    border: "1.5px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    <path fill="#ffffff" d="M16.671 15.543l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.513V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z"/>
                  </svg>
                  <span>Continuar con Facebook</span>
                </button>
              </div>

              {/* Minimalist modern divider */}
              <div style={{
                display: "flex",
                alignItems: "center",
                margin: "24px 0 16px",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: "500"
              }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
                <span style={{ padding: "0 14px", color: "#64748b" }}>o con tu usuario y contraseña</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
              </div>
            </div>
          )}

          {/* Registration / Login Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                {/* Name */}
                <div className="input-group">
                  <label>
                    {selectedRole === "restaurant" ? "Nombre del Dueño / Representante" : "Nombre y Apellido"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <UserIcon size={18} style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)"
                    }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: "45px" }}
                      placeholder={selectedRole === "restaurant" ? "Ej. Carlos Andrade" : "Ej. Juan Pérez"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="input-group">
                  <label>Correo Electrónico (Notificaciones)</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)"
                    }} />
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: "45px" }}
                      placeholder="tucorreo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px", display: "block" }}>
                    Aquí recibirás la bienvenida y alertas de pedidos en tiempo real.
                  </small>
                </div>

                {/* Phone (All roles) */}
                <div className="input-group">
                  <label>
                    {selectedRole === "restaurant" ? "Teléfono de Contacto del Local" : "Teléfono Celular WhatsApp"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone size={18} style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)"
                    }} />
                    <input
                      type="tel"
                      className="input-field"
                      style={{ paddingLeft: "45px" }}
                      placeholder="Ej. 0991234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Cedula (Customer and Driver only) */}
                {(selectedRole === "customer" || selectedRole === "driver") && (
                  <div className="input-group">
                    <label>Cédula de Identidad (10 dígitos ecuatorianos)</label>
                    <div style={{ position: "relative" }}>
                      <Shield size={18} style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)"
                      }} />
                      <input
                        type="text"
                        className="input-field"
                        style={{ paddingLeft: "45px" }}
                        placeholder="Ej. 1712345678"
                        value={cedula}
                        maxLength={10}
                        onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Driver specific: Vehicle Type and Plate */}
                {selectedRole === "driver" && (
                  <>
                    <div className="input-group">
                      <label>Tipo de Vehículo de Reparto</label>
                      <div style={{ position: "relative" }}>
                        <Truck size={18} style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)"
                        }} />
                        <select
                          className="input-field"
                          style={{ paddingLeft: "45px" }}
                          value={vehicleType}
                          onChange={(e: any) => setVehicleType(e.target.value)}
                          required
                        >
                          <option value="MOTO">Motocicleta</option>
                          <option value="BICI">Bicicleta</option>
                          <option value="AUTO">Automóvil / Furgoneta</option>
                        </select>
                      </div>
                    </div>

                    {vehicleType !== "BICI" && (
                      <div className="input-group">
                        <label>Placa del Vehículo</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Ej. ABC-1234"
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Restaurant Owner specific fields */}
                {selectedRole === "restaurant" && (
                  <>
                    {/* Restaurant Name */}
                    <div className="input-group">
                      <label>Nombre Comercial del Restaurante</label>
                      <div style={{ position: "relative" }}>
                        <Store size={18} style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)"
                        }} />
                        <input
                          type="text"
                          className="input-field"
                          style={{ paddingLeft: "45px" }}
                          placeholder="Ej. Pizzería Napolitana Gourmet"
                          value={restaurantName}
                          onChange={(e) => handleRestaurantNameChange(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="input-group">
                      <label>Dirección del Local</label>
                      <div style={{ position: "relative" }}>
                        <MapPin size={18} style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)"
                        }} />
                        <input
                          type="text"
                          className="input-field"
                          style={{ paddingLeft: "45px" }}
                          placeholder="Ej. Av. Amazonas N24-15 y Colón"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Restaurant Slug */}
                    <div className="input-group">
                      <label>Subdominio / Slug URL</label>
                      <div style={{ position: "relative" }}>
                        <Link size={18} style={{
                          position: "absolute",
                          left: "14px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)"
                        }} />
                        <input
                          type="text"
                          className="input-field"
                          style={{ paddingLeft: "45px" }}
                          placeholder="ej-pizzeria-napolitana"
                          value={slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          required
                        />
                      </div>
                      <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px", display: "block" }}>
                        Enlace de tu menú: http://localhost:5173/r/{slug || "slug"}
                      </small>
                    </div>
                  </>
                )}
              </>
            )}


              {/* Username */}
              <div className="input-group">
                <label>Nombre de Usuario</label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={18} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: "45px" }}
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-group" style={{ marginBottom: "30px" }}>
                <label>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    style={{ paddingLeft: "45px", paddingRight: "45px" }}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: showPassword ? "var(--accent-primary, #ff4757)" : "var(--text-muted, #718096)",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="glow-btn"
                style={{ width: "100%", padding: "14px", fontSize: "16px" }}
                disabled={loading}
              >
                {loading ? "Procesando..." : isLogin ? "Ingresar al Sistema" : selectedRole === "restaurant" ? "Crear Restaurante" : "Registrarse"}
              </button>
            </form>

          {/* Sandbox Quick Access (Only when in Login tab) */}
          {isLogin && (
            <div style={{
              marginTop: "25px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-light)",
              textAlign: "center"
            }}>
              <h3 style={{
                fontSize: "11px",
                color: "var(--accent-secondary)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 800
              }}>
                Acceso Rápido Sandbox
              </h3>
              
              {selectedRole === "customer" && (
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      let loginRes;
                      try {
                        loginRes = await apiRequest("/auth/login", {
                          method: "POST",
                          body: JSON.stringify({ username: "cliente", password: "cliente" }),
                        });
                      } catch (loginErr) {
                        await apiRequest("/auth/register-customer", {
                          method: "POST",
                          body: JSON.stringify({
                            username: "cliente",
                            password: "cliente",
                            name: "Cliente Sandbox",
                            email: "cliente@sandbox.com",
                            cedula: "1712345678"
                          })
                        });
                        loginRes = await apiRequest("/auth/login", {
                          method: "POST",
                          body: JSON.stringify({ username: "cliente", password: "cliente" }),
                        });
                      }
                      login(loginRes.token, loginRes.user);
                      navigate("/restaurants");
                    } catch (err: any) {
                      setError(err.message || "Error sandbox");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(255, 71, 87, 0.05)",
                    border: "1px solid rgba(255, 71, 87, 0.15)",
                    color: "var(--accent-primary)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Ingresar como Cliente (cliente / cliente)
                </button>
              )}

              {selectedRole === "driver" && (
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      let loginRes;
                      try {
                        loginRes = await apiRequest("/auth/login", {
                          method: "POST",
                          body: JSON.stringify({ username: "driver", password: "driver" }),
                        });
                      } catch (loginErr) {
                        await apiRequest("/auth/register-driver", {
                          method: "POST",
                          body: JSON.stringify({
                            username: "driver",
                            password: "driver",
                            name: "Motorizado Sandbox",
                            email: "driver@sandbox.com",
                            cedula: "1787654321"
                          })
                        });
                        loginRes = await apiRequest("/auth/login", {
                          method: "POST",
                          body: JSON.stringify({ username: "driver", password: "driver" }),
                        });
                      }
                      login(loginRes.token, loginRes.user);
                      navigate("/delivery");
                    } catch (err: any) {
                      setError(err.message || "Error sandbox");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(46, 213, 115, 0.05)",
                    border: "1px solid rgba(46, 213, 115, 0.15)",
                    color: "var(--success)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Ingresar como Motorizado (driver / driver)
                </button>
              )}

              {selectedRole === "restaurant" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {[
                    { label: "Dueño", user: "owner", color: "#fbbf24" },
                    { label: "Cajero", user: "cajero", color: "var(--success)" },
                    { label: "Cocinero", user: "cocina", color: "var(--warning)" },
                    { label: "Mesero", user: "mesero", color: "#3498db" }
                  ].map((roleInfo) => (
                    <button
                      key={roleInfo.user}
                      type="button"
                      onClick={async () => {
                        setError(null);
                        setLoading(true);
                        try {
                          const res = await apiRequest("/auth/login", {
                            method: "POST",
                            body: JSON.stringify({ username: roleInfo.user, password: roleInfo.user }),
                          });
                          login(res.token, res.user);
                          if (res.user.role === "PRODUCCION") navigate("/kitchen");
                          else navigate("/pos");
                        } catch (err: any) {
                          setError(err.message || "Error sandbox");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{
                        padding: "8px 5px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-light)",
                        color: "var(--text-primary)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {roleInfo.label} ({roleInfo.user})
                    </button>
                  ))}
                </div>
              )}

              {selectedRole === "superadmin" && (
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setLoading(true);
                    try {
                      const res = await apiRequest("/auth/login", {
                        method: "POST",
                        body: JSON.stringify({ username: "admin", password: "admin" }),
                      });
                      login(res.token, res.user);
                      navigate("/admin/restaurants");
                    } catch (err: any) {
                      setError(err.message || "Error sandbox");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(139, 92, 246, 0.05)",
                    border: "1px solid rgba(139, 92, 246, 0.15)",
                    color: "#8b5cf6",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Ingresar como SuperAdmin (admin / admin)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {selectedRole === null && (
        <button
          onClick={() => {
            setSelectedRole("superadmin");
            setIsLogin(true);
          }}
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all var(--transition-fast)",
            zIndex: 1000
          }}
          title="Panel de Administración"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        >
          <Shield size={16} />
        </button>
      )}


    </div>
  );
};
