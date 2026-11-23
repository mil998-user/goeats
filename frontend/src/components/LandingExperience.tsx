import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bike,
  Check,
  ChefHat,
  Home,
  Menu,
  MapPin,
  Pause,
  Play,
  QrCode,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ChefIllustration, CustomerIllustration, HeroScene, RiderIllustration } from "./LandingIllustrations";
import { OpenBadge } from "./OpenBadge";
import { apiRequest } from "../utils/api";
import { prefersReducedMotion, revealDelay as delay, useReveal } from "../utils/useReveal";
import "../styles/landing.css";
import "../styles/landing-sections.css";
import "../styles/footer-bottom.css";

// Landing con la plantilla de los jefes (plan 9), con el ritmo de Good Pair Days:
// fondos suaves que cambian en cada seccion, acentos de toda la paleta y movimiento al bajar
const sections = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "locales", label: "Locales" },
  { id: "beneficios", label: "Beneficios" },
  { id: "restaurantes", label: "Para negocios" },
];

interface PublicRestaurant {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  promoText?: string | null;
  openingHours?: string | null;
  categories?: { id: number; name: string }[];
}

// Solo imagenes propias o por https
const safeImage = (value?: string | null) =>
  typeof value === "string" && /^(https:\/\/|\/[\w./-]+$|data:image\/)/.test(value) ? value : null;

// La boca del logo ocupa el lugar de la "o"
const MouthO: React.FC<{ color?: "roja" | "crema" | "negra" }> = ({ color = "roja" }) => (
  <img className="gl-mouth-o" src={`/brand/boca-${color}.png`} alt="o" />
);

// Cinta (9.2): frases propias que se mueven solas entre el inicio y el resto.
// Cada frase lleva la boca roja, naranja o negra: las que el manual permite sobre blanco
const TICKER = [
  { text: "Paga en efectivo o con transferencia", boca: "roja" },
  { text: "Sigue tu pedido en vivo", boca: "negra" },
  { text: "Retira en el local", boca: "roja" },
  { text: "Restaurantes de Loja", boca: "naranja" },
];

// Cada lista lleva las frases dos veces para cubrir pantallas anchas; solo las primeras se leen
const TickerList: React.FC<{ hidden?: boolean }> = ({ hidden }) => (
  <ul className="gl-ticker-list" aria-hidden={hidden || undefined}>
    {[...TICKER, ...TICKER].map(({ text, boca }, i) => (
      <li key={i} aria-hidden={!hidden && i >= TICKER.length ? true : undefined}>
        {text}
        <img src={`/brand/boca-${boca}.png`} alt="" />
      </li>
    ))}
  </ul>
);

const Ticker: React.FC = () => {
  const [paused, setPaused] = useState(false);
  return (
    <section className="gl-ticker" aria-label="Lo que tienes con GoEats">
      <div className={`gl-ticker-track${paused ? " is-paused" : ""}`}>
        <TickerList />
        <TickerList hidden />
      </div>
      <button
        type="button"
        className="gl-ticker-pause"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Mover la cinta" : "Pausar la cinta"}
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}
      </button>
    </section>
  );
};

// Como funciona (9.3): es una secuencia real, por eso lleva numeros
const HOW_STEPS = [
  { n: 1, title: "Elige", text: "Busca por antojo o por restaurante y arma tu pedido.", Art: CustomerIllustration, tone: "yellow" },
  { n: 2, title: "Pide", text: "Paga en efectivo o con transferencia. El local lo recibe y lo cocina.", Art: ChefIllustration, tone: "orange" },
  { n: 3, title: "Recibe", text: "Sigue al motorizado en el mapa hasta tu puerta, o retíralo en el local.", Art: RiderIllustration, tone: "red" },
];

