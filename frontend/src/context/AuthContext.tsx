import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("goeats_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("goeats_user");
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("goeats_token", newToken);
    localStorage.setItem("goeats_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("goeats_token");
    localStorage.removeItem("goeats_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("goeats_user", JSON.stringify(updated));
      return updated;
    });
  };

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
