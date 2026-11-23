import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
import { SESSION_EXPIRED_EVENT, apiRequest, getBaseApiUrl } from "../utils/api";
import { normalizeFoodPreferences } from "../utils/foodPreferences";

// Seguridad: la sesion se cierra sola tras 1 hora sin usar la app, y el servidor la vence a las 8 horas
const IDLE_LIMIT_MS = 60 * 60 * 1000;
const LAST_ACTIVE_KEY = "goeats_last_active";
// Gustos de comida elegidos en este navegador (con o sin sesion)
const FOOD_PREFS_KEY = "goeats_food_preferences";

function readLocalFoodPrefs(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FOOD_PREFS_KEY) || "[]");
    return Array.isArray(parsed) ? normalizeFoodPreferences(parsed.filter((v) => typeof v === "string")) : [];
  } catch {
    return [];
  }
}

// Fecha de vencimiento que trae el token (sin verificar firma; eso lo hace el servidor)
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function readLastActive(): number {
  const value = Number(localStorage.getItem(LAST_ACTIVE_KEY));
  return Number.isFinite(value) ? value : 0;
}

function isSessionStale(token: string | null): boolean {
  if (!token) return false;
  const exp = tokenExpiresAt(token);
  if (!exp || exp <= Date.now()) return true;
  return Date.now() - readLastActive() > IDLE_LIMIT_MS;
}

function clearStoredSession() {
  localStorage.removeItem("goeats_token");
  localStorage.removeItem("goeats_user");
  localStorage.removeItem(LAST_ACTIVE_KEY);
  // Los gustos de la cuenta no deben quedar para la siguiente persona del equipo
  localStorage.removeItem(FOOD_PREFS_KEY);
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("goeats_cart_") || key.startsWith("goeats_reorder"))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Storage can be blocked; nothing was saved then
  }
}

// Una sesion vieja guardada en el equipo no debe abrirse sola
if (isSessionStale(localStorage.getItem("goeats_token"))) clearStoredSession();

export type Role = "SUPER_ADMIN" | "RESTAURANT_OWNER" | "CAJERO" | "PRODUCCION" | "MOZO" | "CUSTOMER" | "MOTORIZADO";

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cedula?: string | null;
  role: Role;
  restaurantId: number | null;
  restaurantName?: string | null;
  restaurantSlug?: string | null;
  isPlus?: boolean;
  walletBalance?: number;
  createdAt?: string;
  preferences?: string[];
  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryFloorApartment?: string | null;
  deliverySecondaryStreet?: string | null;
  deliveryReferences?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("goeats_token"));
  // Read the saved session before the first render, so pages never start with an empty user
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("goeats_user");
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("goeats_user");
      return null;
    }
  });

  // Any request rejected with 401 closes the session and sends the person to log in again
  useEffect(() => {
    const handleExpired = () => {
      clearStoredSession();
      setToken(null);
      setUser(null);
      if (window.location.pathname !== "/login") {
        const back = window.location.pathname + window.location.search;
        window.location.assign(`/login?expired=1&returnTo=${encodeURIComponent(back)}`);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  // Stable functions, so pages that depend on them don't run their effects again on every render
  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("goeats_token", newToken);
    localStorage.setItem("goeats_user", JSON.stringify(newUser));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    // Avisa al servidor para que el token ya no sirva; no se espera la respuesta
    const current = localStorage.getItem("goeats_token");
    if (current) {
      fetch(`${getBaseApiUrl()}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${current}` },
        keepalive: true,
      }).catch(() => {});
    }
    // On a shared device the next person must not see the previous customer's cart
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  // Marca actividad y revisa cada minuto si la sesion vencio o quedo sin uso
  useEffect(() => {
    if (!token) return;
    let lastWrite = 0;
    const markActive = () => {
      const now = Date.now();
      if (now - lastWrite < 30000) return;
      lastWrite = now;
      localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    };
    const check = () => {
      if (!isSessionStale(localStorage.getItem("goeats_token"))) return;
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(check, 60000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [token]);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("goeats_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Si eligio gustos sin sesion y su cuenta aun no tiene, se guardan solos en la cuenta.
  // Si la cuenta ya tiene gustos propios, se respetan y no se pisan.
  const syncedPrefsFor = useRef<number | null>(null);
  useEffect(() => {
    if (!token || !user || user.role !== "CUSTOMER") return;
    if (syncedPrefsFor.current === user.id) return;
    syncedPrefsFor.current = user.id;

    if (user.preferences && user.preferences.length > 0) return;
    const localPrefs = readLocalFoodPrefs();
    if (localPrefs.length === 0) return;

    apiRequest("/auth/preferences", {
      method: "POST",
      body: JSON.stringify({ preferences: localPrefs }),
    })
      .then(() => updateUser({ preferences: localPrefs }))
      .catch(() => {
        // Si falla, se intenta otra vez en el proximo inicio de sesion
        syncedPrefsFor.current = null;
      });
  }, [token, user, updateUser]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
