import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Aggregator } from "./pages/Aggregator";
import { PublicCatalog } from "./pages/PublicCatalog";
import { Auth } from "./pages/Auth";
import { POS } from "./pages/POS";
import { Kitchen } from "./pages/Kitchen";
import { Cash } from "./pages/Cash";
import { Menu } from "./pages/Menu";
import { Reports } from "./pages/Reports";
import { SuperAdmin } from "./pages/SuperAdmin";
import { DeliveryDashboard } from "./pages/DeliveryDashboard";
import { Settings as SettingsPage } from "./pages/Settings";
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { PlusPromo } from "./pages/PlusPromo";
import { Orders } from "./pages/Orders";
import { TablesPage } from "./pages/TablesPage";
import { KitchenNotificationManager } from "./components/KitchenNotificationManager";
import { SupportPage } from "./pages/SupportPage";
import { CustomerLocationSetup } from "./pages/CustomerLocationSetup";
import { LandingExperience } from "./components/LandingExperience";
import { ShoppingBag, ChefHat, Wallet, Settings, TrendingUp, LogOut, Shield, Truck, BookOpen, Menu as MenuIcon, Utensils, ClipboardList, User, HelpCircle } from "lucide-react";

// Protected Route Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their default landing page
    if (user.role === "SUPER_ADMIN") {
      return <Navigate to="/admin/restaurants" replace />;
    }
    if (user.role === "PRODUCCION") {
      return <Navigate to="/kitchen" replace />;
    }
    if (user.role === "MOTORIZADO") {
      return <Navigate to="/delivery" replace />;
    }
    if (user.role === "RESTAURANT_OWNER") {
      return <Navigate to="/reports" replace />;
    }
    if (user.role === "CAJERO" || user.role === "MOZO") {
      return <Navigate to="/pos" replace />;
    }
    return <Navigate to="/restaurants" replace />;
  }

  return <>{children}</>;
};

