import React, { useEffect, useState, useRef } from "react";
import { OpenBadge } from "../components/OpenBadge";
import { BrandLogo } from "../components/BrandLogo";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import {
  Star,
  Heart,
  Search,
  ChevronLeft,
  ChevronRight,
  Compass,
  Utensils,
  LogOut,
  Menu as MenuIcon,
  X as XIcon,
  Sparkles,
  SlidersHorizontal,
  User,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  Bike,
  Store,
  Shield,
  Pizza,
  Globe2,
  Flame,
  Fish,
  Coffee,
  MapPin,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FoodPreferencesModal } from "../components/FoodPreferencesModal";
import { FOOD_PREFERENCE_CATEGORIES, normalizeFoodPreferences } from "../utils/foodPreferences";
import { SupportModal } from "../components/SupportModal";
import { systemIconForEmoji } from "../utils/systemIcons";
import { useReveal } from "../utils/useReveal";
import "../styles/restaurants.css";
import "../styles/footer-bottom.css";


interface PublicRestaurant {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string;
  categories?: Array<{ id: number; name: string }>;
  subcategories?: Array<{ id: number; name: string }>;
  logo: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
  samePriceAsLocal: boolean;
  promoText: string | null;
  ordersThisWeek: number;
}

interface AugmentedRestaurant extends PublicRestaurant {
  coverImage: string;
  category: string;
  categories?: Array<{ id: number; name: string }>;
  subcategories?: Array<{ id: number; name: string }>;
  rating: string;
  reviews: string;
  deliveryTime: string;
  deliveryCost: string;
  promoText: string | null;
  ordersThisWeek: number;
  specialLabel?: string;
  isFavorite: boolean;
}

type MainCategoryId = "lojana" | "pizzerias" | "international" | "grill" | "seafood" | "desserts";
type CategoryFilter = { id: string; name: string; icon: React.ElementType };
interface SaaSCategory {
  id: number;
  name: string;
  subcategories?: Array<{ id: number; name: string }>;
}

const mainCategories: Array<{
  id: MainCategoryId;
  name: string;
  icon: React.ElementType;
  keywords: string[];
}> = [
  {
    id: "lojana",
    name: "Comida Típica y Tradicional Lojana",
    icon: Utensils,
    keywords: ["lojana", "lojano", "tradicional", "tipica", "ecuatoriana", "ecuatoriano", "cecina", "repe", "humita", "tamale", "cuy", "gallina criolla"],
  },
  {
    id: "pizzerias",
    name: "Pizzerías y Bares",
    icon: Pizza,
    keywords: ["pizza", "pizzeria", "pizzerias", "bar", "cerveza", "restobar", "gastrobar"],
  },
  {
    id: "international",
    name: "Cocina Internacional y Latinoamericana",
    icon: Globe2,
    keywords: ["internacional", "latinoamericana", "latino", "mexicana", "mexicano", "taco", "sushi", "japonesa", "japones", "china", "chifa", "italiana", "pasta", "coreana", "peruana", "saludable", "ensalada", "sandwich", "postre", "bebida", "comida rapida", "fast food"],
  },
  {
    id: "grill",
    name: "Carnes, Parrillas y Asados",
    icon: Flame,
    keywords: ["carne", "parrilla", "bbq", "asado", "hamburguesa", "burger", "pollo", "alita", "wing", "costilla", "choripan"],
  },
  {
    id: "seafood",
    name: "Marisquerías",
    icon: Fish,
    keywords: ["marisqueria", "marisco", "seafood", "pescado", "ceviche", "camaron", "concha", "pulpo"],
  },
  {
    id: "desserts",
    name: "Postres, Heladerías y Cafeterías",
    icon: Coffee,
    keywords: ["postre", "postres", "heladeria", "helado", "helados", "cafeteria", "cafe", "cafes", "pasteleria", "reposteria", "dulceria"],
  },
];

const activeCategoriesList: CategoryFilter[] = [
  { id: "all", name: "Todos", icon: Utensils },
  ...mainCategories.map(({ id, name, icon }) => ({ id: `main-${id}`, name, icon })),
];

const normalizeCategoryText = (value: string) => value
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const getMainCategoryId = (names: string[]): MainCategoryId | null => {
  const normalizedNames = names.map(normalizeCategoryText).filter(Boolean);
  const categoryPriority: MainCategoryId[] = ["lojana", "seafood", "pizzerias", "grill", "desserts", "international"];
    const categoryMatch = categoryPriority
      .map((id) => mainCategories.find((category) => category.id === id))
      .find((category) => category && normalizedNames.some((name) =>
        category.keywords.some((keyword) => name.includes(normalizeCategoryText(keyword)))
      ));
  return categoryMatch?.id ?? null;
};

const getRestaurantMainCategoryId = (restaurant: AugmentedRestaurant): MainCategoryId | null => {
  const assignedCategories = [
    ...(restaurant.categories || []).map((category) => category.name),
    ...(restaurant.subcategories || []).map((subcategory) => subcategory.name),
  ];
  return getMainCategoryId(assignedCategories)
    || getMainCategoryId([restaurant.name, restaurant.description || ""]);
};

