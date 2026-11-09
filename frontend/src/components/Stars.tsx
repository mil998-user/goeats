import React from "react";
import { Star } from "lucide-react";

// Large star buttons for choosing a rating, easy to tap
export const StarPicker: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
}> = ({ value, onChange, label }) => (
  <div role="radiogroup" aria-label={label} style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
    {[1, 2, 3, 4, 5].map((stars) => (
      <button
        key={stars}
        type="button"
        role="radio"
        aria-checked={value === stars}
        aria-label={`${stars} ${stars === 1 ? "estrella" : "estrellas"}`}
        onClick={() => onChange(stars)}
        style={{
          width: "44px",
          height: "44px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border-light)",
          background: stars <= value ? "var(--text-primary)" : "var(--bg-secondary)",
          color: stars <= value ? "var(--bg-primary)" : "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <Star size={20} fill={stars <= value ? "currentColor" : "none"} />
      </button>
    ))}
  </div>
);

// Read-only average, for example "4,5 ★ (12)"
export const StarAverage: React.FC<{ average: number | null | undefined; count?: number; size?: number }> = ({
  average,
  count,
  size = 14,
}) => {
  if (average === null || average === undefined) {
    return <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Sin calificaciones</span>;
  }
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}
      aria-label={`Calificación ${average.toLocaleString("es-EC")} de 5${count !== undefined ? `, ${count} opiniones` : ""}`}
    >
      <Star size={size} fill="currentColor" />
      {average.toLocaleString("es-EC", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      {count !== undefined && <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>({count})</span>}
    </span>
  );
};