// Beneficios (9.5): lo que la cuenta y el plan Plus dan de verdad. Cada icono en un color de la marca
const BENEFITS = [
  { Icon: Sparkles, title: "Envío $0 con Plus", text: "Con GoEats Plus no pagas envío a domicilio.", tone: "yellow" },
  { Icon: Wallet, title: "Pago en efectivo", text: "Paga al recibir o con transferencia.", tone: "red" },
  { Icon: ShoppingBag, title: "Retiro en el local", text: "Pide para llevar y pasa a retirarlo.", tone: "orange" },
  { Icon: Bike, title: "Seguimiento en vivo", text: "Mira cada paso y al motorizado en el mapa.", tone: "black" },
  { Icon: Home, title: "Direcciones guardadas", text: "Tu casa y tu trabajo, listos para el próximo pedido.", tone: "cream" },
  { Icon: RotateCcw, title: "Repite un pedido", text: "Tu favorito otra vez, con un toque.", tone: "red-soft" },
];

// En el celular los beneficios se deslizan de lado, con una barra que dice por donde vas
const BenefitsGrid: React.FC = () => {
  const listRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };
  return (
    <>
      <ul className="gl-benefits" ref={listRef} onScroll={onScroll}>
        {BENEFITS.map(({ Icon, title, text, tone }, i) => (
          <li key={title} data-reveal style={delay(i)}>
            <span className={`gl-benefit-ico tone-${tone}`} aria-hidden="true">
              <Icon size={28} strokeWidth={2.2} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>
      <div className="gl-benefits-progress" aria-hidden="true">
        <span style={{ left: `${progress * 70}%` }} />
      </div>
    </>
  );
};

// Seguimiento en vivo: un celular que muestra los pasos reales del pedido, uno tras otro
const TRACK_STEPS = [
  { label: "Recibido", title: "El local recibió tu pedido", detail: "Te avisamos cuando empiecen a cocinar.", Icon: Receipt, tone: "yellow", eta: "25 min" },
  { label: "Preparando", title: "Tu pedido está en la cocina", detail: "El restaurante lo está preparando.", Icon: ChefHat, tone: "orange", eta: "18 min" },
  { label: "En camino", title: "El motorizado va hacia ti", detail: "Míralo en el mapa hasta tu puerta.", Icon: Bike, tone: "black", eta: "6 min" },
  { label: "Entregado", title: "¡Buen provecho!", detail: "Califica al local y al motorizado.", Icon: Check, tone: "green", eta: null },
];

const TrackDemo: React.FC = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [reduce] = useState(prefersReducedMotion);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);

  // Solo avanza mientras se ve en pantalla
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || hold || !inView) return;
    const timer = window.setTimeout(() => setIdx((i) => (i + 1) % TRACK_STEPS.length), 3200);
    return () => window.clearTimeout(timer);
  }, [idx, playing, hold, inView]);

  const go = (next: number) => setIdx((next + TRACK_STEPS.length) % TRACK_STEPS.length);
  const step = TRACK_STEPS[idx];
  const StepIcon = step.Icon;

  return (
    <div
      className="gl-track"
      ref={boxRef}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div className="gl-phone" aria-hidden="true">
        <span className="gl-phone-notch" />
        <div className={`gl-phone-screen tone-${step.tone}`} key={idx}>
          <div className="gl-phone-top">
            <img src="/brand/boca-roja.png" alt="" />
            <strong>Tu pedido</strong>
            <span className="gl-phone-eta">{step.eta ?? "Listo"}</span>
          </div>
          <div className="gl-phone-bar">
            {TRACK_STEPS.map((s, i) => (
              <i key={s.label} className={i < idx ? "done" : i === idx ? "now" : ""} />
            ))}
          </div>
          <div className="gl-phone-hero">
            <span className="gl-phone-ico">
              <StepIcon size={34} strokeWidth={2.2} />
            </span>
            <strong>{step.title}</strong>
            <small>{step.detail}</small>
          </div>
          <ol className="gl-phone-steps">
            {TRACK_STEPS.map((s, i) => (
              <li key={s.label} className={i < idx ? "done" : i === idx ? "now" : ""}>
                <span>{i < idx ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                {s.label}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="gl-track-ctrl">
        <button type="button" onClick={() => go(idx - 1)} aria-label="Paso anterior">
          <ArrowLeft size={20} />
        </button>
        <p className="gl-track-label">
          <span>Paso {idx + 1} de {TRACK_STEPS.length}</span>
          <strong>{step.label}</strong>
          <span className="sr-only">{step.title}. {step.detail}</span>
        </p>
        <button type="button" onClick={() => go(idx + 1)} aria-label="Paso siguiente">
          <ArrowRight size={20} />
        </button>
      </div>
      <div className="gl-track-dots">
        {TRACK_STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className={i === idx ? "is-on" : ""}
            onClick={() => setIdx(i)}
            aria-label={`Ver el paso ${s.label}`}
            aria-current={i === idx ? "step" : undefined}
          />
        ))}
        {!reduce && (
          <button
            type="button"
            className="gl-track-play"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={!playing}
            aria-label={playing ? "Pausar los pasos" : "Pasar los pasos solos"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

// Tarjeta de un restaurante: foto, abierto o cerrado, logo, nombre y categoria
const RestaurantCard: React.FC<{ r: PublicRestaurant }> = ({ r }) => (
  <Link to={`/r/${encodeURIComponent(r.slug)}`} className="gl-rcard">
    <span className="gl-rcard-photo">
      {safeImage(r.coverImage || r.logo) && <img src={safeImage(r.coverImage || r.logo) || ""} alt="" loading="lazy" />}
      <span className="gl-rcard-badge">
        <OpenBadge hours={r.openingHours} />
      </span>
    </span>
    <span className="gl-rcard-body">
      {safeImage(r.logo) && <img className="gl-rcard-logo" src={safeImage(r.logo) || ""} alt="" loading="lazy" />}
      <span className="gl-rcard-text">
        <strong>{r.name}</strong>
        <small>{r.categories?.[0]?.name || "Restaurante"}</small>
      </span>
    </span>
    {r.promoText && <span className="gl-rcard-promo">{r.promoText}</span>}
  </Link>
);

// Restaurantes de Loja (9.4): carrusel que se mueve con flechas o deslizando; no se mueve solo
const RestaurantCarousel: React.FC<{ restaurants: PublicRestaurant[] }> = ({ restaurants }) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  // Recalcula las flechas cuando llegan los locales o cambia el ancho
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [restaurants.length]);

  const move = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(260, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="gl-carousel">
      <ul className="gl-carousel-track" ref={trackRef} onScroll={updateEdges} aria-label="Restaurantes en GoEats">
        {restaurants.map((r) => (
          <li key={r.id}>
            <RestaurantCard r={r} />
          </li>
        ))}
      </ul>
      <div className="gl-carousel-nav">
        <button type="button" onClick={() => move(-1)} disabled={edge.start} aria-label="Ver restaurantes anteriores">
          <ArrowLeft size={20} />
        </button>
        <button type="button" onClick={() => move(1)} disabled={edge.end} aria-label="Ver más restaurantes">
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export const LandingExperience: React.FC = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [restaurants, setRestaurants] = useState<PublicRestaurant[]>([]);

  useEffect(() => {
    let active = true;
    apiRequest("/restaurants/public/list")
      .then((res) => {
        if (active) setRestaurants(res.restaurants || []);
      })
      .catch(() => {
        if (active) setRestaurants([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // En la landing no se ve la barra de desplazamiento: su fondo crema quedaba como una raya junto al coral.
  // Se sigue bajando con la rueda, el teclado o el dedo; al salir de la landing vuelve la barra normal
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("gl-root");
    return () => root.classList.remove("gl-root");
  }, []);

  // La cabecera se achica y se vuelve blanca al bajar, como en la plantilla
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Restaurantes reales con su carta
  const listed = restaurants.filter((r) => r.slug);
  useReveal(rootRef, listed.length);

  // Portadas reales sin repetir: 6 para el collage (9.6) y la siguiente para el seguimiento en vivo
  const photos = Array.from(
    new Map(
      listed
        .filter((r) => safeImage(r.coverImage))
        .map((r) => [(r.coverImage || "").split("?")[0], r] as const)
    ).values()
  );
  const collage = photos.slice(0, 6);
  const trackPhoto = photos[6];

  const openRestaurants = () => navigate("/restaurants");
  const openRegistration = (role: "customer" | "restaurant" | "driver") => navigate(`/login?role=${role}&mode=register`);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="gl" ref={rootRef}>
      <header className={`gl-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="gl-nav">
          <Link to="/" aria-label="GoEats, ir al inicio" className="gl-brand">
            <BrandLogo size={30} />
          </Link>
          <nav className={`gl-links${menuOpen ? " is-open" : ""}`} aria-label="Navegación principal">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} onClick={closeMenu}>
                {s.label}
              </a>
            ))}
            <Link to="/login" onClick={closeMenu} className="gl-login">
              Iniciar sesión
            </Link>
            {/* Solo en el menu del celular: las dos acciones principales abajo, como en la plantilla */}
            <div className="gl-links-cta">
              <button className="gl-block-btn" onClick={() => { closeMenu(); openRestaurants(); }}>
                Ver restaurantes
              </button>
              <button className="gl-text-link" onClick={() => { closeMenu(); openRegistration("customer"); }}>
                o crea tu cuenta gratis
              </button>
            </div>
          </nav>
          <button className="gl-block-btn gl-nav-cta" onClick={openRestaurants} aria-label="Pedir ahora">
            Pedir<span className="gl-cta-more">&nbsp;ahora</span>
          </button>
          <button
            className="gl-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <main>
        {/* Inicio (9.1), igual que la plantilla: un solo campo coral de borde a borde (con la cabecera),
            la escena de la caja abierta saliendo por la esquina de abajo a la izquierda y el titular a la derecha */}
        <section className="gl-hero" id="inicio">
          <div className="gl-hero-art">
            <HeroScene />
          </div>
          <div className="gl-hero-center">
            <h1 className="gl-hero-title">
              <span className="gl-line" style={delay(0)}>
                <span>
                  La c<MouthO color="negra" />mida
                </span>
              </span>
              <span className="gl-line" style={delay(1)}>
                <span>de Loja,</span>
              </span>
              <span className="gl-line" style={delay(2)}>
                <span>a tu puerta.</span>
              </span>
            </h1>
            <div className="gl-hero-actions">
              <button className="gl-block-btn" onClick={openRestaurants}>
                Ver restaurantes
              </button>
              <button className="gl-text-link" onClick={() => openRegistration("customer")}>
                o crea tu cuenta gratis
              </button>
            </div>
          </div>
        </section>

        <Ticker />

        {/* Como funciona (9.3): Elige, Pide y Recibe en zigzag; el dibujo entra por su lado y el numero salta */}
        <section className="gl-block gl-bg-white" id="como-funciona">
          <div className="gl-head" data-reveal>
            <p className="gl-eyebrow">Cómo funciona</p>
            <h2>Tu antojo en tres pasos.</h2>
          </div>
          <ol className="gl-zz">
            {HOW_STEPS.map(({ n, title, text, Art, tone }) => (
              <li key={n} className={`gl-zz-row tone-${tone}`}>
                <span className="gl-zz-num" aria-hidden="true" data-reveal="pop">
                  {n}
                </span>
                <div className="gl-zz-art" data-reveal={n % 2 ? "left" : "right"}>
                  <Art />
                </div>
                <div className="gl-zz-text" data-reveal style={delay(1)}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="gl-center">
            <button className="gl-pill gl-pill-red gl-pill-lg" onClick={openRestaurants}>
              Empezar a pedir <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Restaurantes de Loja (9.4): a la izquierda cuantos locales hay de verdad, a la derecha el carrusel.
            Sin locales no sale */}
        {listed.length > 0 && (
          <section className="gl-block gl-bg-sun" id="locales">
            <div className="gl-locales">
              <div className="gl-locales-side" data-reveal>
                <p className="gl-eyebrow">Restaurantes de Loja</p>
                <h2>
                  <span className="gl-big-row">
                    <span className="gl-big-num">{listed.length}</span>
                    <img className="gl-locales-boca" src="/brand/boca-roja.png" alt="" />
                  </span>
                  {listed.length === 1 ? "restaurante" : "restaurantes"} a un toque.
                </h2>
                <p>Los de siempre, en un solo lugar. Toca uno y mira su carta.</p>
                <Link to="/restaurants" className="gl-pill gl-pill-black">
                  Ver todos <ArrowRight size={16} />
                </Link>
              </div>
              <div className="gl-locales-list" data-reveal style={delay(1)}>
                <RestaurantCarousel restaurants={listed} />
              </div>
            </div>
          </section>
        )}

        {/* Beneficios (9.5): grid de 6 con iconos de colores, sin cajas */}
        <section className="gl-block gl-bg-white" id="beneficios">
          <div className="gl-head" data-reveal>
            <p className="gl-eyebrow">Beneficios</p>
            <h2>Lo que tienes con GoEats.</h2>
          </div>
          <BenefitsGrid />
          <div className="gl-center">
            <button className="gl-pill gl-pill-black gl-pill-lg" onClick={() => navigate("/plus")}>
              Ver el plan Plus <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Seguimiento en vivo: foto real de un lado y el celular con los pasos del pedido del otro */}
        <section className="gl-app" id="seguimiento">
          <div className={`gl-app-photo${trackPhoto ? "" : " is-empty"}`}>
            {trackPhoto ? (
              <img src={safeImage(trackPhoto.coverImage) || ""} alt="" loading="lazy" />
            ) : (
              <RiderIllustration />
            )}
          </div>
          <div className="gl-app-side">
            <div className="gl-app-copy" data-reveal>
              <p className="gl-eyebrow">En vivo</p>
              <h2>Sigue tu pedido paso a paso.</h2>
              <p>Desde que el local lo recibe hasta que llega a tu puerta, sin llamar a nadie.</p>
            </div>
            <div data-reveal style={delay(1)}>
              <TrackDemo />
            </div>
          </div>
        </section>

        {/* Collage (9.6): fotos reales de los locales con el titulo grande encima */}
        {collage.length >= 3 && (
          <section className="gl-collage" id="antojos" data-count={collage.length}>
            <div className="gl-collage-grid" aria-hidden="true">
              {collage.map((r, i) => (
                <img key={r.id} src={safeImage(r.coverImage) || ""} alt="" loading="lazy" data-reveal style={delay(i)} />
              ))}
            </div>
            <div className="gl-collage-title">
              <h2>
                Un antojo para
                <br />
                cada momento.
              </h2>
              <button className="gl-pill gl-pill-yellow gl-pill-lg" onClick={openRestaurants}>
                Ver restaurantes <ArrowRight size={18} />
              </button>
            </div>
          </section>
        )}

        {/* Para restaurantes (9.7): dibujo del chef con el panel de pedidos y el texto sobre rosa suave */}
        <section className="gl-duo" id="restaurantes">
          <div className="gl-duo-art">
            <div className="gl-duo-stage" data-reveal="left">
              <ChefIllustration />
              <div className="gl-mock gl-duo-mock" aria-hidden="true">
                <div className="gl-mock-top">
                  <span className="gl-mock-logo gl-mock-logo-black">
                    <Store size={18} />
                  </span>
                  <div>
                    <strong>Pedidos de hoy</strong>
                    <small>Tu restaurante</small>
                  </div>
                </div>
                <ul className="gl-rows">
                  <li>
                    <span>Domicilio · 3 platos</span>
                    <em className="st-new">Nuevo</em>
                  </li>
                  <li>
                    <span>Mesa 4 · 2 platos</span>
                    <em className="st-cook">En cocina</em>
                  </li>
                  <li>
                    <span>Para llevar · 1 plato</span>
                    <em className="st-ready">Listo</em>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="gl-duo-text gl-bg-blush">
            <div data-reveal>
              <p className="gl-eyebrow">Para restaurantes</p>
              <h2>Recibe pedidos sin cambiar tu cocina.</h2>
              <p className="gl-duo-lead">
                Los pedidos de la web, de las mesas y para llevar llegan a una sola pantalla. La cocina los ve, la caja
                los cobra y tú ves el día en reportes.
              </p>
              <ul className="gl-duo-feats">
                <li>
                  <ChefHat size={20} aria-hidden="true" /> Pantalla de cocina con tiempos
                </li>
                <li>
                  <QrCode size={20} aria-hidden="true" /> Carta con QR en cada mesa
                </li>
                <li>
                  <Receipt size={20} aria-hidden="true" /> Caja y reportes del día
                </li>
              </ul>
              <button className="gl-pill gl-pill-red gl-pill-lg" onClick={() => openRegistration("restaurant")}>
                Registrar mi restaurante <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Para repartidores (9.8): igual pero al reves, con el motorizado */}
        <section className="gl-duo is-reverse" id="repartidores">
          <div className="gl-duo-art gl-bg-peach">
            <div className="gl-duo-stage" data-reveal="right">
              <RiderIllustration />
              <div className="gl-mock gl-duo-mock" aria-hidden="true">
                <div className="gl-mock-top">
                  <span className="gl-mock-logo gl-mock-logo-yellow">
                    <Bike size={18} />
                  </span>
                  <div>
                    <strong>Pedido disponible</strong>
                    <small>Listo para recoger</small>
                  </div>
                </div>
                <div className="gl-route">
                  <span>
                    <Store size={14} /> Restaurante
                  </span>
                  <i />
                  <span>
                    <MapPin size={14} /> Cliente
                  </span>
                </div>
                <span className="gl-mock-cta">Tomar pedido</span>
              </div>
            </div>
          </div>
          <div className="gl-duo-text gl-bg-black">
            <div data-reveal>
              <p className="gl-eyebrow gl-eyebrow-on-color">Para repartidores</p>
              <h2>Reparte en Loja cuando tú quieras.</h2>
              <p className="gl-duo-lead">
                Te conectas, ves los pedidos listos cerca de ti y tomas los que te sirven. Tu billetera y tus entregas
                quedan en la app.
              </p>
              <ul className="gl-duo-feats">
                <li>
                  <Bike size={20} aria-hidden="true" /> Toma los pedidos que te sirven
                </li>
                <li>
                  <Wallet size={20} aria-hidden="true" /> Billetera con recargas
                </li>
                <li>
                  <Check size={20} aria-hidden="true" /> Historial de tus entregas
                </li>
              </ul>
              <button className="gl-pill gl-pill-yellow gl-pill-lg" onClick={() => openRegistration("driver")}>
                Quiero repartir <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Pie (9.9): la invitacion final y los enlaces reales del sitio en un solo bloque */}
      <footer className="gl-footer">
        <div className="gl-footer-cta">
          <h2>¿Qué se te antoja hoy?</h2>
          <button className="gl-block-btn" onClick={openRestaurants}>
            Ver restaurantes
          </button>
        </div>

        <div className="gl-footer-top">
          <div className="gl-footer-brand">
            <BrandLogo size={30} />
            <p>Comida de los restaurantes de Loja, a domicilio o para retirar en el local.</p>
            <span className="gl-footer-chip">
              <MapPin size={14} /> Loja, Ecuador
            </span>
          </div>

          <nav className="gl-footer-cols" aria-label="Enlaces del sitio">
            <div>
              <h3>Para clientes</h3>
              <Link to="/restaurants">Ver restaurantes</Link>
              <Link to="/plus">GoEats Plus</Link>
              <button onClick={() => openRegistration("customer")}>Crear mi cuenta</button>
              <Link to="/login">Iniciar sesión</Link>
            </div>
            <div>
              <h3>Para negocios</h3>
              <button onClick={() => openRegistration("restaurant")}>Registrar mi restaurante</button>
              <button onClick={() => openRegistration("driver")}>Quiero repartir</button>
              <a href="#restaurantes">Qué recibe tu local</a>
              <a href="#repartidores">Para repartidores</a>
            </div>
            <div>
              <h3>GoEats</h3>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#locales">Locales</a>
              <a href="#beneficios">Beneficios</a>
              <Link to="/support">Ayuda y soporte</Link>
            </div>
          </nav>
        </div>

        <p className="gl-footer-word" aria-hidden="true">
          G<img src="/brand/boca-roja.png" alt="" />EATS
        </p>

        <div className="gl-footer-bottom">
          <p>
            © {new Date().getFullYear()} GoEats · Hecho en Loja con
            <img src="/brand/boca-roja.png" alt="cariño" />
          </p>
          <button className="gl-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Volver arriba <ArrowUp size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};
