import React from "react";
import { motion, useReducedMotion } from "motion/react";

interface EmptyStateProps {
  /** Frase corta con caracter (fuente More Sugar del manual) */
  title: string;
  /** Explicacion o siguiente paso */
  message?: React.ReactNode;
  /** Boton u otra accion opcional */
  action?: React.ReactNode;
  /** Tamano de la boca en px */
  size?: number;
}

// Pantalla vacia de marca: la boca del logo "masticando" suavemente y una frase amable
export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action, size = 72 }) => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "10px",
        padding: "32px 16px",
      }}
    >
      <motion.img
        src="/brand/boca-roja.png"
        alt=""
        width={Math.round(size * 1.18)}
        height={size}
        style={{ objectFit: "contain", opacity: 0.9 }}
        animate={reduceMotion ? undefined : { scaleY: [1, 0.86, 1], rotate: [0, -3, 0] }}
        transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
      />
      <p className="brand-accent-text" style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
        {title}
      </p>
      {message && (
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", maxWidth: "340px", lineHeight: 1.5 }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );
};
