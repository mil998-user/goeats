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

// ---------- Como funciona: personajes de cuerpo entero, sin fondo ----------
// 1. Elige: mira el celular y piensa en una hamburguesa
export const ChooseArt: React.FC = () => (
  <svg viewBox="0 0 220 400" className="gs-step gl-ill-svg" aria-hidden="true">
    <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 372 q14 -14 36 -2 v14 H56 Z" fill="var(--brand-red)" />
      <path d="M116 372 q18 -14 40 2 v10 h-42 Z" fill="var(--brand-red)" />
      <path d="M62 200 L136 200 L150 374 L112 374 L100 252 L92 374 L56 374 Z" fill="var(--brand-yellow)" />
      <path d="M132 112 Q162 150 148 204" fill="none" strokeWidth="30" />
      <path d="M132 112 Q162 150 148 204" fill="none" stroke="var(--brand-orange)" strokeWidth="20" />
      <circle cx="147" cy="212" r="11" fill={SKIN} />
      <path d="M62 108 Q98 92 134 108 L140 212 L58 212 Z" fill="var(--brand-orange)" />
      <path d="M84 100 Q98 118 112 100 L106 128 H90 Z" fill="var(--brand-white)" />
      <path d="M98 128 V210" fill="none" strokeWidth="4" />
      <path d="M66 116 Q34 150 60 172" fill="none" strokeWidth="30" />
      <path d="M66 116 Q34 150 60 172" fill="none" stroke="var(--brand-orange)" strokeWidth="20" />
      <rect x="48" y="140" width="26" height="44" rx="6" fill={INK} transform="rotate(-10 61 162)" />
      <circle cx="66" cy="178" r="11" fill={SKIN} />
      <rect x="88" y="78" width="20" height="24" fill={SKIN} />
      <circle cx="98" cy="56" r="32" fill={SKIN} />
      <path d="M62 88 C50 40 72 14 100 16 C132 14 146 42 136 88 C126 82 126 62 118 48 C104 54 84 52 78 46 C74 62 74 80 62 88 Z" fill={HAIR} />
      <path d="M84 60 q5 -5 10 0 M104 60 q5 -5 10 0" fill="none" strokeWidth="4" />
      <path d="M92 74 q8 7 16 0" fill="none" strokeWidth="4" />
    </g>
    <g className="gs-thought">
      <g fill="var(--brand-white)" stroke={INK} strokeWidth="4">
        <circle cx="146" cy="32" r="5" />
        <circle cx="156" cy="18" r="7" />
      </g>
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        <path d="M166 18 Q190 -14 214 18 Z" fill="#e0a050" transform="translate(0 22)" />
        <rect x="164" y="42" width="52" height="8" rx="4" fill={LEAF} />
        <rect x="166" y="50" width="48" height="10" rx="5" fill="#6b3a1e" />
        <rect x="166" y="60" width="48" height="12" rx="6" fill="#e0a050" />
      </g>
    </g>
  </svg>
);

// 2. Pide: el chef de pie saltea en la hornilla
export const CookArt: React.FC = () => (
  <svg viewBox="0 0 400 350" className="gs-step gl-ill-svg" aria-hidden="true">
    <g className="gl-ill-flip" stroke={INK} strokeWidth="4" strokeLinejoin="round">
      <circle cx="306" cy="96" r="10" fill="var(--brand-red)" />
      <path d="M326 118 q14 -18 28 -4 q-14 14 -28 4 z" fill={LEAF} />
      <rect x="276" y="120" width="18" height="11" rx="4" fill="var(--brand-yellow)" transform="rotate(-18 285 125)" />
    </g>
    <g stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="252" y="214" width="124" height="126" rx="8" fill="var(--brand-cream)" />
      <rect x="274" y="250" width="80" height="62" rx="6" fill={INK} />
      <circle cx="284" cy="232" r="6" fill="var(--brand-red)" />
      <circle cx="314" cy="232" r="6" fill="var(--brand-red)" />
      <circle cx="344" cy="232" r="6" fill="var(--brand-red)" />
      <g className="gl-ill-flame" strokeWidth="3.5">
        <path d="M290 212 q-8 -14 2 -26 q2 12 10 8 q8 10 0 18 z" fill="var(--brand-orange)" />
        <path d="M312 212 q-10 -18 4 -34 q2 16 12 10 q8 14 -2 24 z" fill="var(--brand-red)" />
        <path d="M336 212 q-8 -14 2 -26 q2 12 10 8 q8 10 0 18 z" fill="var(--brand-orange)" />
      </g>
      <path d="M258 156 Q316 198 374 156 Z" fill="#2b2b2b" />
      <path d="M258 158 L214 148" fill="none" strokeWidth="9" />
      <path d="M96 330 q18 -14 40 0 v12 H92 Z" fill={INK} />
      <path d="M152 330 q22 -14 42 2 v10 h-42 Z" fill={INK} />
      <path d="M98 236 L186 236 L192 332 L150 332 L143 274 L136 332 L94 332 Z" fill="#2b2b2b" />
      <path d="M92 130 Q52 168 70 226" fill="none" strokeWidth="34" />
      <path d="M92 130 Q52 168 70 226" fill="none" stroke="var(--brand-white)" strokeWidth="24" />
      <circle cx="72" cy="232" r="12" fill={SKIN} />
      <path d="M92 122 Q142 106 190 122 L198 250 L86 250 Z" fill="var(--brand-white)" />
      <path d="M142 130 Q160 180 156 248" fill="none" strokeWidth="4" />
      <path d="M114 112 L170 112 L142 138 Z" fill="var(--brand-red)" />
      <g fill={INK} stroke="none">
        <circle cx="128" cy="168" r="4.5" />
        <circle cx="128" cy="194" r="4.5" />
        <circle cx="128" cy="220" r="4.5" />
      </g>
      <path d="M184 132 Q214 176 214 152" fill="none" strokeWidth="34" />
      <path d="M184 132 Q214 176 214 152" fill="none" stroke="var(--brand-white)" strokeWidth="24" />
      <circle cx="218" cy="148" r="12" fill={SKIN} />
      <rect x="130" y="92" width="24" height="22" fill={SKIN} />
      <circle cx="142" cy="72" r="34" fill={SKIN} />
      <path d="M128 70 q5 -6 10 0 M150 70 q5 -6 10 0" fill="none" strokeWidth="4" />
      <path d="M142 84 C134 78 122 82 120 90 C128 88 134 92 142 90 C150 92 156 88 164 90 C162 82 150 78 142 84 Z" fill={HAIR} strokeWidth="3" />
      <g className="gl-ill-hat">
        <path d="M110 46 C90 42 94 12 116 14 C122 -8 154 -8 162 10 C186 4 196 36 174 46 Z" fill="var(--brand-white)" />
        <rect x="108" y="38" width="68" height="20" rx="6" fill="var(--brand-white)" />
      </g>
    </g>
  </svg>
);

