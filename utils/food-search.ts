import usdaData from '@/data/usda-sr-legacy.json';
import type { FoodItem } from '@/types/food';

const foods: FoodItem[] = usdaData as FoodItem[];

// ── Local search (USDA SR Legacy — 7,700+ foods, offline) ────────

/** Search foods by name (case-insensitive, prefix-biased). */
export function searchFoods(query: string, limit = 20): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const words = q.split(/\s+/);
  const prefixMatches: FoodItem[] = [];
  const allWordsMatches: FoodItem[] = [];
  const containsMatches: FoodItem[] = [];

  for (const food of foods) {
    const name = food.name.toLowerCase();
    if (name.startsWith(q)) {
      prefixMatches.push(food);
    } else if (words.length > 1 && words.every((w) => name.includes(w))) {
      allWordsMatches.push(food);
    } else if (name.includes(q)) {
      containsMatches.push(food);
    }
  }

  return [...prefixMatches, ...allWordsMatches, ...containsMatches].slice(0, limit);
}

/** Get all foods in a category. */
export function getFoodsByCategory(category: string): FoodItem[] {
  return foods.filter((f) => f.category === category);
}

/** Get all unique categories. */
export function getCategories(): string[] {
  const cats = new Set(foods.map((f) => f.category));
  return Array.from(cats).sort();
}

/** Look up a food by ID. */
export function getFoodById(id: string): FoodItem | undefined {
  return foods.find((f) => f.id === id);
}

/** Calculate macros for a given food at a specific serving size in grams. */
export function calculateMacros(food: FoodItem, grams: number) {
  const ratio = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * ratio),
    protein: Math.round(food.proteinPer100g * ratio * 10) / 10,
    carbs: Math.round(food.carbsPer100g * ratio * 10) / 10,
    fat: Math.round(food.fatPer100g * ratio * 10) / 10,
  };
}

// ── Online search (Open Food Facts — 3M+ packaged foods) ─────────

const OFF_BASE = 'https://world.openfoodfacts.org/cgi/search.pl';

/** Search Open Food Facts API for packaged/branded foods. */
export async function searchOnline(query: string, limit = 10): Promise<FoodItem[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const url = `${OFF_BASE}?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&fields=code,product_name,nutriments,serving_size,serving_quantity&page_size=${limit}&json=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Calobite/1.0 (calobite.dev)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const products = data.products;
    if (!Array.isArray(products)) return [];

    const results: FoodItem[] = [];
    for (const p of products) {
      const name = p.product_name;
      if (!name || typeof name !== 'string' || name.trim().length === 0) continue;

      const n = p.nutriments || {};
      const cal = Number(n['energy-kcal_100g']) || 0;
      const protein = Number(n['proteins_100g']) || 0;
      const carbs = Number(n['carbohydrates_100g']) || 0;
      const fat = Number(n['fat_100g']) || 0;

      // Skip items with no nutrition data
      if (cal === 0 && protein === 0 && carbs === 0 && fat === 0) continue;

      const servingG = Number(p.serving_quantity) || 100;
      const servingLabel = p.serving_size || `${servingG}g`;

      results.push({
        id: 'off_' + (p.code || Date.now().toString(36)),
        name: name.trim(),
        category: 'Packaged Food',
        caloriesPer100g: Math.round(cal * 10) / 10,
        proteinPer100g: Math.round(protein * 10) / 10,
        carbsPer100g: Math.round(carbs * 10) / 10,
        fatPer100g: Math.round(fat * 10) / 10,
        defaultServingG: Math.round(servingG),
        defaultServingLabel: servingLabel,
      });
    }

    return results;
  } catch (err) {
    // Network error or timeout — return empty (offline fallback)
    console.warn('[food-search] Online search failed:', err);
    return [];
  }
}