export const Aggregator: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [restaurants, setRestaurants] = useState<AugmentedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SaaS category IDs are used by saved food preferences.
  const [allCategories, setAllCategories] = useState<SaaSCategory[]>([]);

  // Filter States
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Favorites Local State
  const [favorites, setFavorites] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Food Preferences & Recommendations State
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // User Profile Dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Horizontal Slider Refs and Navigation State for Categories
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(true);

  const checkCategoryScroll = () => {
    const el = categoriesRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollCategoriesLeft(scrollLeft > 10);
    setCanScrollCategoriesRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkCategoryScroll();
    const el = categoriesRef.current;
    if (el) {
      el.addEventListener("scroll", checkCategoryScroll, { passive: true });
      window.addEventListener("resize", checkCategoryScroll);
      return () => {
        el.removeEventListener("scroll", checkCategoryScroll);
        window.removeEventListener("resize", checkCategoryScroll);
      };
    }
  }, []);

  const scrollCategories = (direction: "left" | "right") => {
    const el = categoriesRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.65, 260);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  // Horizontal Slider Refs for Popular & Offers Carousels
  const popularRef = useRef<HTMLDivElement>(null);
  const scrollPopular = (direction: "left" | "right") => {
    if (!popularRef.current) return;
    const scrollAmount = Math.max(popularRef.current.clientWidth * 0.7, 340);
    popularRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  const offersRef = useRef<HTMLDivElement>(null);
  const scrollOffers = (direction: "left" | "right") => {
    if (!offersRef.current) return;
    const scrollAmount = Math.max(offersRef.current.clientWidth * 0.7, 340);
    offersRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "CUSTOMER": return "Cliente";
      case "MOTORIZADO": return "Repartidor";
      case "RESTAURANT_OWNER": return "Restaurante";
      case "CAJERO": return "Cajero";
      case "MOZO": return "Mozo";
      case "PRODUCCION": return "Cocina";
      case "SUPER_ADMIN": return "Super Admin";
      default: return role || "Usuario";
    }
  };

  const BRAND_LOGOS: Record<string, string> = {
    "el-artesanal": "/logos/el-artesanal.svg",
    "pollo-dorado": "/logos/pollo-dorado.svg",
    "brasa-burger": "/logos/brasa-burger.svg",
    "la-granja": "/logos/la-granja.svg",
    "burger-costena": "/logos/burger-costena.svg",
    "la-nonna": "/logos/la-nonna.svg",
    "sushi-tokyo": "/logos/sushi-tokyo.svg",
    "salad-green": "/logos/salad-green.svg",
    "tacos-mx": "/logos/tacos-mx.svg",
    "sweet-bakery": "/logos/sweet-bakery.svg",
    "arroz-relleno": "/logos/arroz-relleno.svg",
    "el-gaucho": "/logos/el-gaucho.svg",
    "el-sabroson": "/logos/el-sabroson.svg",
    "prueba": "/logos/prueba.svg",
    "makushi": "/logos/maku-sushi.svg",
    "maku-sushi": "/logos/maku-sushi.svg",
  };

  const BRAND_COVERS: Record<string, string> = {
    "el-artesanal": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    "pollo-dorado": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
    "brasa-burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    "la-granja": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&auto=format&fit=crop&q=80",
    "burger-costena": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    "la-nonna": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    "sushi-tokyo": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    "salad-green": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
    "tacos-mx": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop&q=80",
    "sweet-bakery": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    "arroz-relleno": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80",
    "el-gaucho": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    "el-sabroson": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
    "prueba": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    "makushi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
    "maku-sushi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
  };

  const getAugmentedRestaurants = (dbList: PublicRestaurant[]): AugmentedRestaurant[] => {
    const defaultCovers = [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=600&auto=format&fit=crop&q=80",
    ];

    const augmentedDb = dbList.map((rest, index) => {
      const finalLogo = BRAND_LOGOS[rest.slug] || rest.logo || "/logos/prueba.svg";
      const finalCover = BRAND_COVERS[rest.slug] || rest.coverImage || defaultCovers[index % defaultCovers.length];

      return {
        ...rest,
        logo: finalLogo,
        coverImage: finalCover,
        category: rest.categories?.[0]?.name || "Restaurante local",
        categories: rest.categories || [],
        subcategories: rest.subcategories || [],
        rating: (4.5 + (index * 0.08) % 0.4).toFixed(1),
        reviews: `(${500 + (index * 680) % 8000}+)`,
        deliveryTime: `${15 + (index * 4) % 18} min`,
        deliveryCost: index % 2 === 0 ? "Envío gratis" : "Costo de envío: $1.25",
        promoText: rest.promoText || null,
        ordersThisWeek: rest.ordersThisWeek || 0,
        isFavorite: false
      };
    });

    return augmentedDb;
  };

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const catRes = await apiRequest("/saas-categories");
        if (catRes.success) {
          setAllCategories(catRes.categories || []);
        }

        const res = await apiRequest("/restaurants/public/list");
        const list = res.restaurants || [];
        setRestaurants(getAugmentedRestaurants(list));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar restaurantes");
      } finally {
        setLoading(false);
      }
    }
    loadRestaurants();
  }, []);

  // Sync Food Preferences from user profile, localStorage, or setup query parameter
  useEffect(() => {
    if (user && (user as any).preferences && Array.isArray((user as any).preferences)) {
      setUserPreferences(normalizeFoodPreferences((user as any).preferences));
    } else {
      try {
        const stored = localStorage.getItem("goeats_food_preferences");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setUserPreferences(normalizeFoodPreferences(parsed));
        }
      } catch (e) {}
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("setup_preferences") === "true") {
      setPreferencesModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  // Sync favorites with active user session
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      try {
        const stored = localStorage.getItem(`goeats_favorites_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
            return;
          }
        }
      } catch (e) {}
    }
    setFavorites([]);
  }, [isAuthenticated, user?.id]);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      if (user?.id) {
        try {
          localStorage.setItem(`goeats_favorites_${user.id}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const matchesCategory = (rest: AugmentedRestaurant, selectedId: string) => {
    if (selectedId === "all") return true;
    if (selectedId.startsWith("main-")) {
      const mainCategoryId = selectedId.replace("main-", "") as MainCategoryId;
      return getRestaurantMainCategoryId(rest) === mainCategoryId;
    }
    if (mainCategories.some((category) => category.id === selectedId)) {
      return getRestaurantMainCategoryId(rest) === selectedId;
    }
    if (selectedId.startsWith("cat-")) {
      const catId = parseInt(selectedId.replace("cat-", ""), 10);
      return rest.categories?.some((category) => category.id === catId) || false;
    }
    if (selectedId.startsWith("sub-")) {
      const subId = parseInt(selectedId.replace("sub-", ""), 10);
      return rest.subcategories?.some((subcategory) => subcategory.id === subId) || false;
    }
    const category = allCategories.find((item) => item.id === Number(selectedId));
    return category
      ? rest.categories?.some((restaurantCategory) => restaurantCategory.id === category.id) || false
      : true;
  };

  const selectedMainCategory = mainCategories.find((category) => activeCategory === `main-${category.id}`);
  const availableSubcategories = selectedMainCategory
    ? Array.from(new Map(
      restaurants
        .filter((restaurant) => matchesCategory(restaurant, activeCategory))
        .flatMap((restaurant) => [
          ...(restaurant.categories || []).map((category) => ({ id: `cat-${category.id}`, name: category.name })),
          ...(restaurant.subcategories || []).map((subcategory) => ({ id: `sub-${subcategory.id}`, name: subcategory.name })),
        ])
        .map((subcategory) => [subcategory.id, subcategory])
    ).values())
    : [];

  // Filter & Sort Logic
  const filteredRestaurants = restaurants.filter(rest => {
    if (!matchesCategory(rest, activeCategory)) return false;
    if (activeSubcategory && !matchesCategory(rest, activeSubcategory)) return false;

    if (searchQuery.trim() &&
        !rest.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !rest.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !rest.categories?.some((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !rest.subcategories?.some((subcategory) => subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    return true;
  });

  // Subdivided categories for UI Sections
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 30);
  const newRestaurants = filteredRestaurants
    .filter((restaurant) => new Date(restaurant.createdAt) >= recentCutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const weeklyTopRestaurants = [...filteredRestaurants]
    .filter((restaurant) => restaurant.ordersThisWeek > 0)
    .sort((a, b) => b.ordersThisWeek - a.ordersThisWeek);
  const offerRestaurants = filteredRestaurants.filter(r => r.promoText !== null);
  const samePriceRestaurants = filteredRestaurants.filter((restaurant) => restaurant.samePriceAsLocal);

  // Smart Recommendations based on culinary preferences
  const recommendedRestaurants = restaurants.filter(rest => {
    if (userPreferences.length === 0) return false;
    return userPreferences.some(prefId => matchesCategory(rest, prefId));
  });

  // Para la caja de invitacion cuando aun no hay gustos elegidos
  const topRatedRestaurants = [...restaurants]
    .sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
    .slice(0, 8);

  const FALLBACK_COVER = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";

  // Encabezado de seccion: titulo de marca y, si hay carrusel, flechas
  const renderSectionHead = (title: string, onScroll?: (direction: "left" | "right") => void) => (
    <div className="gx-head">
      <h2 className="brand-marker gx-title">{title}</h2>
      {onScroll && (
        <div className="gx-arrows">
          <button type="button" className="gx-arrow" onClick={() => onScroll("left")} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="gx-arrow" onClick={() => onScroll("right")} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );

  // Tarjeta unica de restaurante para todas las secciones
  const renderCard = (
    rest: AugmentedRestaurant,
    opts: {
      keyPrefix: string;
      slide?: boolean;
      badge?: { text: string; tone: "yellow" | "red" | "black"; icon?: boolean };
      stat?: React.ReactNode;
      meta: string[];
      showLogo?: boolean;
    }
  ) => {
    const isFav = favorites.includes(rest.id);
    return (
      <Link
        to={`/r/${rest.slug}`}
        key={`${opts.keyPrefix}-${rest.id}`}
        className={`gx-card${opts.slide ? " gx-card--slide" : ""}`}
      >
        <div className="gx-media">
          <img
            src={rest.coverImage}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
          />
          {opts.badge && (
            <span className={`gx-badge gx-badge--${opts.badge.tone}`}>
              {opts.badge.icon && <Sparkles size={12} />}
              {opts.badge.text}
            </span>
          )}
          {isAuthenticated && (
            <button
              type="button"
              className={`gx-fav${isFav ? " is-on" : ""}`}
              onClick={(e) => toggleFavorite(rest.id, e)}
              aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <div className="gx-body">
          {opts.showLogo && (
            <span className="gx-logo">
              {rest.logo ? (
                <img src={rest.logo} alt="" onError={(e) => { e.currentTarget.src = "/logos/prueba.svg"; }} />
              ) : (
                rest.name[0]?.toUpperCase()
              )}
            </span>
          )}
          <div className="gx-text">
            <div className="gx-name-row">
              <h3 className="gx-name">{rest.name}</h3>
              {opts.stat ?? (
                <span className="gx-stat">
                  <Star size={12} fill="currentColor" />
                  {rest.rating}
                </span>
              )}
            </div>
            <p className="gx-meta">{opts.meta.filter(Boolean).join(" • ")}</p>
            <div className="gx-tags">
              <OpenBadge hours={(rest as any).openingHours} />
              {rest.specialLabel && <span className="gx-tag">{rest.specialLabel}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const renderRestaurantSection = (
    title: string,
    sectionRestaurants: AugmentedRestaurant[],
    keyPrefix: string,
    badge: string,
    band: "white" | "peach" | "orange" | "blush" = "white"
  ) => (
    <section aria-label={title} className={`gx-band gx-band--${band}`} data-reveal>
      {renderSectionHead(title)}
      <div className="no-scrollbar gx-grid gx-grid--rail">
        {sectionRestaurants.map((restaurant) => renderCard(restaurant, {
          keyPrefix,
          badge: { text: badge, tone: "yellow" },
          meta: [restaurant.category, restaurant.deliveryTime],
        }))}
      </div>
    </section>
  );

  // Las secciones aparecen al bajar, como en la landing; se vuelven a buscar al cambiar la lista
  const bodyRef = useRef<HTMLDivElement>(null);
  useReveal(bodyRef, `${loading}-${filteredRestaurants.length}-${activeCategory}-${searchQuery}-${userPreferences.length}`);

  return (
    <div className="rx-page" style={{ minHeight: "100vh" }}>
      
      {/* Stick Header Navigation style UberEats */}
      <nav className="aggregator-navbar" style={{
        position: "sticky",
        top: 0,
        backgroundColor: "color-mix(in srgb, var(--brand-cream-soft) 88%, transparent)",
        backdropFilter: "saturate(1.4) blur(14px)",
        WebkitBackdropFilter: "saturate(1.4) blur(14px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        zIndex: 1000,
        // Mismo ancho que el contenido (1200px), asi logo y botones quedan alineados con las secciones
        padding: "12px max(20px, calc((100% - 1200px) / 2))",
        gap: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "28px", flex: 1, minWidth: 0 }} className="aggregator-left-wrapper">
          <BrandLogo size={30} onClick={() => navigate("/restaurants")} />

          {/* Search bar inside header */}
          <div className="aggregator-search-bar" style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "var(--brand-white)",
            boxShadow: "0 1px 2px rgba(40, 25, 5, 0.06), 0 4px 14px rgba(40, 25, 5, 0.06)",
            padding: "0 18px",
            height: "46px",
            borderRadius: "999px",
            flex: 1,
            maxWidth: "480px",
            position: "relative"
          }}>
            <Search size={16} style={{ color: "#d42518", marginRight: "10px" }} />
            <input
              type="text"
              placeholder="Buscar comida, restaurante o antojo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                fontSize: "14px",
                color: "#000000",
                border: "none",
                backgroundColor: "transparent",
                outline: "none"
              }}
            />
          </div>
        </div>

        <div className="mobile-hide" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            to="/plus"
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: user?.isPlus ? "#ffca26" : "#000000",
              padding: "8px 16px",
              borderRadius: "30px",
              backgroundColor: user?.isPlus ? "#000000" : "#ffca26",
              border: "none",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <Sparkles size={14} color={user?.isPlus ? "#ffca26" : "#000000"} />
            {user?.isPlus ? "Miembro Plus" : "Hazte Plus"}
          </Link>

          {isAuthenticated && user ? (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              {/* User Profile Pill Trigger */}
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "5px 14px 5px 6px",
                  borderRadius: "30px",
                  backgroundColor: userDropdownOpen ? "#fdf8ee" : "#ffffff",
                  border: "1px solid #f3e8cc",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f3e8cc")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f3e8cc")}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #000000 0%, #333333 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.18)"
                  }}
                >
                  {getInitials(user.name)}
                </div>

                <div style={{ textAlign: "left", lineHeight: 1.25 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#000000",
                      maxWidth: "130px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {user.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#737373" }}>
                    {getRoleLabel(user.role)}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  color="#737373"
                  style={{
                    transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease"
                  }}
                />
              </button>

              {/* User Dropdown Menu Card */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "260px",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #f3e8cc",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {/* User Profile Header */}
                  <div style={{ padding: "16px", backgroundColor: "#fdf8ee", borderBottom: "1px solid #f3e8cc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #000000 0%, #333333 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "700",
                          flexShrink: 0
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#000000",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#737373",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {user.email || user.username}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: "600",
                          backgroundColor: "#fdf8ee",
                          color: "#000000",
                          border: "1px solid #bfdbfe"
                        }}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                      {user.isPlus && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: "600",
                            backgroundColor: "#f7f0de",
                            color: "#000000",
                            border: "1px solid #fde68a"
                          }}
                        >
                          Socio Plus
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  <div style={{ padding: "8px" }}>
                    {user.role === "CUSTOMER" && (
                      <>
                        <Link
                          to="/customer/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#000000",
                            textDecoration: "none",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <ShoppingBag size={16} color="#000000" />
                          <span>Mis Pedidos</span>
                        </Link>

                        <Link
                          to="/customer/dashboard?tab=profile"
                          onClick={() => setUserDropdownOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#000000",
                            textDecoration: "none",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <User size={16} color="#737373" />
                          <span>Mi Perfil</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setPreferencesModalOpen(true);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#000000",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Sparkles size={16} color="#000000" />
                            <span>Mis Preferencias</span>
                          </div>
                          {userPreferences.length > 0 && (
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: "700",
                                backgroundColor: "#f7f0de",
                                color: "#000000",
                                padding: "2px 8px",
                                borderRadius: "10px"
                              }}
                            >
                              {userPreferences.length}
                            </span>
                          )}
                        </button>
                      </>
                    )}

                    {user.role === "MOTORIZADO" && (
                      <Link
                        to="/delivery"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#000000",
                          textDecoration: "none",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Bike size={16} color="#1e8f4e" />
                        <span>Panel de Repartos</span>
                      </Link>
                    )}

                    {(user.role === "RESTAURANT_OWNER" || user.role === "CAJERO" || user.role === "MOZO" || user.role === "PRODUCCION") && (
                      <Link
                        to="/pos"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#000000",
                          textDecoration: "none",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Store size={16} color="#333333" />
                        <span>Caja y comandas</span>
                      </Link>
                    )}

                    {user.role === "SUPER_ADMIN" && (
                      <Link
                        to="/admin/restaurants"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#000000",
                          textDecoration: "none",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Shield size={16} color="#000000" />
                        <span>Panel Super Admin</span>
                      </Link>
                    )}

                    <div style={{ height: "1px", backgroundColor: "#f7f0de", margin: "6px 0" }} />

                    {/* Centro de Ayuda */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setSupportModalOpen(true);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#000000",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f0de")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <HelpCircle size={16} color="#000000" />
                      <span>Ayuda y Soporte</span>
                    </button>

                    <div style={{ height: "1px", backgroundColor: "#f7f0de", margin: "6px 0" }} />

                    {/* Cerrar Sesion */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#d42518",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fbe9e8")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <LogOut size={16} color="#d42518" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setSupportModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "30px",
                  backgroundColor: "transparent",
                  border: "1px solid #f3e8cc",
                  color: "#595959",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                title="Centro de Ayuda & Soporte"
              >
                <HelpCircle size={14} />
                Ayuda
              </button>

              <Link to="/login" style={{
                fontSize: "13px",
                fontWeight: "600",
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: "8px 20px",
                borderRadius: "30px",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}>
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-show aggregator-navbar-toggle-btn"
          style={{
            cursor: "pointer",
            color: "var(--text-primary)",
            padding: "8px",
            background: "none",
            border: "none"
          }}
        >
          {menuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>

        {/* Mobile Drawer Dropdown */}
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #f3e8cc",
              padding: "20px 30px",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                to="/plus"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#000000",
                  padding: "12px 16px",
                  borderRadius: "30px",
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                  border: "1px solid #333333",
                  textDecoration: "none"
                }}
              >
                Hazte Plus
              </Link>

              <button
                onClick={() => { setMenuOpen(false); setPreferencesModalOpen(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  padding: "12px 16px",
                  borderRadius: "30px",
                  backgroundColor: "rgba(0, 0, 0, 0.08)",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                  cursor: "pointer"
                }}
              >
                <Sparkles size={15} />
                {userPreferences.length > 0 ? `Mis Preferencias (${userPreferences.length})` : "Configurar Preferencias"}
              </button>

              {isAuthenticated && user ? (
                <>
                  {user.role === "CUSTOMER" && (
                    <>
                      <Link
                        to="/customer/dashboard"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          fontSize: "14px",
                          fontWeight: 600,
                          padding: "12px 16px",
                          borderRadius: "30px",
                          color: "#000000",
                          backgroundColor: "rgba(0, 0, 0, 0.05)",
                          border: "1px solid rgba(0, 0, 0, 0.15)",
                          textDecoration: "none"
                        }}
                      >
                        Mis Pedidos
                      </Link>

                      <Link
                        to="/customer/dashboard?tab=profile"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          fontSize: "14px",
                          fontWeight: 600,
                          padding: "12px 16px",
                          borderRadius: "30px",
                          color: "#000000",
                          backgroundColor: "#fdf8ee",
                          border: "1px solid #f3e8cc",
                          textDecoration: "none"
                        }}
                      >
                        <User size={16} color="#000000" />
                        Mi Perfil e Información
                      </Link>
                    </>
                  )}

                  {user.role === "MOTORIZADO" && (
                    <Link
                      to="/delivery"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 16px",
                        borderRadius: "30px",
                        color: "#000000",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(0, 0, 0, 0.15)",
                        textDecoration: "none"
                      }}
                    >
                      Entregas
                    </Link>
                  )}

                  {(user.role === "RESTAURANT_OWNER" || user.role === "CAJERO" || user.role === "MOZO" || user.role === "PRODUCCION") && (
                    <Link
                      to="/pos"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 16px",
                        borderRadius: "30px",
                        color: "#000000",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(0, 0, 0, 0.15)",
                        textDecoration: "none"
                      }}
                    >
                      Ir al POS {systemIconForEmoji("🖥️")}
                    </Link>
                  )}

                  {user.role === "SUPER_ADMIN" && (
                    <Link
                      to="/admin/restaurants"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 600,
                        padding: "12px 16px",
                        borderRadius: "30px",
                        color: "#000000",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(0, 0, 0, 0.15)",
                        textDecoration: "none"
                      }}
                    >
                      Panel Admin {systemIconForEmoji("🛡️")}
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "600",
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    padding: "12px 16px",
                    borderRadius: "30px",
                    textDecoration: "none",
                    textAlign: "center"
                  }}
                >
                  Iniciar Sesión
                </Link>
              )}

              <button
                onClick={() => { setMenuOpen(false); setSupportModalOpen(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  padding: "12px 16px",
                  borderRadius: "30px",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  border: "1px solid rgba(0, 0, 0, 0.15)",
                  cursor: "pointer"
                }}
              >
                <HelpCircle size={16} />
                Centro de Ayuda & Soporte
              </button>
            </div>


            {isAuthenticated && user && (
              <div style={{
                borderTop: "1px solid #f3e8cc",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: "13px", color: "#737373" }}>{user.role}</div>
                </div>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 16px",
                    borderRadius: "30px",
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                    color: "#000000",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600
                  }}
                >
                  <LogOut size={14} style={{ marginRight: "4px" }} />
                  Salir
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main Aggregator Body */}
      <div id="goeats-restaurants" ref={bodyRef} style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px", scrollMarginTop: "90px" }}>

        {/* Banner de bienvenida con el amarillo de marca */}
        {!searchQuery.trim() && activeCategory === "all" && (
          <div className="brand-hero-band">
            <div style={{ minWidth: 0 }}>
              <p className="brand-hero-eyebrow">GoEats Loja</p>
              <p className="brand-hero-title brand-accent-text">
                {isAuthenticated && user?.name ? `¡Hola, ${user.name.split(" ")[0]}! ` : ""}¿Qué se te antoja{" "}
                <span className="ge-mark">hoy?</span>
              </p>
              <p className="brand-hero-text">Sabores locales, desde la cocina hasta tu puerta.</p>
            </div>
            {/* Sello amarillo con la boca, como el del inicio */}
            <span className="rx-hero-seal" aria-hidden="true">
              <img src="/brand/boca-negra.png" alt="" className="brand-hero-mouth" />
            </span>
          </div>
        )}

        {/* Barra de categorias con flechas */}
        <div className="cat-bar">
          {canScrollCategoriesLeft && (
            <button
              type="button"
              className="gx-arrow cat-nav cat-nav--left"
              onClick={() => scrollCategories("left")}
              aria-label="Ver categorías anteriores"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
          )}

          <div
            ref={categoriesRef}
            className="no-scrollbar cat-track"
            onWheel={(e) => {
              if (e.deltaY !== 0 && categoriesRef.current) {
                categoriesRef.current.scrollLeft += e.deltaY * 0.7;
              }
            }}
          >
            {activeCategoriesList.map((cat) => {
              const CategoryIcon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isSelected}
                  className={`cat-chip${isSelected ? " is-on" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveSubcategory(null);
                  }}
                >
                  <span className="cat-ico">
                    <CategoryIcon size={26} strokeWidth={1.8} />
                  </span>
                  <span className="cat-name">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {canScrollCategoriesRight && (
            <button
              type="button"
              className="gx-arrow cat-nav cat-nav--right"
              onClick={() => scrollCategories("right")}
              aria-label="Ver más categorías"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {selectedMainCategory && availableSubcategories.length > 0 && (
          <div
            aria-label={`Subcategorías de ${selectedMainCategory.name}`}
            className="sub-bar"
          >
            <button
              type="button"
              className={`sub-chip${activeSubcategory === null ? " is-on" : ""}`}
              onClick={() => setActiveSubcategory(null)}
              aria-pressed={activeSubcategory === null}
            >
              Todas
            </button>
            {availableSubcategories.map((subcategory) => {
              const isSelected = activeSubcategory === subcategory.id;
              return (
                <button
                  key={subcategory.id}
                  type="button"
                  className={`sub-chip${isSelected ? " is-on" : ""}`}
                  onClick={() => setActiveSubcategory(isSelected ? null : subcategory.id)}
                  aria-pressed={isSelected}
                >
                  {subcategory.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="gx-grid" style={{ marginTop: "20px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="gx-skel">
                <div className="skeleton" style={{ width: "100%", height: "170px", borderRadius: "22px" }} />
                <div className="skeleton" style={{ width: "60%", height: "18px", borderRadius: "999px" }} />
                <div className="skeleton" style={{ width: "40%", height: "14px", borderRadius: "999px" }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="gx-state">
            <p data-testid="marketplace-error" className="gx-state-text">{error}</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="gx-state">
            <span className="gx-state-ico"><Compass size={30} /></span>
            <h3 className="gx-state-title">No encontramos restaurantes</h3>
            <p className="gx-state-text">Prueba con otra categoría o busca otra palabra.</p>
          </div>
        ) : (
          <div className="gx-sections">
            
            {/* SECTION 0: Recomendados para ti (Sistema de Preferencias Gastronómicas) */}
            {activeCategory === "all" && !searchQuery && (
              userPreferences.length > 0 && recommendedRestaurants.length > 0 ? (
                <section className="rec-box" data-reveal>
                  <div className="rec-head">
                    <div style={{ minWidth: 0 }}>
                      <div className="rec-eyebrow">
                        <Sparkles size={14} /> Hecho para ti
                      </div>
                      <h2 className="rec-title">Recomendados según tus gustos</h2>
                      <div className="rec-chips">
                        {userPreferences.map((prefId) => {
                          const cat = FOOD_PREFERENCE_CATEGORIES.find(c => c.id === prefId);
                          if (!cat) return null;
                          const CategoryIcon = cat.icon;
                          return (
                            <span key={prefId} className="rec-chip">
                              <CategoryIcon size={14} /> {cat.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button type="button" className="rec-change" onClick={() => setPreferencesModalOpen(true)}>
                      <SlidersHorizontal size={15} />
                      Cambiar gustos
                    </button>
                  </div>

                  <div className="no-scrollbar gx-scroll">
                    {recommendedRestaurants.map((rest) => renderCard(rest, {
                      keyPrefix: "rec",
                      slide: true,
                      badge: { text: "Recomendado", tone: "yellow", icon: true },
                      meta: [rest.category, rest.deliveryTime, rest.deliveryCost],
                    }))}
                  </div>
                </section>
              ) : (
                /* Sin gustos (o sin sesion): invitacion amarilla con los mejor calificados */
                <section className="rec-box" data-reveal>
                  <div className="rec-head">
                    <div style={{ minWidth: 0 }}>
                      <div className="rec-eyebrow">
                        <Sparkles size={14} /> Hecho para ti
                      </div>
                      <h2 className="rec-title">Cuéntanos qué se te antoja</h2>
                      <p className="rec-lead">Elige tus comidas favoritas y te mostramos primero los restaurantes que van contigo.</p>
                      <div className="rec-chips">
                        {FOOD_PREFERENCE_CATEGORIES.map((cat) => {
                          const CategoryIcon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className="rec-chip rec-chip--btn"
                              onClick={() => setPreferencesModalOpen(true)}
                            >
                              <CategoryIcon size={14} /> {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button type="button" className="rec-change" onClick={() => setPreferencesModalOpen(true)}>
                      <SlidersHorizontal size={15} />
                      Elegir mis gustos
                    </button>
                  </div>

                  {topRatedRestaurants.length > 0 && (
                    <>
                      <p className="rec-sub">Mientras tanto, los mejor calificados</p>
                      <div className="no-scrollbar gx-scroll">
                        {topRatedRestaurants.map((rest) => renderCard(rest, {
                          keyPrefix: "top",
                          slide: true,
                          badge: { text: "Mejor calificado", tone: "black" },
                          meta: [rest.category, rest.deliveryTime, rest.deliveryCost],
                        }))}
                      </div>
                    </>
                  )}
                </section>
              )
            )}

            {activeCategory === "all" && !searchQuery && newRestaurants.length > 0 &&
              renderRestaurantSection("Nuevos restaurantes", newRestaurants, "new", "Nuevo en GoEats")}

            {/* SECTION 1: Most ordered this week */}
            {activeCategory === "all" && !searchQuery && filteredRestaurants.length > 0 && (
              <section className="gx-band gx-band--blush" data-reveal>
                {renderSectionHead("Lo más pedido esta semana", weeklyTopRestaurants.length > 0 ? scrollPopular : undefined)}
                {weeklyTopRestaurants.length > 0 ? (
                  <div ref={popularRef} className="no-scrollbar gx-scroll">
                    {weeklyTopRestaurants.map((rest, index) => renderCard(rest, {
                      keyPrefix: "weekly",
                      slide: true,
                      badge: index < 3 ? { text: `#${index + 1} de la semana`, tone: "black" } : undefined,
                      stat: <span className="gx-stat">{rest.ordersThisWeek} pedidos</span>,
                      meta: [rest.category, rest.deliveryTime],
                      showLogo: true,
                    }))}
                  </div>
                ) : (
                  <div className="gx-soon">
                    <img src="/brand/boca-roja.png" alt="" className="gx-soon-mouth" />
                    <div style={{ minWidth: 0 }}>
                      <span className="gx-soon-eyebrow">Muy pronto</span>
                      <p className="gx-soon-title">Aquí verás lo que Loja más pide</p>
                      <p className="gx-soon-text">
                        Cada semana armamos el top con los restaurantes que más pedidos reciben.
                        Haz tu pedido y ayuda a tu favorito a llegar al #1.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeCategory === "all" && !searchQuery && samePriceRestaurants.length > 0 &&
              renderRestaurantSection("Mismo precio que en el local", samePriceRestaurants, "same-price", "Precio del local", "peach")}

            {/* SECTION 2: Restaurant offers */}
            {activeCategory === "all" && !searchQuery && offerRestaurants.length > 0 && (
              <section id="popular-offers" className="gx-band gx-band--orange" data-reveal>
                {renderSectionHead("Ofertas de restaurantes", scrollOffers)}
                <div ref={offersRef} className="no-scrollbar gx-scroll">
                  {offerRestaurants.map((rest) => renderCard(rest, {
                    keyPrefix: "offer",
                    slide: true,
                    badge: rest.promoText ? { text: rest.promoText, tone: "red" } : undefined,
                    meta: [rest.reviews, rest.deliveryTime, rest.deliveryCost],
                    showLogo: true,
                  }))}
                </div>
              </section>
            )}

            {/* SECTION 3: Grid General de Opciones */}
            <section className="gx-band gx-band--white" data-reveal>
              {renderSectionHead(activeCategory === "all" && !searchQuery ? "Todos los restaurantes" : "Resultados de búsqueda")}
              <div className="gx-grid">
                {filteredRestaurants.map((rest) => renderCard(rest, {
                  keyPrefix: "grid",
                  badge: rest.promoText ? { text: rest.promoText, tone: "red" } : undefined,
                  meta: [rest.category, rest.deliveryTime, rest.deliveryCost],
                  showLogo: true,
                }))}
              </div>
            </section>

          </div>
        )}

      </div>

      {/* Pie con la marca, igual de estilo que el de la landing */}
      <footer className="rx-footer">
        <div className="rx-footer-inner">
          <div className="rx-footer-top">
            <div className="rx-footer-brand">
              <BrandLogo size={30} />
              <p>Comida de los restaurantes de Loja, a domicilio o para retirar en el local.</p>
              <span className="rx-footer-chip">
                <MapPin size={14} /> Loja, Ecuador
              </span>
            </div>

            <nav className="rx-footer-cols" aria-label="Enlaces del sitio">
              <div>
                <h3>Para clientes</h3>
                <button type="button" onClick={() => setPreferencesModalOpen(true)}>Cambiar mis gustos</button>
                <Link to="/plus">GoEats Plus</Link>
                {!isAuthenticated && <Link to="/login?role=customer&mode=register">Crear mi cuenta</Link>}
                {!isAuthenticated && <Link to="/login">Iniciar sesión</Link>}
              </div>
              <div>
                <h3>Para negocios</h3>
                <Link to="/login?role=restaurant&mode=register">Registrar mi restaurante</Link>
                <Link to="/login?role=driver&mode=register">Quiero repartir</Link>
                <Link to="/login">Panel del restaurante</Link>
              </div>
              <div>
                <h3>GoEats</h3>
                <Link to="/">Cómo funciona</Link>
                <button type="button" onClick={() => setSupportModalOpen(true)}>Ayuda y soporte</button>
              </div>
            </nav>
          </div>

          <div className="rx-footer-bottom">
            <p>
              © {new Date().getFullYear()} GoEats · Hecho en Loja con
              <img src="/brand/boca-roja.png" alt="cariño" />
            </p>
            <button type="button" className="rx-footer-up" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Volver arriba <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </footer>

      {/* Culinary Preferences Modal */}
      <FoodPreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        onPreferencesUpdated={(newPrefs) => setUserPreferences(newPrefs)}
      />

      {/* Support & Help Center Modal */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultRole={
          user?.role === "MOTORIZADO" 
            ? "MOTORIZADO" 
            : (user?.role === "RESTAURANT_OWNER" || user?.role === "CAJERO" || user?.role === "MOZO" || user?.role === "PRODUCCION")
              ? "RESTAURANT" 
              : "CUSTOMER"
        }
      />
    </div>
  );
};
