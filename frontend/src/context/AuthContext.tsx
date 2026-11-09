import React, { createContext, useCallback, useContext, useState, useEffect } from "react";
import { SESSION_EXPIRED_EVENT } from "../utils/api";

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
      localStorage.removeItem("goeats_token");
      localStorage.removeItem("goeats_user");
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
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("goeats_token");
    localStorage.removeItem("goeats_user");
    // On a shared device the next person must not see the previous customer's cart
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith("goeats_cart_"))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // Storage can be blocked; nothing was saved then
    }
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("goeats_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

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
