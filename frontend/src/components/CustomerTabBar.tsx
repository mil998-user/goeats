import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Receipt, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Rutas del cliente donde va la barra; el catalogo no, porque alli abajo va el carrito
const ROUTES = ["/restaurants", "/customer/dashboard", "/customer/profile", "/plus"];
const MOBILE_QUERY = "(max-width: 768px)";

// Barra inferior tipo app para el cliente en el celular
export const CustomerTabBar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isCustomer = !isAuthenticated || user?.role === "CUSTOMER";
  const visible = isMobile && isCustomer && ROUTES.includes(location.pathname);

  // Espacio abajo para que la barra no tape el contenido
  useEffect(() => {
    document.body.classList.toggle("has-tabbar", visible);
    return () => document.body.classList.remove("has-tabbar");
  }, [visible]);

  if (!visible) return null;

  const loginPath = "/login?role=customer";
  const profileTab = location.pathname === "/customer/dashboard" && location.search.includes("tab=profile");
  const tabs = [
    { to: "/restaurants", label: "Inicio", icon: Home, active: location.pathname === "/restaurants" },
    {
      to: isAuthenticated ? "/customer/dashboard" : loginPath,
      label: "Pedidos",
      icon: Receipt,
      active: location.pathname === "/customer/dashboard" && !profileTab,
    },
    { to: "/plus", label: "Plus", icon: Sparkles, active: location.pathname === "/plus" },
    {
      to: isAuthenticated ? "/customer/dashboard?tab=profile" : loginPath,
      label: isAuthenticated ? "Perfil" : "Entrar",
      icon: UserRound,
      active: profileTab || location.pathname === "/customer/profile",
    },
  ];

  return (
    <nav className="tabbar" aria-label="Navegación del cliente">
      {tabs.map(({ to, label, icon: Icon, active }) => (
        <Link key={label} to={to} className={`tabbar-item${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
          <Icon size={20} strokeWidth={active ? 2.4 : 2} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};
