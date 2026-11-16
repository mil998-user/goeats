import React from "react";
import { getOpenStatus, parseWeeklyHours } from "../utils/openingHours";

// Etiqueta corta "Abierto" / "Cerrado" para las tarjetas de restaurante
export const OpenBadge: React.FC<{ hours?: string | null }> = ({ hours }) => {
  const week = parseWeeklyHours(hours);
  if (!week) return null;
  const status = getOpenStatus(week);
  return (
    <span
      title={status.label}
      style={{
        flexShrink: 0,
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
        backgroundColor: status.isOpen ? "rgba(30, 143, 78, 0.12)" : "rgba(212, 37, 24, 0.1)",
        color: status.isOpen ? "#1e8f4e" : "#d42518",
      }}
    >
      {status.isOpen ? "Abierto" : "Cerrado"}
    </span>
  );
};
