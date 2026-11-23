import React from "react";

// Ilustraciones propias de la landing (SVG con los colores de la marca y trazo negro como el logo).
// Las animaciones viven en landing.css (clases gl-ill-*) y se apagan con "reducir movimiento".

const INK = "#000000";
const SKIN = "#f5c6a0";

// Chef salteando en la sarten: la comida salta, sale vapor, el fuego titila,
// el gorro se mece y el chef parpadea. Estilo plano con trazo negro como el logo.
const SKIN_SHADE = "#e8a983";
const HAIR = "#3a2212";
const COAT_SHADE = "var(--brand-cream)";

export const ChefIllustration: React.FC = () => (
  <svg viewBox="0 0 460 520" className="gl-ill-svg" role="img" aria-label="Ilustración de un chef cocinando">
    {/* Fondo */}
    <circle cx="230" cy="240" r="200" fill="var(--brand-yellow)" />
    <circle cx="230" cy="240" r="164" fill="none" stroke="var(--brand-white)" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" opacity="0.7" />
    <g fill="var(--brand-white)">
      <path d="M392 92 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 z" />
      <path d="M58 150 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
      <path d="M404 210 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" />
    </g>

    {/* Vapor */}
    <g className="gl-ill-steam" fill="none" stroke="var(--brand-white)" strokeWidth="6" strokeLinecap="round">
      <path d="M44 286 q-10 -18 0 -34 q10 -16 0 -32" />
      <path d="M72 280 q-10 -18 0 -34 q10 -16 0 -32" />
      <path d="M100 286 q-10 -18 0 -34 q10 -16 0 -32" />
    </g>

    {/* Comida saltando: camaron, tomate, hoja y pimiento */}
    <g className="gl-ill-flip" stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <path d="M40 318 q4 -20 24 -18 q14 2 14 14 q-8 -6 -16 -2 q-6 4 -4 12 q-12 4 -18 -6 z" fill="var(--brand-orange)" />
      <circle cx="94" cy="300" r="11" fill="var(--brand-red)" />
      <circle cx="94" cy="300" r="5" fill="#ff8a7a" stroke="none" />
      <path d="M104 326 q14 -18 26 -4 q-14 14 -26 4 z" fill="#1e8f4e" />
      <rect x="62" y="330" width="16" height="10" rx="4" fill="var(--brand-yellow)" transform="rotate(-18 70 335)" />
    </g>

    {/* Hornilla con fuego */}
    <g className="gl-ill-flame" stroke={INK} strokeWidth="3" strokeLinejoin="round">
      <path d="M46 404 q-8 -14 2 -26 q2 12 10 8 q8 10 0 18 z" fill="var(--brand-orange)" />
      <path d="M66 404 q-10 -18 4 -34 q2 16 12 10 q8 14 -2 24 z" fill="var(--brand-red)" />
      <path d="M90 404 q-8 -14 2 -26 q2 12 10 8 q8 10 0 18 z" fill="var(--brand-orange)" />
    </g>
    <rect x="30" y="402" width="84" height="10" rx="5" fill="#2b2b2b" stroke={INK} strokeWidth="4" />

    {/* Sarten */}
    <path d="M18 350 Q70 398 122 350 Z" fill="#1f1f1f" stroke={INK} strokeWidth="4" />
    <ellipse cx="70" cy="350" rx="52" ry="12" fill="#3a3a3a" stroke={INK} strokeWidth="5" />
    <path d="M40 348 q30 8 60 0" fill="none" stroke="#5a5a5a" strokeWidth="4" strokeLinecap="round" />
    <line x1="118" y1="352" x2="150" y2="358" stroke={INK} strokeWidth="11" strokeLinecap="round" />

    {/* Brazo izquierdo con la sarten */}
    <path d="M170 296 Q132 316 152 354" fill="none" stroke={INK} strokeWidth="46" strokeLinecap="round" />
    <path d="M170 296 Q132 316 152 354" fill="none" stroke="var(--brand-white)" strokeWidth="36" strokeLinecap="round" />
    <path d="M140 340 l26 8" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    <circle cx="152" cy="358" r="16" fill={SKIN} stroke={INK} strokeWidth="5" />

    {/* Brazo derecho con el pulgar arriba */}
    <path d="M292 296 Q342 300 348 268" fill="none" stroke={INK} strokeWidth="46" strokeLinecap="round" />
    <path d="M292 296 Q342 300 348 268" fill="none" stroke="var(--brand-white)" strokeWidth="36" strokeLinecap="round" />
    <path d="M330 280 l30 0" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    <rect x="333" y="242" width="32" height="28" rx="12" fill={SKIN} stroke={INK} strokeWidth="5" />
    <rect x="339" y="216" width="13" height="32" rx="6.5" fill={SKIN} stroke={INK} strokeWidth="5" />
    <path d="M352 252 h10 M352 260 h10" stroke={INK} strokeWidth="3" strokeLinecap="round" />

    {/* Cuello */}
    <rect x="214" y="236" width="32" height="26" rx="8" fill={SKIN_SHADE} stroke={INK} strokeWidth="5" />

    {/* Filipina cruzada con sombra */}
    <path d="M150 300 Q150 262 192 256 L268 256 Q310 262 310 300 L318 440 L142 440 Z" fill="var(--brand-white)" />
    <path d="M268 256 Q310 262 310 300 L318 440 L286 440 L278 300 Z" fill={COAT_SHADE} />
    <path d="M150 300 Q150 262 192 256 L268 256 Q310 262 310 300 L318 440 L142 440 Z" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M222 292 Q262 340 254 440" fill="none" stroke={INK} strokeWidth="4" />
    <g fill={INK}>
      <circle cx="208" cy="318" r="5" />
      <circle cx="208" cy="350" r="5" />
      <circle cx="208" cy="382" r="5" />
      <circle cx="276" cy="330" r="5" />
      <circle cx="276" cy="362" r="5" />
    </g>
    <image href="/brand/boca-roja.png" x="160" y="330" width="36" height="32" />

    {/* Panuelo rojo */}
    <path d="M196 256 L264 256 L240 288 L230 280 L220 288 Z" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <circle cx="230" cy="262" r="9" fill="var(--brand-red)" stroke={INK} strokeWidth="4" />

    {/* Cabeza */}
    <circle cx="172" cy="198" r="13" fill={SKIN} stroke={INK} strokeWidth="5" />
    <circle cx="288" cy="198" r="13" fill={SKIN} stroke={INK} strokeWidth="5" />
    <circle cx="230" cy="194" r="58" fill={SKIN} stroke={INK} strokeWidth="5" />
    <path d="M180 160 q-6 22 4 40 l10 -24 z" fill={HAIR} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M280 160 q6 22 -4 40 l-10 -24 z" fill={HAIR} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    {/* Cejas */}
    <path d="M198 174 q11 -9 22 -2" fill="none" stroke={HAIR} strokeWidth="6" strokeLinecap="round" />
    <path d="M240 172 q11 -7 22 2" fill="none" stroke={HAIR} strokeWidth="6" strokeLinecap="round" />
    {/* Ojos que parpadean */}
    <g className="gl-ill-blink">
      <ellipse cx="210" cy="190" rx="6.5" ry="8" fill={INK} />
      <ellipse cx="250" cy="190" rx="6.5" ry="8" fill={INK} />
      <circle cx="212.5" cy="186.5" r="2.2" fill="var(--brand-white)" />
      <circle cx="252.5" cy="186.5" r="2.2" fill="var(--brand-white)" />
    </g>
    {/* Mejillas, nariz, bigote y sonrisa */}
    <circle cx="194" cy="214" r="10" fill="var(--brand-orange)" opacity="0.32" />
    <circle cx="266" cy="214" r="10" fill="var(--brand-orange)" opacity="0.32" />
    <path d="M230 194 q12 14 -2 20" fill={SKIN_SHADE} stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M214 238 Q230 258 246 238 Z" fill="#7a1a12" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M222 247 q8 5 16 0" fill="none" stroke="#ff8a7a" strokeWidth="4" strokeLinecap="round" />
    <path
      d="M230 222 C218 212 198 216 192 230 C204 226 214 232 230 228 C246 232 256 226 268 230 C262 216 242 212 230 222 Z"
      fill={HAIR}
      stroke={INK}
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Gorro de chef con pliegues */}
    <g className="gl-ill-hat">
      <path
        d="M182 132 C150 130 148 86 182 84 C186 50 228 42 246 66 C266 46 306 62 294 94 C320 100 312 136 282 132 Z"
        fill="var(--brand-white)"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M200 92 q10 -12 24 -4 M246 84 q14 -6 22 6" fill="none" stroke={COAT_SHADE} strokeWidth="5" strokeLinecap="round" />
      <rect x="176" y="126" width="108" height="38" rx="9" fill="var(--brand-white)" stroke={INK} strokeWidth="5" />
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <line x1="196" y1="132" x2="196" y2="158" />
        <line x1="214" y1="132" x2="214" y2="158" />
        <line x1="232" y1="132" x2="232" y2="158" />
        <line x1="250" y1="132" x2="250" y2="158" />
        <line x1="268" y1="132" x2="268" y2="158" />
      </g>
    </g>

    {/* Meson con tabla, tomate y cuchillo */}
    <rect x="10" y="420" width="440" height="100" rx="26" fill="var(--brand-orange)" stroke={INK} strokeWidth="5" />
    <rect x="10" y="420" width="440" height="22" rx="11" fill="var(--brand-cream)" stroke={INK} strokeWidth="5" />
    <path d="M60 470 h60 M170 470 h40 M300 470 h80" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity="0.25" />
    <rect x="322" y="404" width="112" height="20" rx="8" fill="#c98a4b" stroke={INK} strokeWidth="4" />
    <circle cx="350" cy="396" r="13" fill="var(--brand-red)" stroke={INK} strokeWidth="4" />
    <path d="M350 383 q4 -6 10 -4" fill="none" stroke="#1e8f4e" strokeWidth="4" strokeLinecap="round" />
    <path d="M374 400 L420 392 L422 400 L376 404 Z" fill="#d9d9d9" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
    <rect x="416" y="390" width="26" height="11" rx="4" fill={INK} transform="rotate(-8 429 395)" />
  </svg>
);

