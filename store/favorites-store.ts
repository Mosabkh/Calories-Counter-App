import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { FoodItem } from '@/types/food';

interface FavoritesState {
  ids: string[];
  /** Cached FoodItem data for online foods (not in bundled USDA data). */
  cachedFoods: Record<string, FoodItem>;

  /** Toggle favorite. Pass the full FoodItem for online foods so they can be resolved later. */
  toggle: (foodId: string, food?: FoodItem) => void;
  isFavorite: (foodId: string) => boolean;
  getCachedFood: (foodId: string) => FoodItem | undefined;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      cachedFoods: {},

      toggle: (foodId, food?) =>
        set((s) => {
          const exists = s.ids.includes(foodId);
          if (exists) {
            const { [foodId]: _, ...rest } = s.cachedFoods;
            return { ids: s.ids.filter((id) => id !== foodId), cachedFoods: rest };
          }
          const newCached = food && foodId.startsWith('off_')
            ? { ...s.cachedFoods, [foodId]: food }
            : s.cachedFoods;
          return { ids: [...s.ids, foodId], cachedFoods: newCached };
        }),

      isFavorite: (foodId) => get().ids.includes(foodId),

      getCachedFood: (foodId) => get().cachedFoods[foodId],

      reset: () => set({ ids: [], cachedFoods: {} }),
    }),
    {
      name: 'calobite-favorites',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
