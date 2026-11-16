import React from "react";

type LogoColor = "negra" | "amarilla" | "roja" | "naranja" | "crema";

interface BrandLogoProps {
  /** Color de la boca segun el fondo (ver docs/MANUAL_DE_MARCA_FRONTEND.md) */
  color?: LogoColor;
  /** Color de la palabra GOEATS */
  textColor?: string;
  /** Alto de la boca en px */
  size?: number;
  /** Mostrar solo la boca */
  iconOnly?: boolean;
  onClick?: () => void;
}

// Logo oficial: boca dibujada + palabra GOEATS con la letra del logo
export const BrandLogo: React.FC<BrandLogoProps> = ({
  color = "roja",
  textColor = "var(--brand-black)",
  size = 30,
  iconOnly = false,
  onClick,
}) => {
  const content = (
    <>
      <img
        src={`/brand/boca-${color}.png`}
        alt={iconOnly ? "GoEats" : ""}
        width={Math.round(size * 1.18)}
        height={size}
        style={{ display: "block", objectFit: "contain" }}
      />
      {!iconOnly && (
        <span
          className="brand-wordmark"
          style={{ color: textColor, fontSize: Math.round(size * 0.72), fontWeight: 800, lineHeight: 1 }}
        >
          GOEATS
        </span>
      )}
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: Math.round(size * 0.28),
    background: "none",
    border: "none",
    padding: 0,
    cursor: onClick ? "pointer" : "default",
  };

  return onClick ? (
    <button type="button" onClick={onClick} aria-label="GoEats, ir a restaurantes" style={style}>
      {content}
    </button>
  ) : (
    <span style={style}>{content}</span>
  );
};
