import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FoodPreferencesModal } from "../components/FoodPreferencesModal";
import { FOOD_PREFERENCE_CATEGORIES, normalizeFoodPreferences } from "../utils/foodPreferences";
import { SupportModal } from "../components/SupportModal";
import { systemIconForEmoji } from "../utils/systemIcons";


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
    "kfc": "/logos/kfc.svg",
    "burger-king": "/logos/burger-king.svg",
    "pollo-campero": "/logos/pollo-campero.svg",
    "tropiburger": "/logos/tropiburger.svg",
    "papa-johns": "/logos/papa-johns.svg",
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
    "kfc": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
    "burger-king": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    "pollo-campero": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&auto=format&fit=crop&q=80",
    "tropiburger": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
    "papa-johns": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
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

  const renderRestaurantSection = (
    title: string,
    sectionRestaurants: AugmentedRestaurant[],
    keyPrefix: string,
    badge: string
  ) => (
    <section aria-label={title}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#202124", margin: "0 0 18px" }}>
        {title}
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
        gap: "18px",
      }}>
        {sectionRestaurants.map((restaurant) => (
          <Link
            to={`/r/${restaurant.slug}`}
            key={`${keyPrefix}-${restaurant.id}`}
            style={{
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              color: "inherit",
              textDecoration: "none",
              background: "#fff",
            }}
          >
            <div style={{ position: "relative", height: "150px", background: "#f1f3f4" }}>
              <img
                src={restaurant.coverImage}
                alt={restaurant.name}
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                padding: "5px 9px",
                borderRadius: "999px",
                background: "#fff",
                color: "#202124",
                fontSize: "11px",
                fontWeight: 700,
              }}>
                {badge}
              </span>
              {isAuthenticated && (
                <button
                  type="button"
                  aria-label={favorites.includes(restaurant.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                  onClick={(e) => toggleFavorite(restaurant.id, e)}
                  style={{
                    position: "absolute",
                    top: "9px",
                    right: "9px",
                    display: "grid",
                    width: "34px",
                    height: "34px",
                    placeItems: "center",
                    border: 0,
                    borderRadius: "50%",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <Heart size={16} fill={favorites.includes(restaurant.id) ? "#111111" : "none"} />
                </button>
              )}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <h3 style={{
                margin: 0,
                overflow: "hidden",
                color: "#202124",
                fontSize: "15px",
                fontWeight: 700,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {restaurant.name}
              </h3>
              <p style={{ margin: "5px 0 0", color: "#5f6368", fontSize: "12px" }}>
                {restaurant.category}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", paddingBottom: "60px" }}>
      
      {/* Stick Header Navigation style UberEats */}
      <nav className="aggregator-navbar" style={{
        position: "sticky",
        top: 0,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        zIndex: 1000,
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "25px", flex: 1 }} className="aggregator-left-wrapper">
          <h1 style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#111111",
            letterSpacing: "-0.5px",
            margin: 0,
            cursor: "pointer"
          }} onClick={() => navigate("/restaurants")}>
            Go<span style={{ color: "#2f3542" }}>Eats</span>
          </h1>

          {/* Search bar inside header */}
          <div className="aggregator-search-bar" style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#f1f3f4",
            padding: "8px 15px",
            borderRadius: "30px",
            width: "350px",
            position: "relative"
          }}>
            <Search size={16} style={{ color: "#5f6368", marginRight: "10px" }} />
            <input
              type="text"
              placeholder="Buscar comida, restaurante o antojo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                fontSize: "13px",
                color: "#202124",
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
              color: user?.isPlus ? "#111111" : "#111111",
              padding: "8px 16px",
              borderRadius: "30px",
              backgroundColor: user?.isPlus ? "#eeeeee" : "rgba(0, 0, 0, 0.06)",
              border: "1px solid #333333",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <Sparkles size={14} color="#111111" />
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
                  backgroundColor: userDropdownOpen ? "#f8fafc" : "#ffffff",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #111111 0%, #333333 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
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
                      color: "#0f172a",
                      maxWidth: "130px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {user.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {getRoleLabel(user.role)}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  color="#64748b"
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
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {/* User Profile Header */}
                  <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #111111 0%, #333333 100%)",
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
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
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
                          fontSize: "11px",
                          fontWeight: "600",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
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
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: "#eeeeee",
                            color: "#111111",
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
                            color: "#1e293b",
                            textDecoration: "none",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <ShoppingBag size={16} color="#111111" />
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
                            color: "#1e293b",
                            textDecoration: "none",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <User size={16} color="#64748b" />
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
                            color: "#1e293b",
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.15s ease"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Sparkles size={16} color="#111111" />
                            <span>Mis Preferencias</span>
                          </div>
                          {userPreferences.length > 0 && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                backgroundColor: "#eeeeee",
                                color: "#111111",
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
                          color: "#1e293b",
                          textDecoration: "none",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Bike size={16} color="#10b981" />
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
                          color: "#1e293b",
                          textDecoration: "none",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Store size={16} color="#333333" />
                        <span>Sistema POS</span>
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
                          color: "#1e293b",
                          textDecoration: "none",
                          transition: "background 0.15s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Shield size={16} color="#8b5cf6" />
                        <span>Panel Super Admin</span>
                      </Link>
                    )}

                    <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }} />

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
                        color: "#1e293b",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <HelpCircle size={16} color="#3b82f6" />
                      <span>Ayuda y Soporte</span>
                    </button>

                    <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }} />

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
                        color: "#ef4444",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <LogOut size={16} color="#ef4444" />
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
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "12px",
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
              borderBottom: "1px solid #e2e8f0",
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
                  color: "#111111",
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
                  color: "#111111",
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
                          color: "#111111",
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
                          color: "#1e293b",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          textDecoration: "none"
                        }}
                      >
                        <User size={16} color="#111111" />
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
                        color: "#111111",
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
                        color: "#111111",
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
                        color: "#111111",
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
                  color: "#3b82f6",
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
                borderTop: "1px solid #e2e8f0",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: "11px", color: "#5f6368" }}>{user.role}</div>
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
                    color: "#111111",
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
      <div id="goeats-restaurants" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px", scrollMarginTop: "90px" }}>

        {/* Categories Bar Horizontal Slider with Navigation Arrows */}
        <div style={{ position: "relative", margin: "10px 0" }}>
          {/* Left Navigation Arrow */}
          {canScrollCategoriesLeft && (
            <div style={{
              position: "absolute",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              display: "flex",
              alignItems: "center"
            }}>
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                aria-label="Ver categorías anteriores"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#1e293b",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Categories Slider Container */}
          <div
            ref={categoriesRef}
            className="no-scrollbar"
            onWheel={(e) => {
              if (e.deltaY !== 0 && categoriesRef.current) {
                categoriesRef.current.scrollLeft += e.deltaY * 0.7;
              }
            }}
            style={{
              display: "flex",
              gap: "16px",
              overflowX: "auto",
              padding: "16px 8px 12px 8px",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch"
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
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveSubcategory(null);
                  }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  width: cat.id === "all" ? "82px" : "150px",
                  flexShrink: 0,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  transition: "transform 0.15s ease",
                  padding: "4px"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: isSelected ? "#eeeeee" : "#f1f3f4",
                  border: isSelected ? "2px solid #111111" : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}>
                  <CategoryIcon size={25} strokeWidth={1.8} color={isSelected ? "#111111" : "#5f6368"} />
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: isSelected ? "700" : "500",
                  color: isSelected ? "#111111" : "#202124",
                  lineHeight: 1.3,
                  textAlign: "center",
                  whiteSpace: "normal"
                }}>
                  {cat.name}
                </span>
                </button>
              );
            })}
          </div>

          {/* Right Navigation Arrow */}
          {canScrollCategoriesRight && (
            <div style={{
              position: "absolute",
              right: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              display: "flex",
              alignItems: "center"
            }}>
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                aria-label="Ver más categorías"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#1e293b",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.18)";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {selectedMainCategory && availableSubcategories.length > 0 && (
          <div
            aria-label={`Subcategorías de ${selectedMainCategory.name}`}
            style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "4px 0 22px" }}
          >
            <button
              type="button"
              onClick={() => setActiveSubcategory(null)}
              aria-pressed={activeSubcategory === null}
              style={{
                padding: "8px 14px",
                border: `1px solid ${activeSubcategory === null ? "#111111" : "#e0e0e0"}`,
                borderRadius: "999px",
                color: activeSubcategory === null ? "#111111" : "#5f6368",
                background: activeSubcategory === null ? "#f1f1f1" : "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Todas
            </button>
            {availableSubcategories.map((subcategory) => {
              const isSelected = activeSubcategory === subcategory.id;
              return (
                <button
                  key={subcategory.id}
                  type="button"
                  onClick={() => setActiveSubcategory(isSelected ? null : subcategory.id)}
                  aria-pressed={isSelected}
                  style={{
                    padding: "8px 14px",
                    border: `1px solid ${isSelected ? "#111111" : "#e0e0e0"}`,
                    borderRadius: "999px",
                    color: isSelected ? "#111111" : "#5f6368",
                    background: isSelected ? "#f1f1f1" : "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {subcategory.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px", marginTop: "20px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="skeleton" style={{ width: "100%", height: "180px", borderRadius: "16px" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="skeleton" style={{ width: "60%", height: "20px" }} />
                  <div className="skeleton" style={{ width: "15%", height: "20px" }} />
                </div>
                <div className="skeleton" style={{ width: "40%", height: "14px" }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#111111", border: "1px solid #cbd5e1", borderRadius: "12px", marginTop: "20px" }}>
            <p>Error de conexión: {error}</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div style={{ padding: "60px 40px", textAlign: "center", color: "#5f6368", border: "1px dashed #cbd5e1", borderRadius: "16px", marginTop: "20px" }}>
            <Compass size={40} style={{ color: "#cbd5e1", marginBottom: "15px" }} />
            <h3 style={{ fontSize: "16px", color: "#202124", margin: "0 0 5px 0" }}>No se encontraron restaurantes</h3>
            <p style={{ fontSize: "13px", margin: 0 }}>Intenta removiendo filtros o buscando un término diferente.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "50px" }}>
            
            {/* SECTION 0: Recomendados para ti (Sistema de Preferencias Gastronómicas) */}
            {activeCategory === "all" && !searchQuery && (
              userPreferences.length > 0 && recommendedRestaurants.length > 0 ? (
                <div style={{
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: "24px",
                  padding: "24px 20px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#111111",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "4px"
                      }}>
                        <Sparkles size={14} /> Recomendaciones Personalizadas
                      </div>
                      <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#202124", margin: 0 }}>
                        Recomendados para ti según tus gustos
                      </h2>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                        {userPreferences.map((prefId) => {
                          const cat = FOOD_PREFERENCE_CATEGORIES.find(c => c.id === prefId);
                          if (!cat) return null;
                          const CategoryIcon = cat.icon;
                          return (
                            <span key={prefId} style={{
                              fontSize: "12px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #d6d6d6",
                              color: "#111111",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}>
                              <CategoryIcon size={13} /> {cat.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => setPreferencesModalOpen(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "#111111",
                        fontWeight: "700",
                        cursor: "pointer",
                        background: "#ffffff",
                        border: "1px solid rgba(0, 0, 0, 0.3)",
                        borderRadius: "20px",
                        padding: "6px 14px",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <SlidersHorizontal size={13} />
                      Cambiar gustos
                    </button>
                  </div>

                  <div className="no-scrollbar" style={{
                    display: "flex",
                    gap: "20px",
                    overflowX: "auto",
                    paddingBottom: "10px",
                    scrollBehavior: "smooth"
                  }}>
                    {recommendedRestaurants.map((rest) => (
                      <Link
                        to={`/r/${rest.slug}`}
                        key={`rec-${rest.id}`}
                        style={{
                          width: "300px",
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          position: "relative",
                          textDecoration: "none"
                        }}
                      >
                        <div style={{
                          position: "relative",
                          width: "100%",
                          height: "165px",
                          borderRadius: "16px",
                          overflow: "hidden",
                          backgroundColor: "#f1f3f4"
                        }}>
                          <img
                            src={rest.coverImage}
                            alt={rest.name}
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
                            }}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            backgroundColor: "rgba(15, 23, 42, 0.85)",
                            backdropFilter: "blur(4px)",
                            color: "#ffffff",
                            padding: "4px 9px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <Sparkles size={11} color="#333333" /> Recomendado
                          </div>

                          {isAuthenticated && (
                            <button
                              onClick={(e) => toggleFavorite(rest.id, e)}
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: favorites.includes(rest.id) ? "#111111" : "#5f6368"
                              }}
                            >
                              <Heart size={16} fill={favorites.includes(rest.id) ? "#111111" : "none"} />
                            </button>
                          )}
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#202124", margin: 0 }}>
                              {rest.name}
                            </h3>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "12px",
                              fontWeight: "700",
                              backgroundColor: "#f1f3f4",
                              padding: "2px 6px",
                              borderRadius: "6px"
                            }}>
                              <Star size={12} fill="#111111" color="#111111" />
                              <span>{rest.rating}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: "12px", color: "#5f6368", margin: "4px 0 0 0" }}>
                            {rest.category} • {rest.deliveryTime} • {rest.deliveryCost}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                null
              )
            )}

            {activeCategory === "all" && !searchQuery && newRestaurants.length > 0 &&
              renderRestaurantSection("Nuevos restaurantes", newRestaurants, "new", "Nuevo en GoEats")}

            {/* SECTION 1: Most ordered this week */}
            {activeCategory === "all" && !searchQuery && filteredRestaurants.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#202124", margin: 0 }}>
                    Lo más pedido esta semana
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#5f6368", fontWeight: "600", cursor: "pointer" }}>Ver todos</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => scrollPopular("left")}
                        aria-label="Anterior"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#f1f5f9",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#334155",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollPopular("right")}
                        aria-label="Siguiente"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#f1f5f9",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#334155",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {weeklyTopRestaurants.length > 0 ? (
                  <div
                    ref={popularRef}
                    className="no-scrollbar"
                    style={{
                      display: "flex",
                      gap: "20px",
                      overflowX: "auto",
                      paddingBottom: "10px",
                      scrollBehavior: "smooth"
                    }}
                  >
                    {weeklyTopRestaurants.map((rest) => (
                    <Link
                      to={`/r/${rest.slug}`}
                      key={`weekly-${rest.id}`}
                      style={{
                        width: "320px",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        position: "relative"
                      }}
                    >
                      {/* Cover Image Container */}
                      <div style={{
                        position: "relative",
                        width: "100%",
                        height: "170px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        backgroundColor: "#f1f3f4"
                      }}>
                        <img
                          src={rest.coverImage}
                          alt={rest.name}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
                          }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        
                        {/* Red Promo overlay badge */}
                        {rest.promoText && (
                          <div style={{
                            position: "absolute",
                            top: "15px",
                            left: "0px",
                            backgroundColor: "#111111",
                            color: "#ffffff",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: "700",
                            borderTopRightRadius: "4px",
                            borderBottomRightRadius: "4px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                          }}>
                            {rest.promoText}
                          </div>
                        )}

                        {/* Heart Button */}
                        {isAuthenticated && (
                          <button
                            onClick={(e) => toggleFavorite(rest.id, e)}
                            style={{
                              position: "absolute",
                              top: "15px",
                              right: "15px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                              transition: "transform 0.15s ease"
                            }}
                          >
                            <Heart
                              size={16}
                              fill={favorites.includes(rest.id) ? "#111111" : "none"}
                              color={favorites.includes(rest.id) ? "#111111" : "#5f6368"}
                            />
                          </button>
                        )}
                      </div>

                      {/* Content block */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                            {rest.logo && (
                              <img
                                src={rest.logo}
                                alt={rest.name}
                                onError={(e) => {
                                  e.currentTarget.src = "/logos/prueba.svg";
                                }}
                                style={{
                                  width: "26px",
                                  height: "26px",
                                  borderRadius: "6px",
                                  objectFit: "contain",
                                  backgroundColor: "#ffffff",
                                  padding: "2px",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                                  flexShrink: 0
                                }}
                              />
                            )}
                            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#202124", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {rest.name}
                            </h3>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#f1f3f4",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: "700",
                            flexShrink: 0,
                            marginLeft: "8px"
                          }}>
                            <span>{rest.ordersThisWeek} pedidos</span>
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#5f6368", marginTop: "3px" }}>
                          {rest.category}
                        </div>
                      </div>
                    </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, padding: "18px 20px", borderRadius: "12px", backgroundColor: "#f8f9fa", color: "#5f6368", fontSize: "14px" }}>
                    Aún no hay pedidos registrados esta semana.
                  </p>
                )}
              </div>
            )}

            {activeCategory === "all" && !searchQuery && samePriceRestaurants.length > 0 &&
              renderRestaurantSection("Mismo precio que en el local", samePriceRestaurants, "same-price", "Precio del local")}

            {/* SECTION 2: Restaurant offers */}
            {activeCategory === "all" && !searchQuery && offerRestaurants.length > 0 && (
              <div id="popular-offers">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#202124", margin: 0 }}>
                    Ofertas de restaurantes
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#5f6368", fontWeight: "600", cursor: "pointer" }}>Ver todos</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => scrollOffers("left")}
                        aria-label="Anterior"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#f1f5f9",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#334155",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollOffers("right")}
                        aria-label="Siguiente"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#f1f5f9",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#334155",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  ref={offersRef}
                  className="no-scrollbar"
                  style={{
                    display: "flex",
                    gap: "20px",
                    overflowX: "auto",
                    paddingBottom: "10px",
                    scrollBehavior: "smooth"
                  }}
                >
                  {offerRestaurants.map((rest) => (
                    <Link
                      to={`/r/${rest.slug}`}
                      key={`offer-${rest.id}`}
                      style={{
                        width: "320px",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        position: "relative"
                      }}
                    >
                      {/* Cover Image */}
                      <div style={{
                        position: "relative",
                        width: "100%",
                        height: "170px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        backgroundColor: "#f1f3f4"
                      }}>
                        <img
                          src={rest.coverImage}
                          alt={rest.name}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
                          }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        
                        {/* Red Promo overlay badge */}
                        <div style={{
                          position: "absolute",
                          top: "15px",
                          left: "0px",
                          backgroundColor: "#111111",
                          color: "#ffffff",
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderTopRightRadius: "4px",
                          borderBottomRightRadius: "4px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                        }}>
                          {rest.promoText}
                        </div>

                        {/* Heart Button */}
                        {isAuthenticated && (
                          <button
                            onClick={(e) => toggleFavorite(rest.id, e)}
                            style={{
                              position: "absolute",
                              top: "15px",
                              right: "15px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                              transition: "transform 0.15s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          >
                            <Heart
                              size={16}
                              fill={favorites.includes(rest.id) ? "#111111" : "none"}
                              color={favorites.includes(rest.id) ? "#111111" : "#5f6368"}
                            />
                          </button>
                        )}
                      </div>

                      {/* Content block */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                            {rest.logo && (
                              <img
                                src={rest.logo}
                                alt={rest.name}
                                onError={(e) => {
                                  e.currentTarget.src = "/logos/prueba.svg";
                                }}
                                style={{
                                  width: "26px",
                                  height: "26px",
                                  borderRadius: "6px",
                                  objectFit: "contain",
                                  backgroundColor: "#ffffff",
                                  padding: "2px",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                                  flexShrink: 0
                                }}
                              />
                            )}
                            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#202124", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {rest.name}
                            </h3>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            backgroundColor: "#f1f3f4",
                            padding: "3px 6px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            flexShrink: 0,
                            marginLeft: "8px"
                          }}>
                            <Star size={12} fill="#000000" color="#000000" />
                            <span>{rest.rating}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "5px", fontSize: "12px", color: "#5f6368", marginTop: "3px", alignItems: "center" }}>
                          <span>{rest.reviews}</span>
                          <span>•</span>
                          <span>{rest.deliveryTime}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#80868b", marginTop: "2px" }}>
                          {rest.deliveryCost}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: Grid General de Opciones */}
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#202124", marginBottom: "18px" }}>
                {activeCategory === "all" && !searchQuery ? "Todos los restaurantes" : "Resultados de búsqueda"}
              </h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "30px"
              }}>
                {filteredRestaurants.map((rest) => (
                  <Link
                    to={`/r/${rest.slug}`}
                    key={`grid-${rest.id}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      position: "relative"
                    }}
                  >
                    {/* Cover image card */}
                    <div style={{
                      position: "relative",
                      width: "100%",
                      height: "190px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      backgroundColor: "#f1f3f4"
                    }}>
                      <img
                        src={rest.coverImage}
                        alt={rest.name}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80";
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      
                      {/* Red Promo overlay badge */}
                      {rest.promoText && (
                        <div style={{
                          position: "absolute",
                          top: "15px",
                          left: "0px",
                          backgroundColor: "#111111",
                          color: "#ffffff",
                          padding: "4px 12px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderTopRightRadius: "4px",
                          borderBottomRightRadius: "4px",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                        }}>
                          {rest.promoText}
                        </div>
                      )}

                      {/* Favorite Button */}
                      {isAuthenticated && (
                        <button
                          onClick={(e) => toggleFavorite(rest.id, e)}
                          style={{
                            position: "absolute",
                            top: "15px",
                            right: "15px",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                          }}
                        >
                          <Heart
                            size={16}
                            fill={favorites.includes(rest.id) ? "#111111" : "none"}
                            color={favorites.includes(rest.id) ? "#111111" : "#5f6368"}
                          />
                        </button>
                      )}
                    </div>

                    {/* Meta info card */}
                    <div style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                      {/* Official Brand Logo */}
                      {rest.logo ? (
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          backgroundColor: "#ffffff",
                          flexShrink: 0,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #edf2f7",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <img
                            src={rest.logo}
                            alt={rest.name}
                            onError={(e) => {
                              e.currentTarget.src = "/logos/prueba.svg";
                            }}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          backgroundColor: "#f1f3f4",
                          flexShrink: 0,
                          border: "1px solid #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#111111"
                        }}>
                          {rest.name[0].toUpperCase()}
                        </div>
                      )}

                      {/* Details block */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#202124", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {rest.name}
                          </h3>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            backgroundColor: "#f1f3f4",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            flexShrink: 0,
                            marginLeft: "8px"
                          }}>
                            <Star size={12} fill="#000000" color="#000000" />
                            <span>{rest.rating}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "5px", fontSize: "13px", color: "#5f6368", marginTop: "3px", alignItems: "center" }}>
                          <span>{rest.category}</span>
                          <span>•</span>
                          <span>{rest.deliveryTime}</span>
                          <span>•</span>
                          <span>{rest.reviews}</span>
                        </div>

                        <div style={{ fontSize: "12px", color: "#80868b", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{rest.deliveryCost}</span>
                          {rest.specialLabel && (
                            <>
                              <span>•</span>
                              <span style={{
                                backgroundColor: "#eeeeee",
                                color: "#111111",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: "600",
                                fontSize: "10px"
                              }}>{rest.specialLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Styled Footer */}
      <footer style={{
        marginTop: "100px",
        borderTop: "1px solid #e2e8f0",
        padding: "40px 20px",
        textAlign: "center",
        backgroundColor: "#f8f9fa"
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "15px" }}>
          <Utensils size={24} color="#111111" />
          <strong style={{ fontSize: "18px", color: "#202124" }}>GoEats Marketplace</strong>
        </div>
        <p style={{ color: "#5f6368", fontSize: "13px", margin: "0 0 10px 0" }}>
          &copy; {new Date().getFullYear()} GoEats SaaS Platform. Todos los derechos reservados.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "13px" }}>
          <Link to="/login?role=restaurant&mode=register" style={{ color: "#111111", fontWeight: "600", textDecoration: "underline" }}>
            Inscribir Establecimiento
          </Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <Link to="/login" style={{ color: "#5f6368", textDecoration: "underline" }}>
            Panel de Control POS
          </Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <button
            onClick={() => setSupportModalOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              fontWeight: "600",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "13px",
              padding: 0
            }}
          >
            Centro de Ayuda & Soporte
          </button>
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
