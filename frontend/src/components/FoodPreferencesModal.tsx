import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Check, X } from "lucide-react";
import { apiRequest } from "../utils/api";
import { FOOD_PREFERENCE_CATEGORIES, normalizeFoodPreferences } from "../utils/foodPreferences";
import { useAuth } from "../context/AuthContext";

interface FoodPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesUpdated?: (preferences: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const FoodPreferencesModal: React.FC<FoodPreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesUpdated,
  title = "Tus Preferencias Gastronómicas",
  subtitle = "Selecciona las categorías que más te gustan y descubre restaurantes que coinciden con tus preferencias.",
}) => {
  const { user, token, login } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing preferences from user or localStorage
  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      if (user && user.preferences && Array.isArray(user.preferences)) {
        setSelected(normalizeFoodPreferences(user.preferences));
        return;
      }

      try {
        const stored = localStorage.getItem("goeats_food_preferences");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setSelected(normalizeFoodPreferences(parsed));
            return;
          }
        }
      } catch {
        // Ignore malformed local storage data and fall back to an empty selection.
      }

      setSelected([]);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === FOOD_PREFERENCE_CATEGORIES.length) {
      setSelected([]);
    } else {
      setSelected(FOOD_PREFERENCE_CATEGORIES.map((c) => c.id));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Guardar en localStorage inmediatamente
      const normalizedPreferences = normalizeFoodPreferences(selected);
      localStorage.setItem("goeats_food_preferences", JSON.stringify(normalizedPreferences));

      // 2. Si el usuario está autenticado, sincronizar con backend
      if (user && token) {
        try {
          await apiRequest("/auth/preferences", {
            method: "POST",
            body: JSON.stringify({ preferences: normalizedPreferences }),
          });

          // Actualizar contexto de usuario local
          login(token, {
            ...user,
            preferences: normalizedPreferences,
          });
        } catch (err) {
          console.warn("No se pudo sincronizar preferencias con el servidor:", err);
        }
      }

      if (onPreferencesUpdated) {
        onPreferencesUpdated(normalizedPreferences);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(8px)",
      zIndex: 999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "720px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
        border: "1px solid rgba(226, 232, 240, 0.8)",
      }} role="dialog" aria-modal="true" aria-labelledby="food-preferences-title">
        {/* Top Header */}
        <div style={{
          padding: "22px 24px 18px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          backgroundColor: "#ffffff"
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: "#f1f1f1",
              color: "#111111",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "8px",
            }}>
              <Sparkles size={14} />
              Recomendaciones Inteligentes
            </div>
            <h2 style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.4px"
            }}>
              <span id="food-preferences-title">{title}</span>
            </h2>
            <p style={{
              fontSize: "13px",
              color: "#64748b",
              margin: 0,
              lineHeight: "1.4"
            }}>
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar: Counts & Select all */}
        <div style={{
          padding: "12px 28px",
          backgroundColor: "#f8fafc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          fontSize: "13px",
        }}>
          <span style={{ color: "#475569", fontWeight: 600 }}>
            {selected.length === 0
              ? "Sin preferencias seleccionadas: verás todos los restaurantes."
              : `${selected.length} categoría${selected.length > 1 ? "s" : ""} seleccionada${selected.length > 1 ? "s" : ""}`}
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              background: "none",
              border: "none",
              color: "#111111",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {selected.length === FOOD_PREFERENCE_CATEGORIES.length ? "Deseleccionar todas" : "Seleccionar todas"}
          </button>
        </div>

        {/* Category Grid */}
        <div style={{
          padding: "18px 22px",
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: "12px",
          flex: 1,
        }}>
          {FOOD_PREFERENCE_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            const CategoryIcon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                aria-pressed={isSelected}
                style={{
                  minHeight: "142px",
                  borderRadius: "16px",
                  padding: "15px",
                  cursor: "pointer",
                  border: isSelected ? "1px solid #111111" : "1px solid #e2e2e2",
                  backgroundColor: isSelected ? "#f5f5f5" : "#ffffff",
                  boxShadow: isSelected ? "0 3px 10px rgba(0, 0, 0, 0.08)" : "none",
                  transition: "border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  textAlign: "left",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: isSelected ? "#111111" : "#f1f1f1",
                    color: isSelected ? "#ffffff" : "#333333",
                  }}>
                    <CategoryIcon size={19} strokeWidth={1.8} />
                  </span>
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: isSelected ? "1px solid #111111" : "1px solid #cbd5e1",
                    backgroundColor: isSelected ? "#111111" : "#ffffff",
                    color: "#ffffff",
                  }}>
                    {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                  </div>
                </div>

                <div style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.35,
                  marginBottom: "5px",
                }}>
                  {cat.name}
                </div>

                <div style={{
                  fontSize: "13px",
                  color: "#64748b",
                  lineHeight: 1.4
                }}>
                  {cat.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#ffffff",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              backgroundColor: "transparent",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Ahora no
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              maxWidth: "280px",
              padding: "11px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#111111",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.15s ease",
            }}
          >
            <Sparkles size={15} />
            {isSaving ? "Guardando..." : "Guardar preferencias"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