// Main Layout with Navbar for Auth Users
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();

  if (!user) return <>{children}</>;

  const links = [
    {
      to: "/reports",
      label: "Reportes",
      icon: TrendingUp,
      visible: user.role === "RESTAURANT_OWNER",
    },
    {
      to: "/pos",
      label: "Menú POS",
      icon: ShoppingBag,
      visible: user.role === "CAJERO" || user.role === "MOZO",
    },
    {
      to: "/orders",
      label: "Pedidos",
      icon: ClipboardList,
      visible: user.role === "RESTAURANT_OWNER" || user.role === "CAJERO" || user.role === "MOZO",
    },
    {
      to: "/tables",
      label: "Servicios de Mesa",
      icon: Utensils,
      visible: user.role === "RESTAURANT_OWNER" || user.role === "CAJERO" || user.role === "MOZO",
    },
    {
      to: "/kitchen",
      label: "Cocina KDS",
      icon: ChefHat,
      visible: user.role === "RESTAURANT_OWNER" || user.role === "PRODUCCION",
    },
    {
      to: "/cash",
      label: "Caja",
      icon: Wallet,
      visible: user.role === "RESTAURANT_OWNER" || user.role === "CAJERO",
    },
    {
      to: "/menu",
      label: "Menú (Carta)",
      icon: BookOpen,
      visible: user.role === "RESTAURANT_OWNER",
    },
    {
      to: "/settings",
      label: "Ajustes",
      icon: Settings,
      visible: user.role === "RESTAURANT_OWNER",
      subLinks: [
        { to: "/settings?tab=general", label: "Datos Generales" },
        { to: "/settings?tab=payments", label: "Métodos de Pago" },
        { to: "/settings?tab=tables", label: "Salones y Mesas" },
        { to: "/settings?tab=personal", label: "Personal / Empleados" },
        { to: "/settings?tab=cajas", label: "Cajas Registradoras" },
        { to: "/settings?tab=clientes", label: "Clientes" },
        { to: "/settings?tab=inventario", label: "Insumos / Inventario" },
      ]
    },
    {
      to: "/admin/restaurants",
      label: "SuperAdmin SaaS",
      icon: Shield,
      visible: user.role === "SUPER_ADMIN",
      subLinks: [
        { to: "/admin/restaurants?tab=restaurants", label: "Restaurantes (Tenants)" },
        { to: "/admin/restaurants?tab=approvals", label: "Aprobación de Locales" },
        { to: "/admin/restaurants?tab=saas_categories", label: "Categorías SaaS" },
        { to: "/admin/restaurants?tab=delivery", label: "Configuración de Tarifas" },
        { to: "/admin/restaurants?tab=wallet", label: "Wallet Conductores" },
        { to: "/admin/restaurants?tab=saas_customers", label: "Clientes & Plus" },
        { to: "/admin/restaurants?tab=saas_plans", label: "Planes SaaS" },
        { to: "/admin/restaurants?tab=saas_orders", label: "Pedidos SaaS" },
        { to: "/admin/restaurants?tab=emails", label: "Correos & Gmail API" },
      ]
    },
    {
      to: "/delivery",
      label: "Reparto",
      icon: Truck,
      visible: user.role === "MOTORIZADO",
    },
    {
      to: "/customer/dashboard",
      label: "Mis Pedidos",
      icon: ShoppingBag,
      visible: user.role === "CUSTOMER",
    },
    {
      to: "/customer/profile",
      label: "Mi Perfil",
      icon: User,
      visible: user.role === "CUSTOMER",
    },
    {
      to: "/support",
      label: "Ayuda & Soporte",
      icon: HelpCircle,
      visible: true,
    },
  ];

  const visibleLinks = links.filter(l => l.visible);

  // Generate initials
  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "US";

  // Sidebar component to render on desktop and as mobile drawer
  const renderSidebar = (isMobile: boolean = false) => {
    const fullCurrentPath = location.pathname + location.search;
    return (
      <div className={`pos-sidebar ${isMobile ? "open" : "mobile-hide"}`}>
        {/* Logo / Restaurant Name */}
        <div className="pos-sidebar-logo">
          <div className="pos-sidebar-logo-icon">
            <Utensils size={16} />
          </div>
          <span className="pos-sidebar-logo-text" title={user.restaurantName || "GoEats"}>
            {user.restaurantName ? (user.restaurantName.length > 12 ? `${user.restaurantName.slice(0, 12)}...` : user.restaurantName) : "GoEats"}
          </span>
        </div>

        {/* Navigation Items */}
        <div className="pos-sidebar-menu">
          {visibleLinks.map(link => {
            const Icon = link.icon;
            const isParentActive = location.pathname === link.to.split("?")[0];
            const isActive = link.to.includes("?") 
              ? fullCurrentPath === link.to
              : location.pathname === link.to && !location.search;
            return (
              <div key={link.to} style={{ display: "flex", flexDirection: "column" }}>
                <Link
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`pos-sidebar-link ${isActive ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
                
                {/* Submenus if present and parent is active */}
                {link.subLinks && isParentActive && (
                  <div className="pos-sidebar-submenu">
                    {link.subLinks.map(sub => {
                      const isSubActive = fullCurrentPath === sub.to || (sub.to.includes("tab=general") && !location.search.includes("tab=")) || (sub.to.includes("tab=restaurants") && !location.search.includes("tab="));
                      return (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setMenuOpen(false)}
                          className={`pos-sidebar-sublink ${isSubActive ? "active" : ""}`}
                        >
                          <span className="pos-sidebar-sublink-dot" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Profile & Logout */}
        <div className="pos-sidebar-footer">
          <div className="pos-sidebar-profile">
            <div className="pos-sidebar-avatar">{initials}</div>
            <div className="pos-sidebar-profile-info">
              <span className="pos-sidebar-profile-name" title={user.name}>{user.name}</span>
              <span className="pos-sidebar-profile-role">{user.role}</span>
            </div>
          </div>
          <button onClick={logout} className="pos-sidebar-logout-btn">
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
      <KitchenNotificationManager />

      {/* Left Sidebar navigation (Desktop) */}
      {renderSidebar(false)}

      {/* Mobile Drawer (Overlay and Menu Drawer) */}
      {menuOpen && (
        <div className="pos-sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}
      {menuOpen && renderSidebar(true)}

      {/* Right Column: Mobile Header & Main Page Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div
          className="mobile-show-flex"
          style={{
            height: "56px",
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-light)",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            flexShrink: 0,
            zIndex: 90
          }}
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              cursor: "pointer",
              color: "var(--text-primary)",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "40px",
              minHeight: "40px"
            }}
            title="Abrir menú"
          >
            <MenuIcon size={22} />
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px", maxWidth: "calc(100vw - 120px)", overflow: "hidden" }}>
            <span style={{
              fontSize: "15px",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {user.restaurantName || "GoEats"}
            </span>
          </div>

          <div
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-glow)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "12px",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            {initials}
          </div>
        </div>

        {/* Page Content Viewport */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingExperience />} />
            <Route path="/restaurants" element={<Aggregator />} />
            <Route path="/r/:slug" element={<PublicCatalog />} />
            <Route path="/r/:slug/mesa/:tableId" element={<PublicCatalog />} />
            <Route path="/qr/:slug/:tableId" element={<PublicCatalog />} />
            <Route path="/qr/:slug" element={<PublicCatalog />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/plus" element={<PlusPromo />} />
            <Route path="/support" element={<SupportPage />} />

            {/* Protected POS / Admin Routes */}
            <Route path="/pos" element={
              <ProtectedRoute allowedRoles={["CAJERO", "MOZO"]}>
                <AppLayout>
                  <POS />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER", "CAJERO", "MOZO"]}>
                <AppLayout>
                  <Orders />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/tables" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER", "CAJERO", "MOZO"]}>
                <AppLayout>
                  <TablesPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kitchen" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER", "PRODUCCION"]}>
                <AppLayout>
                  <Kitchen />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/cash" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER", "CAJERO"]}>
                <AppLayout>
                  <Cash />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/menu" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER"]}>
                <AppLayout>
                  <Menu />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER"]}>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={["RESTAURANT_OWNER"]}>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/restaurants" element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <AppLayout>
                  <SuperAdmin />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={["MOTORIZADO"]}>
                <AppLayout>
                  <DeliveryDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/customer/dashboard" element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <AppLayout>
                  <CustomerDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/customer/location-setup" element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <CustomerLocationSetup />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <AppLayout>
                  <CustomerDashboard defaultTab="profile" />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
