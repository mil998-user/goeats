import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  Bike,
  Check,
  ChefHat,
  Menu,
  MapPin,
  Printer,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ChefIllustration, RiderIllustration } from "./LandingIllustrations";
import { OpenBadge } from "./OpenBadge";
import { apiRequest } from "../utils/api";
import "../styles/landing.css";

const sections = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "beneficios", label: "Beneficios" },
  { id: "restaurantes", label: "Restaurantes" },
  { id: "repartidores", label: "Repartidores" },
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
const MouthO: React.FC = () => <img className="gl-mouth-o" src="/brand/boca-roja.png" alt="o" />;

// Tarjeta de un restaurante (foto, abierto/cerrado, logo, nombre, categoria y promocion)
const RestaurantCard: React.FC<{ r: PublicRestaurant; hidden?: boolean }> = ({ r, hidden }) => (
  <Link
    to={`/r/${encodeURIComponent(r.slug)}`}
    className="gl-rcard"
    aria-hidden={hidden || undefined}
    tabIndex={hidden ? -1 : undefined}
  >
    <span className="gl-rcard-photo">
      <img src={safeImage(r.coverImage || r.logo) || ""} alt="" loading="lazy" />
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

// Columnas de restaurantes al lado del titular: cada columna se mueve despacio
// (la del medio al reves) y se detiene al pasar el mouse para poder tocar una tarjeta.
// En el celular las mismas columnas se ven como filas debajo del texto.
const COLS = 3;
const PER_COL = 6;
const RestaurantColumns: React.FC<{ restaurants: PublicRestaurant[] }> = ({ restaurants }) => {
  const cols = Array.from({ length: COLS }, (_, col) =>
    Array.from({ length: PER_COL }, (_, i) => restaurants[(col * 4 + i) % restaurants.length])
  );
  return (
    <div className="gl-cols" aria-label="Restaurantes en GoEats">
      {cols.map((items, col) => (
        <div key={col} className={`gl-col${col % 2 ? " is-reverse" : ""}`}>
          <div className="gl-col-track" style={{ animationDuration: `${46 + col * 8}s` }}>
            {/* La lista va dos veces para que el movimiento no tenga corte; la copia no se lee ni se tabula */}
            {items.map((r, i) => (
              <RestaurantCard key={`a-${col}-${i}`} r={r} hidden={col > 0 || i >= restaurants.length} />
            ))}
            {items.map((r, i) => (
              <RestaurantCard key={`b-${col}-${i}`} r={r} hidden />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const LandingExperience: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Tarjetas del inicio: restaurantes reales con foto
  const featured = restaurants.filter((r) => r.slug && safeImage(r.coverImage || r.logo)).slice(0, 12);
  // Promociones reales que cargaron los restaurantes
  const promos = restaurants.filter((r) => r.promoText && r.slug).slice(0, 2);
  // Foto de un plato real para la seccion "Como funciona"
  const howPhoto = safeImage(featured.find((r) => r.coverImage)?.coverImage);
  // Otra foto real para la tarjeta de la cuenta (distinta a la de "Como funciona")
  const withCover = featured.filter((r) => r.coverImage);
  const accountPhoto = safeImage(withCover[3]?.coverImage || withCover[1]?.coverImage);

  const openRestaurants = () => navigate("/restaurants");
  const openRegistration = (role: "customer" | "restaurant" | "driver") => navigate(`/login?role=${role}&mode=register`);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="gl">
      <header className="gl-header">
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
          </nav>
          <button className="gl-pill gl-pill-yellow gl-nav-cta" onClick={openRestaurants}>
            Pedir ahora
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
        {/* Inicio: titular a la izquierda y restaurantes reales en columnas a la derecha */}
        <section className="gl-hero" id="inicio">
          <div className="gl-hero-center">
            <p className="gl-chip">
              <MapPin size={14} /> Loja, Ecuador · a domicilio o para retirar
            </p>
            <h1 className="gl-hero-title">
              La c<MouthO />mida
              <br />
              de Loja,
              <br />
              <span>a tu puerta.</span>
            </h1>
            <p className="gl-hero-sub">
              Pide a los restaurantes de tu ciudad, sigue tu pedido en vivo y recíbelo en casa o retíralo en el local.
            </p>
            {/* Boton y enlace en un mismo bloque para que el enlace quede centrado bajo el boton */}
            <div className="gl-hero-actions">
              <button className="gl-pill gl-pill-yellow gl-pill-lg" onClick={openRestaurants}>
                Ver restaurantes <ArrowRight size={18} />
              </button>
              <button className="gl-text-link" onClick={() => openRegistration("customer")}>
                Crear mi cuenta gratis
              </button>
            </div>
          </div>

          {featured.length > 0 && <RestaurantColumns restaurants={featured} />}
        </section>

        {/* Como funciona: texto y pasos a la izquierda; a la derecha la pantalla de seguimiento
            con los estados reales del pedido sobre un bloque rojo con un plato real */}
        <section className="gl-section gl-tone-peach" id="como-funciona">
          <div className="gl-how">
            <div className="gl-how-text">
              <p className="gl-eyebrow">Cómo funciona</p>
              <h2>Pide en tres pasos y mira cada uno en vivo.</h2>
              <p className="gl-how-lead">
                Eliges el plato, pagas en efectivo o con transferencia y GoEats te avisa cuando el restaurante lo cocina
                y cuando sale el motorizado.
              </p>

              {/* Es una secuencia real: elegir, pedir, recibir */}
              <ol className="gl-how-steps">
                <li className="tone-yellow">
                  <span className="gl-how-num">1</span>
                  <span className="gl-how-copy">
                    <strong>Elige</strong>
                    <span>Busca por antojo o por restaurante.</span>
                  </span>
                  <Search size={20} className="gl-how-ico" />
                </li>
                <li className="tone-orange">
                  <span className="gl-how-num">2</span>
                  <span className="gl-how-copy">
                    <strong>Pide</strong>
                    <span>A domicilio o para retirar en el local.</span>
                  </span>
                  <ShoppingBag size={20} className="gl-how-ico" />
                </li>
                <li className="tone-red">
                  <span className="gl-how-num">3</span>
                  <span className="gl-how-copy">
                    <strong>Recibe</strong>
                    <span>Sigue el estado hasta que llegue.</span>
                  </span>
                  <Bike size={20} className="gl-how-ico" />
                </li>
              </ol>

              <button className="gl-pill gl-pill-red gl-pill-lg" onClick={openRestaurants}>
                Empezar a pedir <ArrowRight size={18} />
              </button>
            </div>

            <div className="gl-how-stage" aria-hidden="true">
              <img className="gl-how-boca" src="/brand/boca-crema.png" alt="" />
              {howPhoto && <img className="gl-how-photo" src={howPhoto} alt="" loading="lazy" />}
              <div className="gl-mock gl-mock-track">
                <div className="gl-mock-top">
                  <span className="gl-mock-logo">
                    <ShoppingBag size={18} />
                  </span>
                  <div>
                    <strong>Tu pedido</strong>
                    <small>2 platos · Domicilio</small>
                  </div>
                </div>
                <ol className="gl-steps">
                  <li className="done">
                    <Check size={14} /> Recibido por el restaurante
                  </li>
                  <li className="done">
                    <Check size={14} /> En cocina
                  </li>
                  <li className="now">
                    <Bike size={14} /> En camino
                  </li>
                  <li>
                    <MapPin size={14} /> Entregado
                  </li>
                </ol>
                <div className="gl-mock-bar">
                  <span>Pago</span>
                  <strong>Efectivo al recibir</strong>
                </div>
              </div>
              <span className="gl-bubble gl-how-bubble-a">
                <ChefHat size={16} /> El restaurante aceptó tu pedido
              </span>
              <span className="gl-bubble gl-how-bubble-b">
                <Bike size={16} /> Tu motorizado ya salió
              </span>
              <span className="gl-bubble gl-how-bubble-c">
                <Wallet size={16} /> Efectivo o transferencia
              </span>
            </div>
          </div>
        </section>

        {/* Beneficios: mosaico con el plan Plus (beneficios reales del plan), las promociones
            que publican los locales y lo que ofrece la cuenta */}
        <section className="gl-section gl-band-yellow" id="beneficios">
          <div className="gl-head">
            <p className="gl-eyebrow gl-eyebrow-dark">Beneficios</p>
            <h2>Ahorra en cada pedido.</h2>
            <p>Promociones que publican los restaurantes y un plan para no pagar envío.</p>
          </div>

          <div className="gl-bento">
            <article className="gl-bento-plus">
              <img className="gl-bento-boca" src="/brand/boca-negra.png" alt="" aria-hidden="true" />
              <span className="gl-tag">GoEats Plus</span>
              <strong className="gl-bento-big">Envío $0</strong>
              <p>En todos tus pedidos a domicilio, las veces que quieras.</p>
              <ul className="gl-bento-list">
                <li>
                  <Check size={14} /> Envíos gratis ilimitados
                </li>
                <li>
                  <Check size={14} /> Tu pedido sale primero en cocina
                </li>
                <li>
                  <Check size={14} /> El repartidor recibe un bono de $0.50
                </li>
                <li>
                  <Check size={14} /> Soporte preferencial
                </li>
              </ul>
              <div className="gl-bento-ticket" aria-hidden="true">
                <span>Envío a domicilio</span>
                <strong>$0.00</strong>
                <em>Plus</em>
              </div>
              <button className="gl-pill gl-pill-black" onClick={() => navigate("/plus")}>
                Ver el plan Plus <ArrowRight size={16} />
              </button>
            </article>

            <article className="gl-bento-promo">
              <span className="gl-tag gl-tag-light">Promociones</span>
              <strong className="gl-bento-mid">Ofertas de los locales de Loja</strong>
              {promos.length > 0 ? (
                <ul className="gl-bento-promos">
                  {promos.map((r) => (
                    <li key={r.id}>
                      <Link to={`/r/${encodeURIComponent(r.slug)}`}>
                        {safeImage(r.logo) ? (
                          <img src={safeImage(r.logo) || ""} alt="" loading="lazy" />
                        ) : (
                          <Store size={18} />
                        )}
                        <span>
                          <strong>{r.promoText}</strong>
                          <small>{r.name}</small>
                        </span>
                        <ArrowRight size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Cada restaurante publica sus promociones en su menú.</p>
              )}
              <div className="gl-bento-faces" aria-hidden="true">
                {featured.slice(0, 4).map((r) => (
                  <img key={r.id} src={safeImage(r.coverImage || r.logo) || ""} alt="" loading="lazy" />
                ))}
              </div>
              <button className="gl-pill gl-pill-white" onClick={openRestaurants}>
                Ver restaurantes
              </button>
            </article>

            <article className="gl-bento-account">
              <div className="gl-bento-account-text">
                <span className="gl-tag">Tu cuenta</span>
                <strong className="gl-bento-mid">Pide en minutos</strong>
                <ul className="gl-bento-feats">
                  <li>
                    <span>
                      <MapPin size={16} />
                    </span>
                    Guarda tus direcciones
                  </li>
                  <li>
                    <span>
                      <RotateCcw size={16} />
                    </span>
                    Repite un pedido con un toque
                  </li>
                  <li>
                    <span>
                      <Bike size={16} />
                    </span>
                    Sigue cada entrega en vivo
                  </li>
                </ul>
                <button className="gl-pill gl-pill-black" onClick={() => openRegistration("customer")}>
                  Crear mi cuenta
                </button>
              </div>
              {accountPhoto && <img className="gl-bento-photo" src={accountPhoto} alt="" loading="lazy" />}
            </article>
          </div>
        </section>

        {/* Restaurantes: foto de cocina a la izquierda con el panel real del local encima;
            texto y funciones a la derecha */}
        <section className="gl-section gl-tone-green" id="restaurantes">
          <div className="gl-split">
            <div className="gl-photo-stage">
              <div className="gl-photo">
                <ChefIllustration />
              </div>
              <div className="gl-mock gl-mock-orders gl-photo-mock" aria-hidden="true">
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
                    <span>Para retirar · 1 plato</span>
                    <em className="st-ready">Listo</em>
                  </li>
                </ul>
              </div>
            </div>

            <div className="gl-split-text">
              <p className="gl-eyebrow">Para restaurantes</p>
              <h2>Recibe pedidos sin cambiar tu cocina.</h2>
              <p className="gl-split-lead">
                Los pedidos de la web, de las mesas y para retirar llegan a una sola pantalla. La cocina los ve, la caja
                los cobra y tú ves el día en reportes.
              </p>
              <ul className="gl-feats">
                <li>
                  <span>
                    <Printer size={18} />
                  </span>
                  Comanda impresa con tu logo
                </li>
                <li>
                  <span>
                    <QrCode size={18} />
                  </span>
                  Carta con QR en cada mesa
                </li>
                <li>
                  <span>
                    <Receipt size={18} />
                  </span>
                  Caja y reportes del día
                </li>
              </ul>
              <button className="gl-pill gl-pill-black gl-pill-lg" onClick={() => openRegistration("restaurant")}>
                Registrar mi restaurante <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Repartidores: texto a la izquierda; foto de un repartidor en ruta con el pedido disponible encima */}
        <section className="gl-section gl-band-black" id="repartidores">
          <div className="gl-split is-reverse">
            <div className="gl-photo-stage">
              <div className="gl-photo">
                <RiderIllustration />
              </div>
              <div className="gl-mock gl-mock-driver gl-photo-mock" aria-hidden="true">
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

            <div className="gl-split-text">
              <p className="gl-eyebrow gl-eyebrow-yellow">Para repartidores</p>
              <h2>Reparte en Loja cuando tú quieras.</h2>
              <p className="gl-split-lead">
                Te conectas, ves los pedidos listos cerca de ti y tomas los que te sirven. Tu billetera y tus entregas
                quedan en la app.
              </p>
              <ul className="gl-feats gl-feats-red">
                <li>
                  <span>
                    <Bike size={18} />
                  </span>
                  Toma los pedidos que te sirven
                </li>
                <li>
                  <span>
                    <Wallet size={18} />
                  </span>
                  Billetera con recargas
                </li>
                <li>
                  <span>
                    <Check size={18} />
                  </span>
                  Historial de tus entregas
                </li>
              </ul>
              <button className="gl-pill gl-pill-yellow gl-pill-lg" onClick={() => openRegistration("driver")}>
                Quiero repartir <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Pie: la invitacion final y los enlaces reales del sitio en un solo bloque */}
      <footer className="gl-footer">
        <div className="gl-footer-cta">
          <h2>¿Qué se te antoja hoy?</h2>
          <button className="gl-pill gl-pill-red gl-pill-lg" onClick={openRestaurants}>
            Ver restaurantes <ArrowRight size={18} />
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
            </div>
            <div>
              <h3>GoEats</h3>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#beneficios">Beneficios</a>
              <Link to="/support">Ayuda y soporte</Link>
            </div>
          </nav>
        </div>

        {/* Firma grande de la marca */}
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