// Cliente comiendo en la mesa (landing 9.3): da un mordisco a una hamburguesa, la bolsa de GoEats
// al lado y papas con vapor. Mismo estilo plano con trazo negro.
const SHIRT_SHADE = "color-mix(in srgb, var(--brand-yellow) 70%, var(--brand-orange))";
const BUN = "#e0a050";

export const CustomerIllustration: React.FC = () => (
  <svg viewBox="0 0 460 520" className="gl-ill-svg" role="img" aria-label="Ilustración de una persona comiendo su pedido">
    {/* Fondo */}
    <circle cx="230" cy="240" r="200" fill="var(--brand-orange)" />
    <circle cx="230" cy="240" r="164" fill="none" stroke="var(--brand-white)" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" opacity="0.6" />
    <g fill="var(--brand-white)">
      <path d="M70 96 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 z" />
      <path d="M396 150 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
    </g>

    {/* Vapor de las papas */}
    <g className="gl-ill-steam" fill="none" stroke="var(--brand-white)" strokeWidth="6" strokeLinecap="round">
      <path d="M86 364 q-10 -18 0 -34 q10 -16 0 -32" />
      <path d="M114 358 q-10 -18 0 -34 q10 -16 0 -32" />
      <path d="M142 364 q-10 -18 0 -34 q10 -16 0 -32" />
    </g>

    {/* Cuello y cuerpo con camiseta */}
    <rect x="214" y="236" width="32" height="26" rx="8" fill={SKIN_SHADE} stroke={INK} strokeWidth="5" />
    <path d="M148 430 L156 304 Q160 262 202 258 L258 258 Q300 262 304 304 L312 430 Z" fill="var(--brand-yellow)" />
    <path d="M258 258 Q300 262 304 304 L312 430 L282 430 L276 300 Z" fill={SHIRT_SHADE} />
    <path d="M148 430 L156 304 Q160 262 202 258 L258 258 Q300 262 304 304 L312 430 Z" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M206 258 Q230 284 254 258" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <image href="/brand/boca-negra.png" x="204" y="320" width="52" height="46" />

    {/* Brazo izquierdo apoyado en la mesa */}
    <path d="M166 300 Q128 340 160 404" fill="none" stroke={INK} strokeWidth="46" strokeLinecap="round" />
    <path d="M166 300 Q128 340 160 404" fill="none" stroke="var(--brand-yellow)" strokeWidth="36" strokeLinecap="round" />
    <circle cx="164" cy="408" r="16" fill={SKIN} stroke={INK} strokeWidth="5" />

    {/* Cabeza */}
    <circle cx="172" cy="198" r="13" fill={SKIN} stroke={INK} strokeWidth="5" />
    <circle cx="288" cy="198" r="13" fill={SKIN} stroke={INK} strokeWidth="5" />
    <circle cx="230" cy="194" r="58" fill={SKIN} stroke={INK} strokeWidth="5" />
    <path
      d="M172 190 C164 128 214 116 238 124 C276 116 300 146 288 190 C280 162 262 154 246 160 C226 148 194 156 172 190 Z"
      fill={HAIR}
      stroke={INK}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    {/* Ojos cerrados de gusto */}
    <path d="M198 194 q11 -11 22 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <path d="M238 194 q11 -11 22 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    <circle cx="194" cy="214" r="10" fill="var(--brand-red)" opacity="0.3" />
    <circle cx="266" cy="214" r="10" fill="var(--brand-red)" opacity="0.3" />
    {/* Boca abierta para el mordisco */}
    <ellipse cx="236" cy="230" rx="15" ry="11" fill="#7a1a12" stroke={INK} strokeWidth="4" />

    {/* Brazo derecho llevando la hamburguesa a la boca */}
    <path d="M296 300 Q338 292 326 246" fill="none" stroke={INK} strokeWidth="46" strokeLinecap="round" />
    <path d="M296 300 Q338 292 326 246" fill="none" stroke="var(--brand-yellow)" strokeWidth="36" strokeLinecap="round" />

    {/* Hamburguesa */}
    <g className="gl-ill-bite">
      <path d="M262 214 Q300 168 338 214 Z" fill={BUN} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <g fill="var(--brand-cream)">
        <ellipse cx="290" cy="196" rx="3" ry="2" />
        <ellipse cx="306" cy="190" rx="3" ry="2" />
        <ellipse cx="318" cy="200" rx="3" ry="2" />
      </g>
      <path d="M260 216 q10 8 20 0 q10 8 20 0 q10 8 20 0 q10 8 20 0" fill="none" stroke="#1e8f4e" strokeWidth="7" strokeLinecap="round" />
      <rect x="264" y="222" width="74" height="14" rx="7" fill="#6b3a1e" stroke={INK} strokeWidth="4" />
      <path d="M268 238 h66 l-6 8 h-54 z" fill="var(--brand-yellow)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="266" y="244" width="70" height="14" rx="7" fill={BUN} stroke={INK} strokeWidth="4.5" />
    </g>
    <circle cx="326" cy="252" r="16" fill={SKIN} stroke={INK} strokeWidth="5" />

    {/* Mesa */}
    <rect x="10" y="420" width="440" height="100" rx="26" fill="var(--brand-red)" stroke={INK} strokeWidth="5" />
    <rect x="10" y="420" width="440" height="22" rx="11" fill="var(--brand-cream)" stroke={INK} strokeWidth="5" />

    {/* Papas en su caja */}
    <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
      <rect x="92" y="352" width="10" height="40" rx="3" fill="var(--brand-yellow)" transform="rotate(-10 97 372)" />
      <rect x="108" y="346" width="10" height="44" rx="3" fill="var(--brand-yellow)" />
      <rect x="124" y="350" width="10" height="40" rx="3" fill="var(--brand-yellow)" transform="rotate(8 129 370)" />
      <path d="M84 372 L148 372 L140 424 L92 424 Z" fill="var(--brand-white)" strokeWidth="5" />
    </g>
    <image href="/brand/boca-roja.png" x="100" y="384" width="32" height="28" />

    {/* Bolsa de GoEats */}
    <path d="M356 344 q0 -30 28 -30 q28 0 28 30" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    <path d="M340 340 L428 340 L436 428 L332 428 Z" fill="#c98a4b" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M340 340 L352 356 L416 356 L428 340" fill="none" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
    <image href="/brand/boca-negra.png" x="358" y="368" width="52" height="46" />
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

// Escena del inicio, como la caja abierta de la plantilla de los jefes: la caja de GoEats con la comida,
// la bolsa de papel con la boca y los tickets del pedido, con sombras planas hacia arriba a la izquierda.
// Se dibuja pegada a la esquina de abajo a la izquierda y sale del borde.
const KRAFT = "#c98a4b";
const KRAFT_DARK = "#a86d34";
const KRAFT_TOP = "#e0a050";
export const HeroScene: React.FC = () => (
  <svg viewBox="0 0 1000 820" className="gl-hero-scene" preserveAspectRatio="xMinYMax meet" aria-hidden="true">
    {/* Sombras planas, como la luz de la foto de la plantilla */}
    <g className="hs-shadow">
      <path d="M-40 300 L250 300 L330 330 L330 820 L-40 820 Z" />
      <path d="M300 480 L380 120 L820 80 L860 400 L840 820 L300 820 Z" />
    </g>

    {/* Bolsa de papel con la boca y GOEATS */}
    <g className="hs-bag">
      <polygon points="40,380 330,380 400,410 110,410" fill={KRAFT_TOP} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <polygon points="330,380 400,410 400,840 330,820" fill={KRAFT_DARK} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <rect x="40" y="410" width="290" height="420" fill={KRAFT} stroke={INK} strokeWidth="5" />
      <ellipse cx="220" cy="396" rx="42" ry="8" fill={INK} />
      <image href="/brand/boca-negra.png" x="100" y="450" width="170" height="150" />
      <text x="185" y="680" textAnchor="middle" fontSize="64" fontWeight="900" fill={INK} letterSpacing="2" className="hs-word">
        GOEATS
      </text>
    </g>

    {/* Caja abierta */}
    <g className="hs-box">
      {/* Tapa abierta por dentro, con la frase impresa */}
      <g className="hs-lid">
        <polygon points="430,470 860,440 885,150 455,190" fill="var(--brand-orange)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <g transform="rotate(-5 670 310)">
          <text x="670" y="292" textAnchor="middle" fontSize="66" fontWeight="900" fill="var(--brand-cream)" letterSpacing="1" className="hs-word">
            LA COMIDA
          </text>
          <text x="640" y="362" textAnchor="middle" fontSize="66" fontWeight="900" fill="var(--brand-cream)" letterSpacing="1" className="hs-word">
            DE LOJA
          </text>
        </g>
      </g>
      {/* Fondo de la caja por dentro */}
      <polygon points="370,565 900,525 860,440 430,470" fill="var(--brand-cream)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />

      {/* Comida asomando: hamburguesa, papas y bebida */}
      <g className="hs-food">
        {/* Hamburguesa */}
        <path d="M445 520 Q505 420 565 512 Z" fill={KRAFT_TOP} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <g fill="var(--brand-cream)">
          <ellipse cx="490" cy="478" rx="5" ry="3" />
          <ellipse cx="515" cy="466" rx="5" ry="3" />
          <ellipse cx="530" cy="486" rx="5" ry="3" />
        </g>
        <path d="M440 520 q12 -10 24 0 q12 -10 24 0 q12 -10 24 0 q12 -10 24 0 q12 -10 24 0 l0 10 l-120 0 Z" fill="#1e8f4e" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <rect x="442" y="530" width="126" height="22" rx="10" fill="#6b3a1e" stroke={INK} strokeWidth="5" />

        {/* Papas en su caja */}
        <g className="hs-fries">
          <g fill="var(--brand-yellow)" stroke={INK} strokeWidth="4">
            <rect x="608" y="420" width="16" height="90" rx="4" transform="rotate(-8 616 465)" />
            <rect x="632" y="404" width="16" height="100" rx="4" />
            <rect x="656" y="414" width="16" height="96" rx="4" transform="rotate(6 664 462)" />
            <rect x="680" y="428" width="16" height="84" rx="4" transform="rotate(12 688 470)" />
          </g>
          <path d="M596 480 L712 474 L700 560 L606 564 Z" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <image href="/brand/boca-crema.png" x="630" y="494" width="46" height="40" />
        </g>

        {/* Bebida con pajilla */}
        <path d="M800 360 L812 300" stroke="var(--brand-red)" strokeWidth="9" strokeLinecap="round" />
        <rect x="752" y="356" width="92" height="20" rx="8" fill="var(--brand-white)" stroke={INK} strokeWidth="5" />
        <path d="M758 376 L838 376 L826 540 L770 540 Z" fill="var(--brand-white)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M764 430 L832 430 L828 470 L768 470 Z" fill="var(--brand-yellow)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      </g>

      {/* Frente de la caja */}
      <polygon points="370,565 900,525 935,790 400,840" fill="var(--brand-red)" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <g transform="rotate(-4 660 690)">
        <image href="/brand/boca-crema.png" x="520" y="640" width="84" height="74" />
        <text x="720" y="700" textAnchor="middle" fontSize="54" fontWeight="900" fill="var(--brand-cream)" letterSpacing="2" className="hs-word">
          GOEATS
        </text>
        <text x="700" y="740" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--brand-cream)" letterSpacing="3">
          A TU PUERTA
        </text>
      </g>
    </g>

    {/* Tickets del pedido, como las guias de la plantilla */}
    <g className="hs-tickets">
      <g transform="rotate(-12 300 790)">
        <rect x="210" y="730" width="170" height="130" rx="8" fill="var(--brand-white)" stroke={INK} strokeWidth="4" />
        <rect x="210" y="730" width="170" height="30" rx="8" fill="var(--brand-red)" stroke={INK} strokeWidth="4" />
        <text x="295" y="752" textAnchor="middle" fontSize="16" fontWeight="900" fill="var(--brand-white)" letterSpacing="2">TU PEDIDO</text>
        <g stroke={INK} strokeWidth="4" strokeLinecap="round">
          <line x1="228" y1="782" x2="330" y2="782" />
          <line x1="228" y1="802" x2="360" y2="802" />
          <line x1="228" y1="822" x2="310" y2="822" />
        </g>
      </g>
      <g transform="rotate(8 470 800)">
        <rect x="400" y="752" width="150" height="120" rx="8" fill="var(--brand-cream)" stroke={INK} strokeWidth="4" />
        <rect x="400" y="752" width="150" height="28" rx="8" fill="var(--brand-yellow)" stroke={INK} strokeWidth="4" />
        <text x="475" y="772" textAnchor="middle" fontSize="15" fontWeight="900" fill={INK} letterSpacing="2">EN CAMINO</text>
        <g stroke={INK} strokeWidth="4" strokeLinecap="round">
          <line x1="416" y1="802" x2="520" y2="802" />
          <line x1="416" y1="822" x2="490" y2="822" />
        </g>
      </g>
    </g>
  </svg>
);
