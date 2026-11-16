import React from "react";

export type StatTone = "yellow" | "red" | "black" | "orange" | "cream";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Bloque de color del manual de marca */
  tone?: StatTone;
}

// Tarjeta de resumen en bloque de color de marca (amarillo, rojo, negro, naranja o crema)
export const StatTile: React.FC<StatTileProps> = ({ label, value, hint, icon, tone = "cream" }) => (
  <div className={`stat-tile tone-${tone}`}>
    <div className="stat-tile-top">
      <span className="stat-tile-label">{label}</span>
      {icon && <span className="stat-tile-icon">{icon}</span>}
    </div>
    <div className="stat-tile-value">{value}</div>
    {hint && <div className="stat-tile-hint">{hint}</div>}
  </div>
);
