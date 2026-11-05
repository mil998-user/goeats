import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bike,
  Check,
  Clock3,
  MapPin,
  Menu,
  MessageSquareQuote,
  Search,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  X,
} from "lucide-react";


const sections = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "descuentos", label: "Descuentos" },
  { id: "restaurantes", label: "Restaurantes" },
  { id: "repartidores", label: "Repartidores" },
];

const promos = [
  { label: "Regalo de bienvenida", value: "30% OFF", code: "HOLA30", detail: "en tu primer pedido" },
  { label: "Solo por registrarte", value: "ENVÍO GRATIS", code: "LOJALOVE", detail: "en tu primera entrega" },
];

export const LandingExperience: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [promoVisible, setPromoVisible] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    let hasOpened = false;
    const showPromo = () => {
      if (hasOpened || window.scrollY <= 420) return;
      hasOpened = true;
      setPromoVisible(true);
      window.removeEventListener("scroll", showPromo);
    };
    const fallbackTimer = window.setTimeout(() => {
      if (hasOpened) return;
      hasOpened = true;
      setPromoVisible(true);
      window.removeEventListener("scroll", showPromo);
    }, 6000);
    window.addEventListener("scroll", showPromo, { passive: true });

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("scroll", showPromo);
    };
  }, []);

  useEffect(() => {
    if (!promoVisible) return;
    const rotationTimer = window.setInterval(() => {
      setPromoIndex((current) => (current + 1) % promos.length);
    }, 9000);
    return () => window.clearInterval(rotationTimer);
  }, [promoVisible]);

  const openRestaurants = () => navigate("/restaurants");
  const openRegistration = (role: "customer" | "restaurant" | "driver") => {
    navigate(`/login?role=${role}&mode=register`);
  };

  const copyCode = async (code: string) => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode((current) => current === code ? null : current), 1800);
    } catch {
      setCopiedCode(null);
      setCopyError(true);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="ge-landing">
      <header className="ge-header">
        <div className="ge-nav">
          <Link className="ge-brand" to="/" aria-label="GoEats, ir al inicio">
            <span>Go<span>Eats</span></span>
          </Link>
          <nav className={`ge-nav-links${menuOpen ? " is-open" : ""}`} aria-label="Navegación principal">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} onClick={closeMenu}>{section.label}</a>
            ))}
            <a className="ge-mobile-cta" href="#descargar" onClick={closeMenu}>Pedir ahora</a>
          </nav>
          <button className="ge-nav-cta" onClick={openRestaurants}>
            Explorar restaurantes <ArrowRight size={16} />
          </button>
          <button
            className="ge-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </header>

      <main>
        <section className="ge-hero" id="inicio">
          <div className="ge-hero-content">
            <div className="ge-hero-copy">
              <h1>Tu comida favorita, <em>a un clic!</em></h1>
              <p className="ge-hero-subtitle">
                Tus sabores favoritos, desde la cocina hasta tu puerta. Rápido, local y sin complicaciones.
              </p>
              <div className="ge-hero-actions">
                <button className="ge-action-link" onClick={openRestaurants}>
                  Pedir ahora <span><ArrowUpRight size={19} /></span>
                </button>
                <a className="ge-text-link" href="#restaurantes">
                  Tengo un restaurante <ArrowRight size={16} />
                </a>
              </div>
              <div className="ge-hero-proof">
                <span className="ge-proof-icon"><Store size={17} /></span>
                <p><strong>Sabores locales, en un solo lugar.</strong><br />Encuentra tu próximo favorito en Loja.</p>
              </div>
            </div>
            <div className="ge-hero-visual" aria-label="Comida preparada para compartir">
              <div className="ge-hero-image">
                <img
                  src="https://images.unsplash.com/photo-1722239318187-fcd98589c3f7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400"
                  alt="Mesa servida con platos para compartir"
                  fetchPriority="high"
                />
              </div>
              <div className="ge-floating-card ge-order-card">
                <span className="ge-order-icon"><ShoppingBag size={20} /></span>
                <span><strong>Tu pedido, más cerca</strong></span>
                <span className="ge-live-dot" aria-hidden="true" />
              </div>
              <div className="ge-floating-card ge-restaurant-card">
                <span className="ge-mini-food" aria-hidden="true" />
                <span><small>Descubre algo nuevo</small><strong>Sabores locales</strong></span>
                <span className="ge-card-rating"><MapPin size={12} /> Loja</span>
              </div>
            </div>
          </div>
          <a className="ge-scroll-note" href="#como-funciona" aria-label="Descubre cómo funciona">
            <span><ArrowDown size={14} /></span> Descubre más
          </a>
        </section>

        <section className="ge-how-section" id="como-funciona">
          <div className="ge-section-container">
            <div className="ge-section-heading ge-centered">
              <p className="ge-eyebrow">Así de fácil</p>
              <h2>Tu antojo, a unos toques de distancia.</h2>
              <p className="ge-section-copy">Descubre lo mejor de Loja y recíbelo donde estés.</p>
            </div>
            <div className="ge-steps-grid">
              <article className="ge-step-card">
                <span className="ge-step-number">01</span>
                <span className="ge-step-icon"><MapPin /></span>
                <h3>Encuentra algo cerca</h3>
                <p>Explora restaurantes locales y opciones disponibles para tu zona.</p>
              </article>
              <article className="ge-step-card ge-step-featured">
                <span className="ge-step-number">02</span>
                <span className="ge-step-icon"><Search /></span>
                <h3>Elige lo que te provoca</h3>
                <p>Revisa menús, encuentra tus favoritos y arma tu pedido.</p>
              </article>
              <article className="ge-step-card">
                <span className="ge-step-number">03</span>
                <span className="ge-step-icon"><Bike /></span>
                <h3>Recíbelo y disfruta</h3>
                <p>Completa tu pedido y coordina la entrega hasta tu puerta.</p>
              </article>
            </div>
            <button className="ge-secondary-link" onClick={openRestaurants}>
              Ver restaurantes disponibles <ArrowRight size={17} />
            </button>
          </div>
        </section>

        <section className="ge-promo-section" id="descuentos">
          <div className="ge-section-container ge-promo-shell">
            <div className="ge-promo-heading">
              <span className="ge-promo-heading-icon"><Ticket /></span>
              <div>
                <p className="ge-eyebrow">Beneficios GoEats</p>
                <h2>Un buen pedido empieza ahorrando.</h2>
              </div>
              <p>Explora los códigos de muestra y descubre ofertas para tus próximos pedidos.</p>
            </div>
            <div className="ge-coupon-grid">
              <article className="ge-coupon-card ge-coupon-1">
                <div className="ge-coupon-top">
                  <span>Primer pedido</span>
                  <strong>30% OFF</strong>
                  <p>Hasta $5 de descuento en tu primera orden.</p>
                </div>
                <div className="ge-coupon-code">
                  <span><small>Usa el código</small><strong>HOLA30</strong></span>
                  <button onClick={() => copyCode("HOLA30")} aria-label="Copiar código HOLA30">
                    {copiedCode === "HOLA30" ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </article>
              <article className="ge-coupon-card ge-coupon-2">
                <div className="ge-coupon-top">
                  <span>Envío gratis</span>
                  <strong>$0 ENVÍO</strong>
                  <p>Tu primera entrega corre por nuestra cuenta.</p>
                </div>
                <div className="ge-coupon-code">
                  <span><small>Usa el código</small><strong>LOJALOVE</strong></span>
                  <button onClick={() => copyCode("LOJALOVE")} aria-label="Copiar código LOJALOVE">
                    {copiedCode === "LOJALOVE" ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>
              </article>
              <article className="ge-signup-card">
                <span className="ge-signup-badge">Solo para nuevos usuarios</span>
                <h3>Desbloquea estas promos en minutos.</h3>
                <p>Crea tu cuenta en GoEats y descubre beneficios para tus pedidos.</p>
                <button className="ge-action-link ge-action-light" onClick={() => openRegistration("customer")}>
                  Crear mi cuenta gratis <span><ArrowUpRight size={19} /></span>
                </button>
                <small>Los códigos son de muestra; aplican términos y condiciones.</small>
              </article>
            </div>
            {copyError && (
              <p className="ge-copy-error" role="status">
                No se pudo copiar. Selecciona el código y cópialo manualmente.
              </p>
            )}
            <p className="ge-promo-disclaimer">
              Códigos promocionales de muestra. La vigencia y el canje deben activarse en el sistema de pedidos antes de publicar estas ofertas.
            </p>
          </div>
        </section>

        <section className="ge-reviews-section" id="resenas">
          <div className="ge-section-container">
            <div className="ge-reviews-heading">
              <div className="ge-section-heading">
                <p className="ge-eyebrow">Opiniones de usuarios</p>
                <h2>Lo que comparte la comunidad GoEats.</h2>
                <p className="ge-section-copy">Experiencias de quienes descubren y disfrutan GoEats.</p>
              </div>
              <div className="ge-reviews-score">
                <strong>Reseñas</strong>
                <span>Opiniones de usuarios</span>
              </div>
            </div>
            <div className="ge-reviews-grid">
              <article className="ge-review-card ge-review-featured">
                <MessageSquareQuote />
                <div className="ge-review-stars" aria-label="Calificación de ejemplo: 5 de 5">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}
                </div>
                <p>Encontré varias opciones de comida local en un solo lugar. ¡Así da gusto elegir qué pedir!</p>
                <div className="ge-review-author">
                  <span className="ge-review-avatar">U</span>
                  <span><strong>Usuario de ejemplo</strong><small>Reseña ilustrativa</small></span>
                </div>
              </article>
              <article className="ge-review-card">
                <MessageSquareQuote />
                <div className="ge-review-stars" aria-label="Calificación de ejemplo: 5 de 5">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}
                </div>
                <p>El menú me ayudó a descubrir un nuevo favorito. Hacer el pedido fue muy sencillo.</p>
                <div className="ge-review-author">
                  <span className="ge-review-avatar">U</span>
                  <span><strong>Usuario de ejemplo</strong><small>Reseña ilustrativa</small></span>
                </div>
              </article>
              <article className="ge-review-card">
                <MessageSquareQuote />
                <div className="ge-review-stars" aria-label="Calificación de ejemplo: 5 de 5">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill="currentColor" />)}
                </div>
                <p>Me gusta tener opciones de mi ciudad y recibir mi comida sin complicaciones.</p>
                <div className="ge-review-author">
                  <span className="ge-review-avatar">U</span>
                  <span><strong>Usuario de ejemplo</strong><small>Reseña ilustrativa</small></span>
                </div>
              </article>
            </div>
            <p className="ge-reviews-note">Reseñas de ejemplo. Se mostrarán opiniones reales cuando estén disponibles.</p>
          </div>
        </section>

        <section className="ge-partner-section" id="restaurantes">
          <div className="ge-section-container ge-partner-grid">
            <div className="ge-partner-image">
              <img
                src="https://images.unsplash.com/photo-1781585809212-471d67b9f479?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200"
                alt="Propietario atendiendo su restaurante"
                loading="lazy"
              />
              <span className="ge-metric-card"><Store size={20} /><span>Negocios locales<br /><strong>crecen en comunidad</strong></span></span>
            </div>
            <div className="ge-partner-copy">
              <div className="ge-section-heading">
                <p className="ge-eyebrow">Para restaurantes</p>
                <h2>Tu cocina merece llegar más lejos.</h2>
                <p className="ge-section-copy">Con GoEats, tu negocio se conecta con personas en Loja que buscan su próxima comida favorita.</p>
              </div>
              <ul className="ge-benefit-list">
                <li><Check /><span><strong>Más visibilidad local</strong><small>Presenta tu menú a nuevos clientes.</small></span></li>
                <li><Check /><span><strong>Tú cocinas, nosotros conectamos</strong><small>Gestiona tus pedidos desde un solo lugar.</small></span></li>
                <li><Check /><span><strong>Crece acompañado</strong><small>Recibe apoyo de un equipo que conoce Loja.</small></span></li>
              </ul>
              <button className="ge-action-link" onClick={() => openRegistration("restaurant")}>
                Registrar mi restaurante <span><ArrowUpRight size={19} /></span>
              </button>
            </div>
          </div>
        </section>

        <section className="ge-rider-section" id="repartidores">
          <div className="ge-section-container ge-rider-grid">
            <div className="ge-rider-copy">
              <div className="ge-section-heading">
                <p className="ge-eyebrow">Para repartidores</p>
                <h2>Muévete por Loja. Gana a tu ritmo.</h2>
                <p className="ge-section-copy">Convierte tu tiempo libre en ingresos. Tú eliges cuándo conectarte y cuánto quieres avanzar.</p>
              </div>
              <div className="ge-rider-benefits">
                <div><Clock3 /><strong>Tu propio horario</strong><span>Conéctate cuando quieras.</span></div>
                <div><Bike /><strong>Tu ruta, tus metas</strong><span>Gana por cada entrega.</span></div>
                <div><Store /><strong>Comunidad local</strong><span>Conecta con negocios.</span></div>
              </div>
              <button className="ge-action-link ge-action-light" onClick={() => openRegistration("driver")}>
                Quiero repartir con GoEats <span><ArrowUpRight size={19} /></span>
              </button>
            </div>
            <div className="ge-rider-image">
              <img
                src="https://images.unsplash.com/photo-1612006567758-1846b36dd130?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200"
                alt="Repartidor recorriendo la ciudad en motocicleta"
                loading="lazy"
              />
              <span className="ge-earnings-card">
                <small>Tu ruta, tus metas</small>
                <strong>Reparte en Loja</strong>
                <span className="ge-earnings-line"><i /><i /><i /><i /><i /><i /><i /></span>
              </span>
            </div>
          </div>
        </section>

        <section className="ge-explore-section" id="descargar">
          <div className="ge-explore-inner">
            <p className="ge-eyebrow">Lo mejor de Loja, en tu mano</p>
            <h2>¿Qué se te antoja hoy?</h2>
            <p>Explora GoEats y encuentra tus sabores favoritos en Loja.</p>
            <div className="ge-explore-actions">
              <button className="ge-action-link ge-action-light" onClick={openRestaurants}>
                Explorar restaurantes <span><ArrowUpRight size={19} /></span>
              </button>
              <button className="ge-explore-signup" onClick={() => openRegistration("customer")}>
                Crear mi cuenta gratis
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="ge-footer">
        <div className="ge-footer-inner">
          <div className="ge-footer-brand">
            <Link className="ge-brand" to="/" aria-label="GoEats, ir al inicio">
              <span className="ge-brand-mark"><MapPin size={19} /></span>
              <span>Go<span>Eats</span></span>
            </Link>
            <p>Conectando los sabores de Loja.</p>
          </div>
          <nav className="ge-footer-links" aria-label="Enlaces del sitio">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#descuentos">Descuentos</a>
            <a href="#restaurantes">Restaurantes</a>
            <a href="#repartidores">Repartidores</a>
            <Link to="/support">Ayuda y soporte</Link>
          </nav>
          <p className="ge-copyright">© {new Date().getFullYear()} GoEats. Hecho en Loja.</p>
        </div>
      </footer>
      {promoVisible && (
        <aside className="ge-promo-popup" aria-live="polite" aria-label="Promoción de GoEats">
          <button className="ge-promo-close" onClick={() => setPromoVisible(false)} aria-label="Cerrar promoción">
            <X size={15} />
          </button>
          <div className="ge-promo-art">
            <Ticket size={42} />
            <span>GO</span>
          </div>
          <div className="ge-promo-popup-content">
            <span className="ge-promo-label">{promos[promoIndex].label}</span>
            <strong>{promos[promoIndex].value}</strong>
            <p>{promos[promoIndex].detail}</p>
            <button className="ge-promo-copy" onClick={() => copyCode(promos[promoIndex].code)}>
              <span><small>Código de muestra</small>{promos[promoIndex].code}</span>
              <b>{copiedCode === promos[promoIndex].code ? "¡Copiado!" : "Copiar"}</b>
            </button>
          </div>
          <span className="ge-promo-progress" key={promoIndex} />
        </aside>
      )}
    </div>
  );
};
