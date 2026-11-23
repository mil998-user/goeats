import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShoppingBag,
  Store,
  User as UserIcon,
  Link as LinkIcon,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { RiderIllustration } from "../components/LandingIllustrations";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import {
  getEmailError,
  getNameError,
  getPasswordError,
  getPhoneError,
  getUsernameError,
  isValidCedula,
  isValidRuc,
} from "../utils/accountValidation";
import "../styles/auth.css";

declare global {
  interface Window {
    google?: any;
    FB?: any;
  }
}

// Only pages of this site, so a link can't send someone elsewhere after logging in
function getSafeReturnTo() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo");
  if (!params.get("expired") || !returnTo) return null;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.startsWith("/\\") || returnTo.startsWith("/login")) {
    return null;
  }
  return returnTo;
}

// A customer who logs in from a restaurant page goes back to it (and to the cart kept there)
function getRestaurantReturnTo() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return returnTo && /^\/r\/[a-z0-9-]+(\/mesa\/\d+)?$/.test(returnTo) ? returnTo : null;
}

// A customer without an address sets it first, keeping the restaurant to go back to afterwards
function getLocationSetupPath() {
  const restaurantPath = getRestaurantReturnTo();
  return restaurantPath ? `/customer/location-setup?returnTo=${encodeURIComponent(restaurantPath)}` : "/customer/location-setup";
}

// Each role lands on its own panel after logging in
function getHomeForRole(user: { role: string; deliveryAddress?: string | null }) {
  switch (user.role) {
    case "SUPER_ADMIN":
      return "/admin/restaurants";
    case "PRODUCCION":
      return "/kitchen";
    case "MOTORIZADO":
      return "/delivery";
    case "CUSTOMER":
      return user.deliveryAddress ? getRestaurantReturnTo() || "/restaurants" : getLocationSetupPath();
    case "RESTAURANT_OWNER":
      return "/reports";
    default:
      return "/pos";
  }
}

// Some server messages are still in English
function translateError(message?: string) {
  if (!message) return "No se pudo completar. Intenta de nuevo.";
  if (/username is already taken/i.test(message)) return "Ese nombre de usuario ya está en uso. Prueba con otro.";
  if (/slug is already taken/i.test(message)) return "Ese enlace del restaurante ya está en uso. Prueba con otro.";
  if (/username and password are required/i.test(message)) return "Escribe tu usuario y tu contraseña.";
  return message;
}

type Role = "customer" | "driver" | "restaurant";
type StepId = "role" | "personal" | "contact" | "vehicle" | "business" | "account";

const ROLE_INFO: Record<Role, { label: string; desc: string; icon: React.ElementType }> = {
  customer: { label: "Cliente", desc: "Pide comida a domicilio o para retirar.", icon: ShoppingBag },
  driver: { label: "Repartidor", desc: "Lleva pedidos por Loja cuando tú quieras.", icon: Bike },
  restaurant: { label: "Restaurante", desc: "Recibe y gestiona los pedidos de tu local.", icon: Store },
};

// Steps of the sign up, one small group of fields at a time
const ROLE_STEPS: Record<Role, StepId[]> = {
  customer: ["personal", "contact", "account"],
  driver: ["personal", "contact", "vehicle", "account"],
  restaurant: ["personal", "business", "account"],
};

const STEP_TITLES: Record<StepId, string> = {
  role: "¿Qué cuenta quieres crear?",
  personal: "Cuéntanos quién eres",
  contact: "¿Cómo te contactamos?",
  vehicle: "Tu vehículo",
  business: "Tu restaurante",
  account: "Crea tu acceso",
};

const VEHICLES = [
  { id: "MOTO", label: "Moto", icon: Bike },
  { id: "BICI", label: "Bicicleta", icon: Bike },
  { id: "AUTO", label: "Auto", icon: Car },
] as const;

const readRoleParam = (): Role | null => {
  const role = new URLSearchParams(window.location.search).get("role");
  return role === "customer" || role === "driver" || role === "restaurant" ? role : null;
};

