import React from "react";

// Ilustraciones propias de la landing (SVG con los colores de la marca y trazo negro como el logo).
// Las animaciones viven en landing.css (clases gl-ill-*) y se apagan con "reducir movimiento".

const INK = "#000000";
const SKIN = "#f5c6a0";

// Chef salteando en la sarten: la comida salta y sale vapor
export const ChefIllustration: React.FC = () => (
  <svg viewBox="0 0 460 520" className="gl-ill-svg" role="img" aria-label="Ilustración de un chef cocinando">
    <circle cx="230" cy="250" r="200" fill="var(--brand-yellow)" />

    {/* Vapor */}
    <g className="gl-ill-steam" fill="none" stroke="var(--brand-white)" strokeWidth="6" strokeLinecap="round">
      <path d="M55 300 q-10 -18 0 -34 q10 -16 0 -32" />
      <path d="M80 296 q-10 -18 0 -34 q10 -16 0 -32" />
      <path d="M105 300 q-10 -18 0 -34 q10 -16 0 -32" />
    </g>

    {/* Comida saltando */}
    <g className="gl-ill-flip" stroke={INK} strokeWidth="4">
      <circle cx="58" cy="318" r="11" fill="var(--brand-red)" />
      <circle cx="84" cy="304" r="9" fill="#1e8f4e" />
      <circle cx="106" cy="320" r="10" fill="var(--brand-orange)" />
    </g>

    {/* Sarten */}
    <path d="M22 346 Q75 392 128 346 Z" fill={INK} />
    <ellipse cx="75" cy="346" rx="53" ry="12" fill="#2b2b2b" stroke={INK} strokeWidth="5" />
    <line x1="126" y1="346" x2="160" y2="352" stroke={INK} strokeWidth="10" strokeLinecap="round" />

    {/* Brazo izquierdo con la sarten */}
    <path d="M168 300 Q130 320 156 352" fill="none" stroke={INK} strokeWidth="44" strokeLinecap="round" />
    <path d="M168 300 Q130 320 156 352" fill="none" stroke="var(--brand-white)" strokeWidth="34" strokeLinecap="round" />
    <circle cx="158" cy="354" r="16" fill={SKIN} stroke={INK} strokeWidth="5" />

    {/* Brazo derecho con el pulgar arriba */}
    <path d="M296 300 Q345 302 350 266" fill="none" stroke={INK} strokeWidth="44" strokeLinecap="round" />
    <path d="M296 300 Q345 302 350 266" fill="none" stroke="var(--brand-white)" strokeWidth="34" strokeLinecap="round" />
    <circle cx="350" cy="252" r="17" fill={SKIN} stroke={INK} strokeWidth="5" />
    <rect x="344" y="222" width="12" height="24" rx="6" fill={SKIN} stroke={INK} strokeWidth="5" />

    {/* Filipina */}
    <rect x="140" y="258" width="180" height="180" rx="70" fill="var(--brand-white)" stroke={INK} strokeWidth="5" />
    <circle cx="208" cy="330" r="6" fill={INK} />
    <circle cx="252" cy="330" r="6" fill={INK} />
    <circle cx="208" cy="370" r="6" fill={INK} />
    <circle cx="252" cy="370" r="6" fill={INK} />
    <image href="/brand/boca-roja.png" x="262" y="388" width="36" height="32" />
    <path d="M196 262 L264 262 L230 302 Z" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />

    {/* Cabeza */}
    <circle cx="230" cy="205" r="58" fill={SKIN} stroke={INK} strokeWidth="5" />
    <circle cx="210" cy="200" r="6" fill={INK} />
    <circle cx="250" cy="200" r="6" fill={INK} />
    <circle cx="198" cy="222" r="9" fill="var(--brand-orange)" opacity="0.35" />
    <circle cx="262" cy="222" r="9" fill="var(--brand-orange)" opacity="0.35" />
    <path d="M212 228 Q230 246 248 228" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />

    {/* Gorro */}
    <g className="gl-ill-hat" fill="var(--brand-white)" stroke={INK} strokeWidth="5">
      <circle cx="196" cy="122" r="30" />
      <circle cx="264" cy="122" r="30" />
      <circle cx="230" cy="102" r="36" />
      <rect x="180" y="132" width="100" height="34" rx="8" />
    </g>

    {/* Meson */}
    <rect x="10" y="420" width="440" height="100" rx="26" fill="var(--brand-orange)" stroke={INK} strokeWidth="5" />
    <rect x="10" y="420" width="440" height="22" rx="11" fill="var(--brand-cream)" stroke={INK} strokeWidth="5" />
  </svg>
);