// 3. Recibe: solo la moto, sin ciudad detras
export const RideArt: React.FC = () => (
  <svg viewBox="84 84 366 276" className="gs-step gl-ill-svg" aria-hidden="true">
    <g className="gl-ill-speed" stroke={INK} strokeWidth="6" strokeLinecap="round" opacity="0.35">
      <line x1="88" y1="200" x2="112" y2="200" />
      <line x1="92" y1="236" x2="132" y2="236" />
    </g>
    <RiderScooter />
    <path d="M100 350 H440" stroke={INK} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

// ---------- Beneficios: iconos rellenos, dibujados a mano ----------
const Solid: React.FC<{ tilt?: number; children: React.ReactNode }> = ({ tilt = 0, children }) => (
  <svg viewBox="0 0 100 100" className="gs-solid" aria-hidden="true" fill={INK} style={{ rotate: `${tilt}deg` }}>
    {children}
  </svg>
);
const CUT = { fill: "none", stroke: "#fff", strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const PlusIcon: React.FC = () => (
  <Solid tilt={-6}>
    <path d="M6 30 Q8 22 18 24 H58 V66 H14 Q4 64 6 30 Z M62 36 H76 Q84 36 88 46 L96 58 V66 H62 Z" />
    <circle cx="28" cy="72" r="12" />
    <circle cx="78" cy="72" r="12" />
    <circle cx="28" cy="72" r="4.5" fill="#fff" />
    <circle cx="78" cy="72" r="4.5" fill="#fff" />
    <path d="M70 44 H76 L82 54 H70 Z" fill="#fff" />
    <text x="32" y="55" textAnchor="middle" fontSize="28" fontWeight="900" fill="#fff" fontFamily="Arial, sans-serif">
      $0
    </text>
  </Solid>
);
export const CashIcon: React.FC = () => (
  <Solid tilt={-10}>
    <path d="M22 18 L94 26 L88 66 L80 65 L84 34 L20 27 Z" />
    <path d="M6 34 Q42 44 80 36 Q84 58 82 78 Q44 88 8 76 Q4 54 6 34 Z" />
    <circle cx="44" cy="58" r="12" {...CUT} />
    <path d="M18 50 v14 M70 50 v14" {...CUT} />
  </Solid>
);
export const PickupIcon: React.FC = () => (
  <Solid tilt={4}>
    <path d="M32 34 Q32 8 50 8 Q68 8 68 34" fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
    <path d="M14 30 Q50 26 86 30 L92 92 Q50 98 8 92 Z" />
    <path d="M30 58 Q50 46 70 58 Q66 80 50 80 Q34 80 30 58 Z" fill="#fff" />
    <path d="M38 58 Q50 54 62 58" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
  </Solid>
);
export const TrackIcon: React.FC = () => (
  <Solid>
    <path d="M50 4 C76 4 88 24 82 44 C78 60 60 72 52 90 C40 72 22 60 18 44 C12 22 26 4 50 4 Z" />
    <circle cx="50" cy="36" r="14" fill="#fff" />
    <path d="M24 84 Q6 88 12 94 Q50 104 88 94 Q94 88 76 84" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
  </Solid>
);
export const HomeIcon: React.FC = () => (
  <Solid tilt={-4}>
    <path d="M4 50 L48 8 Q52 6 56 10 L96 48 Q94 56 86 54 L84 90 Q50 96 16 92 L14 56 Q6 58 4 50 Z" />
    <path d="M42 90 V66 Q50 58 58 66 V90 Z" fill="#fff" />
    <path d="M50 34 C44 26 34 32 38 40 Q42 48 50 52 Q58 48 62 40 C66 32 56 26 50 34 Z" fill="#fff" />
  </Solid>
);
export const RepeatIcon: React.FC = () => (
  <Solid tilt={5}>
    <path d="M10 44 Q16 12 50 12 Q84 12 90 44 Z" />
    <path d="M8 52 q10 -6 20 0 q10 6 20 0 q10 -6 20 0 q12 6 24 -2 v10 H8 Z" />
    <path d="M10 66 H90 Q92 88 72 90 H28 Q8 88 10 66 Z" />
    <path d="M34 32 a4 3 0 0 1 8 0 M54 26 a4 3 0 0 1 8 0" {...CUT} strokeWidth={4} />
    <path d="M36 78 H62 M56 72 l8 6 l-8 6" {...CUT} />
  </Solid>
);
