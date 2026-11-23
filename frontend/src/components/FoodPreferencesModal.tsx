import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Check, X } from "lucide-react";
import { apiRequest } from "../utils/api";
import { FOOD_PREFERENCE_CATEGORIES, normalizeFoodPreferences } from "../utils/foodPreferences";
import { useAuth } from "../context/AuthContext";
import "../styles/preferences.css";

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

  // Cerrar con Escape y no dejar que la pagina de atras se mueva
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

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

  const allSelected = selected.length === FOOD_PREFERENCE_CATEGORIES.length;

  return createPortal(
    <div className="fp-overlay" onClick={onClose}>
      <div
        className="fp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-preferences-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="fp-head">
          <div style={{ minWidth: 0 }}>
            <span className="fp-eyebrow">
              <Sparkles size={14} />
              Recomendaciones para ti
            </span>
            <h2 id="food-preferences-title" className="fp-title">{title}</h2>
            <p className="fp-sub">{subtitle}</p>
          </div>
          <button type="button" className="fp-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="fp-bar">
          <span>
            {selected.length === 0
              ? "Sin gustos elegidos: verás todos los restaurantes."
              : `${selected.length} categoría${selected.length > 1 ? "s" : ""} elegida${selected.length > 1 ? "s" : ""}`}
          </span>
          <button type="button" className="fp-all" onClick={handleSelectAll}>
            {allSelected ? "Quitar todas" : "Elegir todas"}
          </button>
        </div>

        <div className="fp-grid">
          {FOOD_PREFERENCE_CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            const CategoryIcon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                className={`fp-card${isSelected ? " is-on" : ""}`}
                onClick={() => toggleCategory(cat.id)}
                aria-pressed={isSelected}
              >
                <span className="fp-card-top">
                  <span className="fp-icon">
                    <CategoryIcon size={20} strokeWidth={1.9} />
                  </span>
                  <span className="fp-check" aria-hidden="true">
                    {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                  </span>
                </span>
                <span className="fp-name">{cat.name}</span>
                <span className="fp-desc">{cat.description}</span>
              </button>
            );
          })}
        </div>

        <footer className="fp-foot">
          <button type="button" className="fp-later" onClick={onClose}>
            Ahora no
          </button>
          <button type="button" className="fp-save" onClick={handleSave} disabled={isSaving}>
            <Sparkles size={16} />
            {isSaving ? "Guardando..." : "Guardar mis gustos"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};