// Field with an icon on the left; the input itself is passed as the child
const Field: React.FC<{ label: string; icon: React.ElementType; hint?: string; children: React.ReactNode }> = ({
  label,
  icon: Icon,
  hint,
  children,
}) => (
  <label className="au-field">
    <span className="au-label">{label}</span>
    <span className="au-input-wrap">
      <Icon size={18} className="au-input-icon" aria-hidden="true" />
      {children}
    </span>
    {hint && <small className="au-hint">{hint}</small>}
  </label>
);

export const Auth: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">(() =>
    new URLSearchParams(window.location.search).get("mode") === "register" ? "register" : "login"
  );
  // The role only matters to sign up; logging in is the same for everyone
  const [regRole, setRegRole] = useState<Role | null>(readRoleParam);
  const [roleFromLink] = useState(() => readRoleParam() !== null);
  const [stepIndex, setStepIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<Role | null>(null);

  const [error, setError] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("expired")
      ? "Tu sesión se cerró por seguridad. Vuelve a ingresar para continuar."
      : null
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const cardRef = useRef<HTMLDivElement>(null);

  // Steps of the current sign up; the role choice comes first unless the link already chose it
  const steps: StepId[] = regRole ? [...(roleFromLink ? [] : (["role"] as StepId[])), ...ROLE_STEPS[regRole]] : ["role"];
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const countedSteps = steps.filter((s) => s !== "role");
  const stepNumber = step === "role" ? 0 : countedSteps.indexOf(step) + 1;

  useEffect(() => {
    window.scrollTo(0, 0);
    // Moving between sign up steps puts the focus on the first field, so the keyboard can keep going.
    // Not on the login screen: on a phone it would open the keyboard as soon as the page loads.
    if (mode === "login") return;
    const first = cardRef.current?.querySelector<HTMLInputElement>(".au-step input, .au-step button.au-choice");
    first?.focus({ preventScroll: true });
  }, [mode, step, confirming]);

  const handleRestaurantNameChange = (val: string) => {
    setRestaurantName(val);
    setSlug(
      val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const goTo = (next: "login" | "register") => {
    setMode(next);
    setError(null);
    setConfirming(false);
    setStepIndex(0);
    setShowPassword(false);
  };

  const handleSocialSuccess = async (data: { provider: "google" | "facebook"; idToken?: string; accessToken?: string }) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest("/auth/social-login", { method: "POST", body: JSON.stringify(data) });
      if (!res?.success || !res?.token || !res?.user) {
        throw new Error(res?.message || "La autenticación social no fue autorizada por el servidor.");
      }
      login(res.token, res.user);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      if (res.user.role === "CUSTOMER" && returnTo === "/plus#pricing-plans") navigate(returnTo);
      else if (res.user.role !== "CUSTOMER") navigate("/restaurants");
      else navigate(res.user.deliveryAddress ? getRestaurantReturnTo() || "/restaurants" : getLocationSetupPath());
    } catch (err: any) {
      setError(err.message || "Error al autenticar credenciales con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const showSocial = mode === "login" || (regRole === "customer" && step === "personal" && !confirming);

  // Google Identity Services: one tap and the official button where the social buttons are shown
  useEffect(() => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id || !showSocial) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response.credential) handleSocialSuccess({ provider: "google", idToken: response.credential });
        },
        auto_select: false,
      });
      if (mode === "login") window.google.accounts.id.prompt();
      setTimeout(() => {
        const container = document.getElementById("google-signin-official-btn");
        if (container && window.google?.accounts?.id) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: Math.min(container.clientWidth || 320, 400),
            text: "continue_with",
            shape: "pill",
            logo_alignment: "center",
          });
        }
      }, 150);
    } catch (err) {
      console.warn("Google GIS init error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSocial, mode]);

  // Facebook SDK
  useEffect(() => {
    const fbAppId = (import.meta as any).env.VITE_FACEBOOK_APP_ID;
    if (!fbAppId) return;
    const initFB = () => {
      if (window.FB) window.FB.init({ appId: fbAppId, cookie: true, xfbml: true, version: "v19.0" });
    };
    if (window.FB) initFB();
    else (window as any).fbAsyncInit = initFB;
  }, []);

  const handleGoogleClick = () => {
    setError(null);
    if (!(import.meta as any).env.VITE_GOOGLE_CLIENT_ID) {
      setError("El acceso con Google todavía no está configurado.");
      return;
    }
    if (!window.google?.accounts?.id) {
      setError("No se pudo cargar Google. Revisa tu conexión a internet.");
      return;
    }
    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          setError("No se pudo abrir el selector de Google (" + notification.getNotDisplayedReason() + ").");
        }
      });
    } catch (err: any) {
      setError("Error iniciando Google: " + err.message);
    }
  };

  const handleFacebookClick = () => {
    setError(null);
    if (!(import.meta as any).env.VITE_FACEBOOK_APP_ID) {
      setError("El acceso con Facebook todavía no está configurado.");
      return;
    }
    if (!window.FB) {
      setError("No se pudo cargar Facebook. Puede que una extensión del navegador lo esté bloqueando.");
      return;
    }
    setLoading(true);
    try {
      window.FB.login(
        (response: any) => {
          setLoading(false);
          if (response.authResponse?.accessToken) {
            handleSocialSuccess({ provider: "facebook", accessToken: response.authResponse.accessToken });
          } else {
            setError("Cancelaste el ingreso con Facebook.");
          }
        },
        { scope: (import.meta as any).env.VITE_FACEBOOK_SCOPE || "public_profile" }
      );
    } catch (err: any) {
      setLoading(false);
      setError("Error iniciando Facebook: " + err.message);
    }
  };

  // ---------- Login (same for every role) ----------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Escribe tu usuario y tu contraseña.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      login(res.token, res.user);
      navigate(getSafeReturnTo() || getHomeForRole(res.user));
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // ---------- Sign up, step by step ----------
  const stepError = (id: StepId): string | null => {
    switch (id) {
      case "role":
        return regRole ? null : "Elige el tipo de cuenta.";
      case "personal":
        return getNameError(name) || getEmailError(email);
      case "contact":
        if (getPhoneError(phone)) return getPhoneError(phone);
        if (regRole === "driver") return isValidCedula(cedula) ? null : "Revisa tu cédula, el número no es válido.";
        return isValidCedula(cedula) || isValidRuc(cedula) ? null : "Revisa tu cédula o RUC, el número no es válido.";
      case "vehicle":
        if (vehicleType === "BICI") return null;
        return /^[A-Z0-9-]{5,9}$/.test(vehiclePlate.trim()) ? null : "Escribe la placa del vehículo (ej. ABC-1234).";
      case "business":
        if (restaurantName.trim().length < 2) return "Escribe el nombre de tu restaurante.";
        if (address.trim().length < 5) return "Escribe la dirección del local.";
        if (getPhoneError(phone)) return getPhoneError(phone);
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? null : "El enlace solo puede tener letras, números y guiones.";
      case "account":
        return getUsernameError(username.trim()) || getPasswordError(password);
    }
  };

  // What the person checks before moving on
  const stepSummary = (id: StepId): { label: string; value: string }[] => {
    switch (id) {
      case "personal":
        return [
          { label: regRole === "restaurant" ? "Responsable" : "Nombre", value: name.trim() },
          { label: "Correo", value: email.trim() },
        ];
      case "contact":
        return [
          { label: "Celular", value: phone.trim() },
          { label: regRole === "driver" ? "Cédula" : "Cédula o RUC", value: cedula },
        ];
      case "vehicle":
        return [
          { label: "Vehículo", value: VEHICLES.find((v) => v.id === vehicleType)?.label || "" },
          ...(vehicleType !== "BICI" ? [{ label: "Placa", value: vehiclePlate.trim() }] : []),
        ];
      case "business":
        return [
          { label: "Restaurante", value: restaurantName.trim() },
          { label: "Dirección", value: address.trim() },
          { label: "Teléfono", value: phone.trim() },
          { label: "Enlace", value: `/r/${slug}` },
        ];
      case "account":
        return [{ label: "Usuario", value: username.trim() }];
      default:
        return [];
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = stepError(step);
    if (problem) {
      setError(problem);
      return;
    }
    if (step === "role") {
      setStepIndex((i) => i + 1);
      return;
    }
    setConfirming(true);
  };

  const handleConfirm = () => {
    setError(null);
    if (step === "account") {
      submitRegistration();
      return;
    }
    setConfirming(false);
    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    setError(null);
    if (mode === "login") {
      navigate("/");
      return;
    }
    if (registeredRole) {
      setRegisteredRole(null);
      goTo("login");
      return;
    }
    if (confirming) {
      setConfirming(false);
      return;
    }
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    goTo("login");
  };

  const submitRegistration = async () => {
    if (!regRole) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        username: username.trim(),
        password,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      let endpoint = "/auth/register-customer";
      if (regRole === "customer") {
        payload.cedula = cedula;
      } else if (regRole === "driver") {
        endpoint = "/auth/register-driver";
        payload.cedula = cedula;
        payload.vehicleType = vehicleType;
        payload.vehiclePlate = vehicleType === "BICI" ? "" : vehiclePlate.trim();
      } else {
        endpoint = "/auth/register-owner";
        payload.restaurantName = restaurantName.trim();
        payload.slug = slug;
        payload.address = address.trim();
      }

      const res = await apiRequest(endpoint, { method: "POST", body: JSON.stringify(payload) });

      if (regRole === "customer") {
        if (!res?.token || !res?.user) throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
        login(res.token, res.user);
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        navigate(returnTo === "/plus#pricing-plans" ? returnTo : getLocationSetupPath());
        return;
      }
      // Drivers and restaurants wait for the team to approve them
      setPassword("");
      setConfirming(false);
      setRegisteredRole(regRole);
    } catch (err: any) {
      setConfirming(false);
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // Test accounts, only while developing (never in a published build)
  const sandboxLogin = async (user: string, fallback?: () => Promise<unknown>) => {
    setError(null);
    setLoading(true);
    try {
      let res;
      try {
        res = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ username: user, password: user }) });
      } catch (loginErr) {
        if (!fallback) throw loginErr;
        await fallback();
        res = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ username: user, password: user }) });
      }
      login(res.token, res.user);
      navigate(getHomeForRole(res.user));
    } catch (err: any) {
      setError(err.message || "Error sandbox");
    } finally {
      setLoading(false);
    }
  };

  const SANDBOX = [
    {
      label: "Cliente",
      user: "cliente",
      fallback: () =>
        apiRequest("/auth/register-customer", {
          method: "POST",
          body: JSON.stringify({ username: "cliente", password: "cliente", name: "Cliente Sandbox", email: "cliente@sandbox.com", cedula: "1712345678" }),
        }),
    },
    {
      label: "Motorizado",
      user: "driver",
      fallback: () =>
        apiRequest("/auth/register-driver", {
          method: "POST",
          body: JSON.stringify({ username: "driver", password: "driver", name: "Motorizado Sandbox", email: "driver@sandbox.com", cedula: "1787654321" }),
        }),
    },
    { label: "Dueño", user: "owner" },
    { label: "Cajero", user: "cajero" },
    { label: "Cocina", user: "cocina" },
    { label: "Mesero", user: "mesero" },
    { label: "Admin", user: "admin" },
  ];

  // ---------- Pieces of the form ----------
  const passwordField = (autoComplete: string) => (
    <Field label="Contraseña" icon={Lock} hint={mode === "register" ? "Al menos 8 caracteres, con letras y números." : undefined}>
      <input
        type={showPassword ? "text" : "password"}
        className="au-input au-input-pass"
        placeholder="Tu contraseña"
        autoComplete={autoComplete}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="button"
        className="au-eye"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </Field>
  );

  const socialButtons = (
    <div className="au-social">
      <div className="au-divider">
        <span>{mode === "login" ? "o entra con" : "o regístrate con"}</span>
      </div>
      <div id="google-signin-official-btn" className="au-google-slot">
        <button type="button" className="au-social-btn" onClick={handleGoogleClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google
        </button>
      </div>
      <button type="button" className="au-social-btn" onClick={handleFacebookClick}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          <path fill="#ffffff" d="M16.671 15.543l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.513V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z" />
        </svg>
        Facebook
      </button>
      {mode === "login" && <p className="au-social-note">Google y Facebook son solo para cuentas de cliente.</p>}
    </div>
  );

  const renderStepFields = () => {
    switch (step) {
      case "role":
        return (
          <div className="au-choices" role="radiogroup" aria-label="Tipo de cuenta">
            {(Object.keys(ROLE_INFO) as Role[]).map((role) => {
              const info = ROLE_INFO[role];
              const Icon = info.icon;
              const selected = regRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${info.label}: ${info.desc}`}
                  className={`au-choice tone-${role}${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    setRegRole(role);
                    setError(null);
                  }}
                >
                  <span className="au-choice-icon">
                    <Icon size={22} />
                  </span>
                  <span className="au-choice-text">
                    <strong>{info.label}</strong>
                    <small>{info.desc}</small>
                  </span>
                  <span className="au-choice-check" aria-hidden="true">
                    <Check size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        );
      case "personal":
        return (
          <>
            <Field label={regRole === "restaurant" ? "Nombre del responsable" : "Nombre y apellido"} icon={UserIcon}>
              <input
                className="au-input"
                placeholder={regRole === "restaurant" ? "Ej. Carlos Andrade" : "Ej. Juan Pérez"}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Correo electrónico" icon={Mail} hint="Aquí te llegan la bienvenida y los avisos de tus pedidos.">
              <input
                type="email"
                className="au-input"
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </>
        );
      case "contact":
        return (
          <>
            <Field label="Celular (WhatsApp)" icon={Phone}>
              <input
                type="tel"
                inputMode="tel"
                className="au-input"
                placeholder="Ej. 0991234567"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field
              label={regRole === "driver" ? "Cédula" : "Cédula o RUC"}
              icon={Shield}
              hint={regRole === "driver" ? "10 dígitos." : "10 dígitos (cédula) o 13 (RUC)."}
            >
              <input
                className="au-input"
                inputMode="numeric"
                placeholder={regRole === "driver" ? "10 dígitos" : "10 o 13 dígitos"}
                maxLength={regRole === "driver" ? 10 : 13}
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </>
        );
      case "vehicle":
        return (
          <>
            <span className="au-label">¿Con qué vas a repartir?</span>
            <div className="au-chips" role="radiogroup" aria-label="Vehículo">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={vehicleType === v.id}
                  className={`au-chip${vehicleType === v.id ? " is-selected" : ""}`}
                  onClick={() => setVehicleType(v.id)}
                >
                  <v.icon size={18} /> {v.label}
                </button>
              ))}
            </div>
            {vehicleType !== "BICI" && (
              <Field label="Placa" icon={Car}>
                <input
                  className="au-input"
                  placeholder="Ej. ABC-1234"
                  maxLength={9}
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                />
              </Field>
            )}
          </>
        );
      case "business":
        return (
          <>
            <Field label="Nombre del restaurante" icon={Store}>
              <input
                className="au-input"
                placeholder="Ej. Picantería El Sabor"
                value={restaurantName}
                onChange={(e) => handleRestaurantNameChange(e.target.value)}
              />
            </Field>
            <Field label="Dirección del local" icon={MapPin}>
              <input
                className="au-input"
                placeholder="Ej. Av. Universitaria y 10 de Agosto"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <Field label="Teléfono del local" icon={Phone}>
              <input
                type="tel"
                inputMode="tel"
                className="au-input"
                placeholder="Ej. 0991234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Enlace de tu menú" icon={LinkIcon} hint={`${window.location.host}/r/${slug || "tu-restaurante"}`}>
              <input
                className="au-input"
                placeholder="tu-restaurante"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </Field>
          </>
        );
      case "account":
        return (
          <>
            <Field label="Nombre de usuario" icon={UserIcon} hint="Con este usuario vas a ingresar. Sin espacios.">
              <input
                className="au-input"
                placeholder="Ej. juanperez"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              />
            </Field>
            {passwordField("new-password")}
          </>
        );
    }
  };

  // ---------- Screens ----------
  const renderLogin = () => (
    <>
      <div className="au-head">
        <h1>Bienvenido de vuelta</h1>
        <p>Clientes, restaurantes y repartidores entran por aquí.</p>
      </div>

      {error && (
        <p className="au-error" role="alert">
          {error}
        </p>
      )}

      <form className="au-step" onSubmit={handleLogin} noValidate>
        <Field label="Usuario" icon={UserIcon}>
          <input
            className="au-input"
            placeholder="Tu usuario"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        {passwordField("current-password")}
        <button type="submit" className="au-btn au-btn-primary" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      {socialButtons}

      <p className="au-switch">
        ¿No tienes cuenta?{" "}
        <button type="button" onClick={() => goTo("register")}>
          Crear cuenta
        </button>
      </p>

      {import.meta.env.DEV && (
        <details className="au-sandbox">
          <summary>Accesos de prueba</summary>
          <div className="au-sandbox-grid">
            {SANDBOX.map((s) => (
              <button key={s.user} type="button" disabled={loading} onClick={() => sandboxLogin(s.user, s.fallback)}>
                {s.label}
              </button>
            ))}
          </div>
        </details>
      )}
    </>
  );

  const renderRegister = () => {
    if (registeredRole) {
      return (
        <div className="au-done">
          <span className="au-done-icon">
            <Check size={30} />
          </span>
          <h1>¡Solicitud enviada!</h1>
          <p>
            {registeredRole === "restaurant"
              ? "Revisaremos los datos de tu restaurante y te avisaremos por correo cuando esté aprobado."
              : "Revisaremos tus datos de repartidor y te avisaremos por correo cuando tu cuenta esté aprobada."}{" "}
            Después podrás ingresar con tu usuario <strong>{username}</strong>.
          </p>
          <button
            type="button"
            className="au-btn au-btn-primary"
            onClick={() => {
              setRegisteredRole(null);
              goTo("login");
            }}
          >
            Ir a iniciar sesión <ArrowRight size={18} />
          </button>
        </div>
      );
    }

    const summary = stepSummary(step);
    const isLast = step === "account";

    return (
      <>
        <div className="au-head">
          {stepNumber > 0 && (
            <div className="au-progress" aria-label={`Paso ${stepNumber} de ${countedSteps.length}`}>
              <span className="au-progress-text">
                Paso {stepNumber} de {countedSteps.length}
                {regRole && ` · ${ROLE_INFO[regRole].label}`}
              </span>
              <span className="au-progress-bar">
                {countedSteps.map((s, i) => (
                  <i key={s} className={i < stepNumber ? "is-done" : ""} />
                ))}
              </span>
            </div>
          )}
          <h1>{confirming ? "¿Tus datos están bien?" : STEP_TITLES[step]}</h1>
          {step === "role" && <p>Elige una opción para empezar.</p>}
          {confirming && <p>Revísalos antes de seguir. Si algo está mal, puedes corregirlo.</p>}
        </div>

        {error && (
          <p className="au-error" role="alert">
            {error}
          </p>
        )}

        {confirming ? (
          <div className="au-step au-confirm" key={`confirm-${step}`}>
            <dl>
              {summary.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="au-actions">
              <button type="button" className="au-btn au-btn-ghost" onClick={() => setConfirming(false)} disabled={loading}>
                Corregir
              </button>
              <button type="button" className="au-btn au-btn-primary" onClick={handleConfirm} disabled={loading}>
                {loading ? "Creando..." : isLast ? "Crear mi cuenta" : "Sí, continuar"}
              </button>
            </div>
          </div>
        ) : (
          <form className="au-step" key={step} onSubmit={handleContinue} noValidate>
            {renderStepFields()}
            <button type="submit" className="au-btn au-btn-primary" disabled={loading}>
              Continuar <ArrowRight size={18} />
            </button>
          </form>
        )}

        {showSocial && socialButtons}

        <p className="au-switch">
          ¿Ya tienes cuenta?{" "}
          <button type="button" onClick={() => goTo("login")}>
            Inicia sesión
          </button>
        </p>
      </>
    );
  };

  return (
    <div className="au">
      {/* Panel de marca (solo en pantallas grandes) */}
      <aside className="au-side" aria-hidden="true">
        <BrandLogo size={34} />
        <div className="au-side-copy">
          <h2>Pide, cocina y reparte en <span className="ge-mark">un solo lugar.</span></h2>
          <p>Una sola cuenta de GoEats para clientes, restaurantes y repartidores de Loja.</p>
        </div>
        <div className="au-side-art">
          <RiderIllustration />
        </div>
      </aside>

      <main className="au-main">
        <div className="au-top">
          <button type="button" className="au-back" onClick={handleBack}>
            <ArrowLeft size={18} />
            {mode === "login" ? "Inicio" : "Volver"}
          </button>
          <span className="au-top-logo">
            <BrandLogo size={26} />
          </span>
        </div>

        <div className="au-card" ref={cardRef}>
          {mode === "login" ? renderLogin() : renderRegister()}
        </div>
      </main>
    </div>
  );
};
