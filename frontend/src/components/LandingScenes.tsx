import React from "react";
import { RiderScooter } from "./LandingIllustrations";

// Escenas de la landing con el ritmo de la plantilla de los jefes: dibujos propios, colores del manual
// y trazo negro como el logo. Las animaciones viven en landing-template.css (clases gs-*).

const INK = "#000000";
const SKIN = "#f5c6a0";
const HAIR = "#3a2212";
const KRAFT = "#c98a4b";
const LEAF = "#1e8f4e";

// Alguien comiendo en el sofa, apoyado en el borde de abajo de la franja de locales
export const SofaScene: React.FC = () => (
  <svg viewBox="0 0 560 310" className="gs-sofa" aria-hidden="true">
    <g className="gs-float">
      <image href="/brand/boca-roja.png" x="238" y="34" width="34" height="30" />
      <image href="/brand/boca-negra.png" x="286" y="8" width="26" height="23" />
      <image href="/brand/boca-roja.png" x="206" y="4" width="22" height="19" />
    </g>

    {/* Sofa */}
    <g stroke={INK} strokeWidth="5" strokeLinejoin="round">
      <rect x="66" y="270" width="20" height="36" rx="6" fill={INK} />
      <rect x="384" y="270" width="20" height="36" rx="6" fill={INK} />
      <rect x="52" y="92" width="368" height="150" rx="34" fill="var(--brand-red)" />
      <path d="M236 98 v120" fill="none" strokeWidth="4" />
      <rect x="30" y="204" width="412" height="76" rx="24" fill="var(--brand-red)" />
      <path d="M96 242 h280" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <rect x="14" y="156" width="66" height="124" rx="30" fill="var(--brand-orange)" />
      <rect x="392" y="156" width="66" height="124" rx="30" fill="var(--brand-orange)" />
    </g>

    {/* Cojin y persona recostada */}
    <rect x="66" y="128" width="84" height="72" rx="20" fill="var(--brand-cream)" stroke={INK} strokeWidth="5" transform="rotate(-14 108 164)" />
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M262 200 L420 182" stroke={INK} strokeWidth="44" />
      <path d="M262 200 L420 182" stroke="#2b2b2b" strokeWidth="34" />
      <path d="M418 182 L440 148" stroke={INK} strokeWidth="30" />
      <path d="M418 182 L440 148" stroke="var(--brand-white)" strokeWidth="20" />
      <path d="M256 196 L318 128 L356 196" stroke={INK} strokeWidth="44" />
      <path d="M256 196 L318 128 L356 196" stroke="#2b2b2b" strokeWidth="34" />
      <path d="M356 198 L384 204" stroke={INK} strokeWidth="28" />
      <path d="M356 198 L384 204" stroke="var(--brand-white)" strokeWidth="18" />
      <path d="M160 186 L252 198" stroke={INK} strokeWidth="68" />
      <path d="M160 186 L252 198" stroke="var(--brand-yellow)" strokeWidth="58" />
    </g>
    <image href="/brand/boca-negra.png" x="182" y="172" width="44" height="39" />

    {/* Cabeza */}
    <circle cx="126" cy="142" r="38" fill={SKIN} stroke={INK} strokeWidth="5" />
    <path d="M90 140 C84 100 116 92 134 98 C154 94 168 110 164 130 C148 120 132 124 122 120 C108 122 98 126 90 140 Z" fill={HAIR} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M122 142 q7 -8 14 0 M146 140 q6 -7 12 0" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="122" cy="156" r="7" fill="var(--brand-red)" opacity="0.3" />
    <path d="M136 158 q10 12 20 -2 z" fill="#7a1a12" stroke={INK} strokeWidth="4" strokeLinejoin="round" />

    {/* Brazo con la porcion de pizza, que sube y baja hacia la boca */}
    <g className="gs-bite">
      <path d="M188 178 L206 118" fill="none" stroke={INK} strokeWidth="32" strokeLinecap="round" />
      <path d="M188 178 L206 118" fill="none" stroke="var(--brand-yellow)" strokeWidth="23" strokeLinecap="round" />
      <path d="M160 122 L212 84 L228 122 Z" fill="var(--brand-yellow)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M210 78 L234 124" stroke={INK} strokeWidth="18" strokeLinecap="round" />
      <path d="M210 78 L234 124" stroke="#e0a050" strokeWidth="10" strokeLinecap="round" />
      <circle cx="198" cy="106" r="6" fill="var(--brand-red)" stroke={INK} strokeWidth="3" />
      <circle cx="214" cy="112" r="5" fill="var(--brand-red)" stroke={INK} strokeWidth="3" />
      <circle cx="210" cy="112" r="13" fill={SKIN} stroke={INK} strokeWidth="4.5" opacity="0" />
      <circle cx="214" cy="126" r="13" fill={SKIN} stroke={INK} strokeWidth="4.5" />
    </g>

    {/* Bolsa y bebida en el piso */}
    <path d="M490 206 q0 -24 22 -24 q22 0 22 24" fill="none" stroke={INK} strokeWidth="5" />
    <path d="M476 204 L548 204 L554 306 L470 306 Z" fill={KRAFT} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <image href="/brand/boca-negra.png" x="488" y="234" width="48" height="42" />
  </svg>
);

