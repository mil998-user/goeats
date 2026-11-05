import type { ElementType } from "react";
import { Flame, Fish, Globe2, Pizza, Utensils } from "lucide-react";

export interface FoodCategoryOption {
  id: string;
  name: string;
  description: string;
  icon: ElementType;
}

export const FOOD_PREFERENCE_CATEGORIES: FoodCategoryOption[] = [
  { id: "lojana", name: "Comida Típica y Tradicional Lojana", icon: Utensils, description: "Sabores tradicionales y platos lojanos." },
  { id: "pizzerias", name: "Pizzerías y Bares", icon: Pizza, description: "Pizza, bares y propuestas para compartir." },
  { id: "international", name: "Cocina Internacional y Latinoamericana", icon: Globe2, description: "Cocinas del mundo y sabores de Latinoamérica." },
  { id: "grill", name: "Carnes, Parrillas y Asados", icon: Flame, description: "Carnes, parrilladas, pollo y asados." },
  { id: "seafood", name: "Marisquerías", icon: Fish, description: "Pescados, mariscos y ceviches." },
];

const legacyPreferenceCategories: Record<string, string> = {
  burgers: "grill",
  pizza: "pizzerias",
  sushi: "international",
  alitas: "grill",
  mexican: "international",
  healthy: "international",
  desserts: "international",
  bbq: "grill",
  italian: "international",
  sandwiches: "international",
  tapioca: "international",
  fastfood: "grill",
};

export const normalizeFoodPreferences = (preferences: string[]): string[] =>
  Array.from(new Set(preferences
    .map((id) => legacyPreferenceCategories[id] || id)
    .filter((id) => FOOD_PREFERENCE_CATEGORIES.some((category) => category.id === id))));