// Repartidor en scooter con la caja de GoEats: ruedas girando, calle en movimiento
export const RiderIllustration: React.FC = () => (
  <svg viewBox="0 0 520 520" className="gl-ill-svg" role="img" aria-label="Ilustración de un repartidor en moto">
    <g transform="translate(0 80)">
      <circle cx="420" cy="80" r="58" fill="var(--brand-yellow)" />

      {/* Ciudad */}
      <g fill="var(--brand-cream-mid)" stroke={INK} strokeWidth="4">
        <rect x="20" y="170" width="70" height="160" rx="8" />
        <rect x="100" y="120" width="80" height="210" rx="8" />
        <rect x="320" y="150" width="80" height="180" rx="8" />
        <rect x="410" y="200" width="90" height="130" rx="8" />
      </g>
      <g fill="var(--brand-white)">
        <rect x="38" y="192" width="14" height="18" rx="3" />
        <rect x="60" y="192" width="14" height="18" rx="3" />
        <rect x="118" y="146" width="16" height="20" rx="3" />
        <rect x="146" y="146" width="16" height="20" rx="3" />
        <rect x="118" y="182" width="16" height="20" rx="3" />
        <rect x="146" y="182" width="16" height="20" rx="3" />
        <rect x="340" y="172" width="16" height="20" rx="3" />
        <rect x="366" y="172" width="16" height="20" rx="3" />
        <rect x="430" y="222" width="16" height="20" rx="3" />
        <rect x="462" y="222" width="16" height="20" rx="3" />
      </g>

      {/* Calle */}
      <rect x="0" y="330" width="520" height="80" fill="#1f1f1f" />
      <line className="gl-ill-road" x1="0" y1="372" x2="520" y2="372" stroke="var(--brand-white)" strokeWidth="6" strokeDasharray="34 24" />

      {/* Lineas de velocidad */}
      <g className="gl-ill-speed" stroke={INK} strokeWidth="6" strokeLinecap="round" opacity="0.35">
        <line x1="30" y1="240" x2="100" y2="240" />
        <line x1="50" y1="270" x2="105" y2="270" />
        <line x1="20" y1="300" x2="90" y2="300" />
      </g>

      <g className="gl-ill-bob">
        {/* Humo */}
        <g className="gl-ill-puff" fill="#d9d9d9">
          <circle cx="136" cy="304" r="9" />
          <circle cx="114" cy="296" r="6" />
        </g>

        {/* Ruedas */}
        {[200, 390].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="312" r="34" fill={INK} />
            <g className="gl-ill-wheel">
              <circle cx={cx} cy="312" r="15" fill="#cfcfcf" />
              <line x1={cx - 15} y1="312" x2={cx + 15} y2="312" stroke={INK} strokeWidth="4" />
              <line x1={cx} y1="297" x2={cx} y2="327" stroke={INK} strokeWidth="4" />
            </g>
          </g>
        ))}

        {/* Caja de reparto con la boca de GoEats */}
        <rect x="118" y="150" width="98" height="86" rx="12" fill="var(--brand-yellow)" stroke={INK} strokeWidth="5" />
        <image href="/brand/boca-negra.png" x="140" y="168" width="54" height="48" />

        {/* Scooter */}
        <path d="M150 300 Q145 236 215 232 L272 232 Q262 300 302 300 Z" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <rect x="268" y="284" width="96" height="18" rx="9" fill="var(--brand-red)" stroke={INK} strokeWidth="5" />
        <path d="M350 302 L386 206 L406 212 L374 302 Z" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M352 286 Q390 260 428 286" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <circle cx="414" cy="224" r="9" fill="var(--brand-yellow)" stroke={INK} strokeWidth="4" />
        <line x1="378" y1="202" x2="410" y2="196" stroke={INK} strokeWidth="8" strokeLinecap="round" />

        {/* Repartidor */}
        <path d="M268 232 L318 240 L330 288" fill="none" stroke="#333333" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M232 232 L258 162 L302 166 L292 234 Z" fill="#1f1f1f" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M288 176 L384 200" stroke="#1f1f1f" strokeWidth="18" strokeLinecap="round" />
        <circle cx="386" cy="200" r="10" fill={SKIN} stroke={INK} strokeWidth="4" />
        <circle cx="284" cy="130" r="32" fill="var(--brand-yellow)" stroke={INK} strokeWidth="5" />
        <path d="M290 118 Q318 120 316 140 L294 140 Z" fill={INK} />
        <path d="M256 128 Q262 100 290 98" fill="none" stroke="var(--brand-red)" strokeWidth="7" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);