const House: React.FC<{ fill: string; roof: string; tall?: boolean }> = ({ fill, roof, tall }) => {
  const h = tall ? 78 : 54;
  return (
    <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
      <rect x="-26" y={-h} width="52" height={h + 6} fill={fill} />
      <path d={`M-34 ${-h} L0 ${-h - 28} L34 ${-h} Z`} fill={roof} />
      <rect x="-8" y="-26" width="16" height="30" fill={INK} />
      <rect x="-18" y={-h + 10} width="12" height="14" fill="var(--brand-white)" strokeWidth="3" />
      <rect x="6" y={-h + 10} width="12" height="14" fill="var(--brand-white)" strokeWidth="3" />
    </g>
  );
};
const Tree: React.FC = () => (
  <g stroke={INK} strokeWidth="4">
    <rect x="-5" y="-30" width="10" height="34" fill="#6b3a1e" />
    <circle cx="0" cy="-50" r="26" fill={LEAF} />
  </g>
);
// Iglesia con dos torres, como las del centro de Loja
const Church: React.FC = () => (
  <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
    <rect x="-44" y="-62" width="88" height="68" fill="var(--brand-white)" />
    <rect x="-50" y="-96" width="28" height="102" fill="var(--brand-cream)" />
    <rect x="22" y="-96" width="28" height="102" fill="var(--brand-cream)" />
    <path d="M-54 -96 L-36 -124 L-18 -96 Z M18 -96 L36 -124 L54 -96 Z" fill="var(--brand-red)" />
    <path d="M-14 6 V-24 Q0 -42 14 -24 V6 Z" fill={INK} />
    <circle cx="0" cy="-48" r="8" fill="var(--brand-yellow)" />
  </g>
);

const HILL: React.ReactNode[] = [
  <House key="a" fill="var(--brand-white)" roof="var(--brand-red)" />,
  <Tree key="b" />,
  <Church key="c" />,
  <House key="d" fill="var(--brand-cream)" roof="var(--brand-orange)" tall />,
  <Tree key="e" />,
  <House key="f" fill="var(--brand-orange)" roof="var(--brand-red)" />,
  <House key="g" fill="var(--brand-white)" roof="var(--brand-orange)" tall />,
  <Tree key="h" />,
  <Church key="i" />,
  <House key="j" fill="var(--brand-cream)" roof="var(--brand-red)" />,
  <Tree key="k" />,
  <House key="l" fill="var(--brand-white)" roof="var(--brand-red)" tall />,
];

// La moto de GoEats da la vuelta a Loja sobre una pizza que gira despacio debajo de ella
export const LojaScene: React.FC = () => (
  <div className="gs-loja" role="img" aria-label="Un motorizado de GoEats recorriendo Loja">
    {/* El suelo gira entero como una sola imagen: es lo que menos le cuesta al navegador */}
    <svg viewBox="-110 80 860 860" className="gs-loja-ground" aria-hidden="true">
      {HILL.map((item, i) => (
        <g key={i} transform={`rotate(${i * 30 + 12} 320 510) translate(320 214)`}>
          {item}
        </g>
      ))}
      {/* El suelo es una pizza: borde, queso, pepperoni y albahaca */}
      <circle cx="320" cy="510" r="298" fill="#e0a050" stroke={INK} strokeWidth="9" />
      <circle cx="320" cy="510" r="262" fill="var(--brand-yellow)" stroke={INK} strokeWidth="5" />
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 32.7} 320 510)`} stroke={INK} strokeWidth="5" strokeLinejoin="round">
          <circle cx="320" cy={i % 2 ? 302 : 338} r={i % 2 ? 30 : 36} fill="var(--brand-red)" />
          <g fill="var(--brand-orange)" stroke="none">
            <circle cx="310" cy={i % 2 ? 296 : 330} r="5" />
            <circle cx="332" cy={i % 2 ? 308 : 346} r="4" />
          </g>
          <path d="M392 352 q22 -22 44 0 q-22 22 -44 0 z M400 352 h26" fill={LEAF} strokeWidth="4" />
        </g>
      ))}
    </svg>
    <svg viewBox="0 0 640 540" className="gs-loja-rider" aria-hidden="true">
      <g className="gs-float">
        <image href="/brand/boca-roja.png" x="240" y="46" width="40" height="35" />
        <image href="/brand/boca-roja.png" x="204" y="12" width="28" height="25" />
        <image href="/brand/boca-negra.png" x="262" y="0" width="22" height="19" />
      </g>
      <g transform="translate(146 12) scale(0.59)">
        <RiderScooter />
      </g>
    </svg>
  </div>
);

// Dibujos de linea a los lados del celular
export const ChiliDoodle: React.FC = () => (
  <svg viewBox="0 0 120 150" className="gs-doodle" aria-hidden="true">
    <path d="M64 36 Q104 46 100 92 Q94 132 28 142 Q62 116 58 84 Q54 58 40 50 Q46 34 64 36 Z" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M36 50 Q50 26 76 40 Q66 48 56 46 Q46 46 36 50 Z" fill={LEAF} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M58 34 Q58 16 74 8" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    <path d="M84 66 Q88 84 80 100" fill="none" stroke="var(--brand-white)" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
export const LemonDoodle: React.FC = () => (
  <svg viewBox="0 0 150 120" className="gs-doodle" aria-hidden="true">
    <path d="M10 30 A66 66 0 0 0 140 62 Z" fill="var(--brand-yellow)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M26 40 A50 50 0 0 0 124 64 Z" fill="var(--brand-cream)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M75 52 L48 80 M75 52 L72 94 M75 52 L98 86" stroke={INK} strokeWidth="4" strokeLinecap="round" />
  </svg>
);
