import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bike,
  Check,
  ChefHat,
  Menu,
  Pause,
  Play,
  QrCode,
  Receipt,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ChefIllustration, HeroScene, RiderIllustration } from "./LandingIllustrations";
import {
  CashIcon,
  ChiliDoodle,
  ChooseArt,
  CookArt,
  HomeIcon,
  LemonDoodle,
  LojaScene,
  PickupIcon,
  PlusIcon,
  RepeatIcon,
  RideArt,
  SofaScene,
  TrackIcon,
} from "./LandingScenes";
import { OpenBadge } from "./OpenBadge";
import { apiRequest } from "../utils/api";
import { useCalmScroll } from "../utils/useCalmScroll";
import { prefersReducedMotion, revealDelay as delay } from "../utils/useReveal";
import "../styles/landing.css";
import "../styles/landing-sections.css";
import "../styles/landing-template.css";
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

// Barra de promo de la plantilla: sale al bajar y se puede cerrar por el resto de la visita
const PROMO_KEY = "goeats_promo_closed";
const readPromoClosed = () => {
  try {
    return sessionStorage.getItem(PROMO_KEY) === "1";
  } catch {
    return false;
  }
};

// Los carruseles solo avanzan mientras se ven en pantalla
const useInView = (ref: React.RefObject<HTMLElement | null>) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
};

// Un carrusel que avanza de a uno y vuelve al inicio sin salto: al final hay una copia del comienzo
const useLoop = (count: number, every: number, running: boolean) => {
  const [pos, setPos] = useState({ i: 0, slide: false });
  useEffect(() => {
    if (!running || count < 2) return;
    const timer = window.setInterval(() => setPos((p) => ({ i: p.i >= count ? 1 : p.i + 1, slide: true })), every);
    return () => window.clearInterval(timer);
  }, [count, every, running]);
  useEffect(() => {
    if (count < 2 || pos.i < count) return;
    const timer = window.setTimeout(() => setPos({ i: 0, slide: false }), 560);
    return () => window.clearTimeout(timer);
  }, [pos.i, count]);
  return pos;
};

