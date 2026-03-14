import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { useStreakStore } from './streak-store';
import { toDateKey } from '@/utils/date';
import type { MealEntry, DailySummary } from '@/types/data';

interface DiaryState {
  entries: Record<string, MealEntry[]>; // keyed by 'YYYY-MM-DD'

  addMeal: (meal: MealEntry) => void;
  removeMeal: (date: string, mealId: string) => void;
  updateMeal: (date: string, mealId: string, patch: Partial<MealEntry>) => void;
  getMealsForDate: (date: string) => MealEntry[];
  getDailySummary: (date: string) => DailySummary;
  hasLoggedDate: (date: string) => boolean;
  reset: () => void;
}

const EMPTY_SUMMARY: DailySummary = {
  date: '',
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  mealCount: 0,
};

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: {},

      addMeal: (meal) => {
        set((s) => {
          const dayMeals = [...(s.entries[meal.date] || []), meal];
          return { entries: { ...s.entries, [meal.date]: dayMeals } };
        });
        useStreakStore.getState().recordActivity(meal.date);
      },

      removeMeal: (date, mealId) =>
        set((s) => {
          const dayMeals = (s.entries[date] || []).filter((m) => m.id !== mealId);
          const updated = { ...s.entries };
          if (dayMeals.length === 0) {
            delete updated[date];
          } else {
            updated[date] = dayMeals;
          }
          return { entries: updated };
        }),

      updateMeal: (date, mealId, patch) =>
        set((s) => {
          const dayMeals = (s.entries[date] || []).map((m) =>
            m.id === mealId ? { ...m, ...patch } : m,
          );
          return { entries: { ...s.entries, [date]: dayMeals } };
        }),

      getMealsForDate: (date) => get().entries[date] || [],

      getDailySummary: (date) => {
        const meals = get().entries[date];
        if (!meals || meals.length === 0) return { ...EMPTY_SUMMARY, date };
        return {
          date,
          totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
          totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
          totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
          totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
          mealCount: meals.length,
        };
      },

      hasLoggedDate: (date) => {
        const meals = get().entries[date];
        return !!meals && meals.length > 0;
      },

      reset: () => set({ entries: {} }),
    }),
    {
      name: 'calobite-diary',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
