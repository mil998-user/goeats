import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SupportModal } from "../components/SupportModal";

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const defaultRole = user?.role === "MOTORIZADO"
    ? "MOTORIZADO"
    : (user?.role === "RESTAURANT_OWNER" || user?.role === "CAJERO" || user?.role === "MOZO" || user?.role === "PRODUCCION")
      ? "RESTAURANT"
      : "CUSTOMER";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fdf8ee" }}>
      {/* Top bar */}
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid var(--brand-cream)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid #f3e8cc",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            color: "#595959",
          }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--brand-black)" }}>
          Centro de Ayuda & Atención GoEats
        </h1>
      </div>

      <SupportModal
        isOpen={true}
        onClose={() => navigate(-1)}
        defaultRole={defaultRole}
        restaurantName={user?.restaurantName || undefined}
      />
    </div>
  );
};