// Franja de la plantilla debajo del inicio: una frase grande que cambia y los locales pasando de a uno.
// La plantilla pone citas de prensa; aqui van solo cosas ciertas de GoEats y los restaurantes reales
const PressStrip: React.FC<{ restaurants: PublicRestaurant[] }> = ({ restaurants }) => {
  const boxRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [reduce] = useState(prefersReducedMotion);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [shift, setShift] = useState(0);
  const inView = useInView(boxRef);

  const phrases = [
    restaurants.length > 1 ? `${restaurants.length} restaurantes de Loja en un solo lugar` : "La comida de Loja en un solo lugar",
    "Paga en efectivo o con transferencia",
    "Sigue tu pedido en vivo hasta tu puerta",
    "Pide para llevar y retira en el local",
  ];
  const running = inView && !paused && !hold && !reduce;
  const phrase = useLoop(phrases.length, 4200, running);
  const loops = restaurants.length > 5;
  const brand = useLoop(loops ? restaurants.length : 0, 2400, running);

  // Cada local mide distinto: se avanza justo hasta el borde del siguiente
  useEffect(() => {
    const el = trackRef.current;
    const measure = () => {
      const item = el?.children[brand.i] as HTMLElement | undefined;
      setShift(item ? item.offsetLeft : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [brand.i, restaurants.length]);

  const list = loops ? [...restaurants, ...restaurants] : restaurants;

  return (
    <section
      className={`gl-press${reduce ? " is-still" : ""}`}
      ref={boxRef}
      aria-label="Lo que tienes con GoEats"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <ul className="sr-only">
        {phrases.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      <div className="gl-press-view" aria-hidden="true">
        <div
          className={`gl-press-track${phrase.slide ? " is-sliding" : ""}`}
          style={{ transform: `translateX(-${phrase.i * 100}%)` }}
        >
          {[...phrases, phrases[0]].map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      </div>
      {restaurants.length > 0 && (
        <div className="gl-brands">
          <ul
            className={`gl-brands-track${brand.slide ? " is-sliding" : ""}${loops ? "" : " is-few"}`}
            ref={trackRef}
            style={{ transform: `translateX(-${shift}px)` }}
            aria-label="Restaurantes en GoEats"
          >
            {list.map((r, i) => {
              const copy = i >= restaurants.length;
              return (
                <li key={i} aria-hidden={copy || undefined}>
                  <Link to={`/r/${encodeURIComponent(r.slug)}`} tabIndex={copy ? -1 : undefined}>
                    {safeImage(r.logo) && <img src={safeImage(r.logo) || ""} alt="" />}
                    {r.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!reduce && (
        <button
          type="button"
          className="gl-press-pause"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? "Mover las frases y los locales" : "Pausar las frases y los locales"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      )}
    </section>
  );
};

// Como funciona (9.3): es una secuencia real, por eso lleva numeros
const HOW_STEPS = [
  { n: 1, title: "Elige", text: "Busca por antojo o por restaurante y arma tu pedido.", Art: ChooseArt, tone: "yellow" },
  { n: 2, title: "Pide", text: "Paga en efectivo o con transferencia. El local lo recibe y lo cocina.", Art: CookArt, tone: "orange" },
  { n: 3, title: "Recibe", text: "Sigue al motorizado en el mapa hasta tu puerta, o retíralo en el local.", Art: RideArt, tone: "red" },
];

// Beneficios (9.5): lo que la cuenta y el plan Plus dan de verdad. Iconos negros y grandes, como la plantilla
const BENEFITS = [
  { Icon: PlusIcon, title: "Envío $0 con Plus", text: "Con GoEats Plus no pagas envío a domicilio." },
  { Icon: CashIcon, title: "Pago en efectivo", text: "Paga al recibir o con transferencia." },
  { Icon: PickupIcon, title: "Retiro en el local", text: "Pide para llevar y pasa a retirarlo." },
  { Icon: TrackIcon, title: "Seguimiento en vivo", text: "Mira cada paso y al motorizado en el mapa." },
  { Icon: HomeIcon, title: "Direcciones guardadas", text: "Tu casa y tu trabajo, listos para el próximo pedido." },
  { Icon: RepeatIcon, title: "Repite un pedido", text: "Tu favorito otra vez, con un toque." },
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
        {BENEFITS.map(({ Icon, title, text }) => (
          <li key={title}>
            <span className="gl-benefit-ico" aria-hidden="true">
              <Icon />
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
  const inView = useInView(boxRef);

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
      <div className="gl-track-row">
        <button type="button" className="gl-track-arrow" onClick={() => go(idx - 1)} aria-label="Paso anterior">
          <ArrowLeft size={30} />
        </button>
        <span className="gl-doodle-left">
          <ChiliDoodle />
        </span>
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
        <span className="gl-doodle-right">
          <LemonDoodle />
        </span>
        <button type="button" className="gl-track-arrow" onClick={() => go(idx + 1)} aria-label="Paso siguiente">
          <ArrowRight size={30} />
        </button>
      </div>
      <p className="gl-track-label">
        <strong>{step.label}</strong>
        <span className="sr-only">
          Paso {idx + 1} de {TRACK_STEPS.length}. {step.title}. {step.detail}
        </span>
      </p>
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
      {safeImage(r.coverImage || r.logo) && <img src={safeImage(r.coverImage || r.logo) || ""} alt="" loading="lazy" decoding="async" />}
      <span className="gl-rcard-badge">
        <OpenBadge hours={r.openingHours} />
      </span>
    </span>
    <span className="gl-rcard-body">
      {safeImage(r.logo) && <img className="gl-rcard-logo" src={safeImage(r.logo) || ""} alt="" loading="lazy" decoding="async" />}
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

// La cabecera va aparte: cambia al bajar y al subir, y asi no se vuelve a dibujar toda la pagina
const LandingHeader: React.FC<{ onOrder: () => void; onRegister: () => void }> = ({ onOrder, onRegister }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [promoClosed, setPromoClosed] = useState(readPromoClosed);

  // Como en la plantilla: al bajar la cabecera se esconde y queda la barra de promo; al subir vuelve
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last) < 6) return;
      setHeaderHidden(y > last && y > 240);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closePromo = () => {
    setPromoClosed(true);
    try {
      sessionStorage.setItem(PROMO_KEY, "1");
    } catch {
      // Sin almacenamiento se cierra igual, solo en esta vista
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`gl-header${scrolled ? " is-scrolled" : ""}${headerHidden && !menuOpen ? " is-hidden" : ""}${menuOpen ? " is-menu" : ""}`}>
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
            <button className="gl-block-btn" onClick={() => { closeMenu(); onOrder(); }}>
              Ver restaurantes
            </button>
            <button className="gl-text-link" onClick={() => { closeMenu(); onRegister(); }}>
              o crea tu cuenta gratis
            </button>
          </div>
        </nav>
        <button className="gl-block-btn gl-nav-cta" onClick={onOrder} aria-label="Pedir ahora">
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
      {scrolled && !promoClosed && !menuOpen && (
        <div className="gl-promo">
          <Link to="/plus">
            <strong>Envío $0</strong> en tus pedidos a domicilio con GoEats Plus
          </Link>
          <button type="button" onClick={closePromo} aria-label="Cerrar el aviso">
            <X size={20} />
          </button>
        </div>
      )}
    </header>
  );
};

export const LandingExperience: React.FC = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
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

  // Restaurantes reales con su carta
  const listed = restaurants.filter((r) => r.slug);
  useCalmScroll(rootRef, listed.length);

  // Portadas reales sin repetir: 3 para el collage suelto, una para el seguimiento y otra para los locales
  const photos = Array.from(
    new Map(
      listed
        .filter((r) => safeImage(r.coverImage))
        .map((r) => [(r.coverImage || "").split("?")[0], r] as const)
    ).values()
  );
  const collage = photos.slice(0, 3);
  const trackPhoto = photos[3];
  const guidesPhoto = photos[4];

  const openRestaurants = () => navigate("/restaurants");
  const openRegistration = (role: "customer" | "restaurant" | "driver") => navigate(`/login?role=${role}&mode=register`);

  return (
    <div className="gl" ref={rootRef}>
      <LandingHeader onOrder={openRestaurants} onRegister={() => openRegistration("customer")} />

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
            </div>
          </div>
        </section>

        <PressStrip restaurants={listed} />

        {/* Como funciona (9.3): tres pasos escalonados, como la plantilla: 1 y 3 a la izquierda y 2 a la derecha */}
        <section className="gl-how" id="como-funciona">
          <h2 className="gl-how-title">
            Cómo funciona
          </h2>
          <ol className="gl-how-grid">
            {HOW_STEPS.map(({ n, title, text, Art, tone }) => (
              <li key={n} className={`gl-how-step tone-${tone}`}>
                <div className="gl-how-art">
                  <Art />
                </div>
                <div className="gl-how-text">
                  <span className="gl-how-num" aria-hidden="true">
                    {n}
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {n === 3 && (
                    <button className="gl-block-btn" onClick={openRestaurants}>
                      Ver restaurantes
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Restaurantes de Loja (9.4): cuantos locales hay de verdad con el dibujo apoyado abajo y el carrusel al lado.
            Sin locales no sale */}
        {listed.length > 0 && (
          <section className="gl-locales-band" id="locales">
            <div className="gl-locales">
              <div className="gl-locales-side">
                <h2>
                  {listed.length} {listed.length === 1 ? "local" : "locales"}
                  <br />
                  de Loja
                </h2>
                <Link to="/restaurants" className="gl-outline-btn">
                  Ver todos
                </Link>
                <SofaScene />
              </div>
              <div className="gl-locales-list">
                <RestaurantCarousel restaurants={listed} />
              </div>
            </div>
          </section>
        )}

        {/* Beneficios (9.5): 6 iconos negros, sin titulo a la vista y con un solo boton, como la plantilla */}
        <section className="gl-block gl-bg-white" id="beneficios">
          <h2 className="sr-only">Beneficios</h2>
          <BenefitsGrid />
          <div className="gl-center">
            <button className="gl-block-btn" onClick={openRestaurants}>
              Ver restaurantes
            </button>
          </div>
        </section>

        {/* Collage (9.6): fotos reales sueltas con el titulo enorme montado encima; se mueven distinto al bajar */}
        {collage.length === 3 && (
          <section className="gl-loose" id="antojos">
            {collage.map((r, i) => (
              <div key={r.id} className={`gl-loose-photo is-${i + 1}`} data-drift={["fast", "slow", undefined][i]}>
                <img src={safeImage(r.coverImage) || ""} alt="" loading="lazy" decoding="async" />
              </div>
            ))}
            <h2>
              Un antojo
              <br />
              para cada
              <br />
              momento
            </h2>
          </section>
        )}

        {/* Seguimiento en vivo: foto real de un lado y el celular con los pasos del pedido del otro */}
        <section className="gl-app" id="seguimiento">
          <div className={`gl-app-photo${trackPhoto ? "" : " is-empty"}`}>
            {trackPhoto ? (
              <img src={safeImage(trackPhoto.coverImage) || ""} alt="" loading="lazy" decoding="async" />
            ) : (
              <RiderIllustration />
            )}
          </div>
          <div className="gl-app-side">
            <h2>Sigue tu pedido paso a paso, desde la cocina hasta tu puerta.</h2>
            <div>
              <TrackDemo />
            </div>
          </div>
        </section>

        {/* Para repartidores (9.8): texto a la izquierda y la moto dando la vuelta a Loja */}
        <section className="gl-fleet" id="repartidores">
          <div className="gl-fleet-text">
            <h2>
              Reparte
              <br />
              cuando tú
              <br />
              quieras
            </h2>
            <p>Te conectas, ves los pedidos listos cerca de ti y tomas los que te sirven.</p>
            <p>Tu billetera, tus recargas y el historial de tus entregas quedan en la app.</p>
            <button className="gl-outline-btn" onClick={() => openRegistration("driver")}>
              Quiero repartir
            </button>
          </div>
          <LojaScene />
        </section>

        {/* Para restaurantes (9.7): foto de borde a borde, titulo montado y tres hojas con lo que recibe el local */}
        <section className="gl-guides" id="restaurantes">
          <div className="gl-guides-photo">
            {guidesPhoto ? (
              <img src={safeImage(guidesPhoto.coverImage) || ""} alt="" loading="lazy" decoding="async" />
            ) : (
              <ChefIllustration />
            )}
          </div>
          <div className="gl-guides-text">
            <h2>
              Tu local
              <br />
              recibe,
              <br />
              cocina
              <br />y cobra
            </h2>
            <button className="gl-block-btn" onClick={() => openRegistration("restaurant")}>
              Registrar mi restaurante
            </button>
          </div>
          <ul className="gl-papers">
            <li className="gl-paper is-1" data-drift="slow">
              <span className="gl-paper-top is-red">Cocina</span>
              <h3>Mesa 4</h3>
              <ul className="gl-paper-list">
                <li>2 × Hamburguesa</li>
                <li>1 × Papas grandes</li>
                <li>1 × Limonada</li>
              </ul>
              <p>La web, las mesas y para llevar llegan a una sola pantalla, con sus tiempos.</p>
            </li>
            <li className="gl-paper is-2" data-drift="fast">
              <span className="gl-paper-top is-yellow">Carta</span>
              <h3>Con QR</h3>
              <QrCode className="gl-paper-qr" size={92} strokeWidth={1.6} aria-hidden="true" />
              <p>Un código en cada mesa: el cliente mira la carta y pide desde su celular.</p>
            </li>
            <li className="gl-paper is-3" data-drift="far">
              <span className="gl-paper-top is-orange">Caja</span>
              <h3>Cierre del día</h3>
              <ul className="gl-paper-list">
                <li>Efectivo</li>
                <li>Transferencia</li>
                <li>Domicilios</li>
              </ul>
              <p>La caja cobra y tú ves el día completo en reportes.</p>
            </li>
          </ul>
        </section>

        {/* Invitacion final: una franja con la frase y un solo boton */}
        <section className="gl-last">
          <h2>¿Qué se te antoja hoy?</h2>
          <button className="gl-block-btn" onClick={openRestaurants}>
            Ver restaurantes
          </button>
        </section>
      </main>

      {/* Pie (9.9): el logo grande a la izquierda y los enlaces reales del sitio */}
      <footer className="gl-footer">
        <div className="gl-footer-top">
          <div className="gl-footer-brand">
            <BrandLogo size={72} />
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
            </div>
            <div className="gl-footer-hello">
              <h3>Escríbenos</h3>
              <Link to="/support">Ayuda y soporte</Link>
              <span>Loja, Ecuador</span>
            </div>
          </nav>
        </div>

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
