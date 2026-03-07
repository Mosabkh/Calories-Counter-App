import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { ExerciseEntry } from '@/types/data';

interface ExerciseState {
  entries: Record<string, ExerciseEntry[]>; // keyed by 'YYYY-MM-DD'

  addExercise: (entry: ExerciseEntry) => void;
  removeExercise: (date: string, id: string) => void;
  getForDate: (date: string) => ExerciseEntry[];
  getTotalBurnedForDate: (date: string) => number;
  reset: () => void;
}

export const useExerciseStore = create<ExerciseState>()(
  persist(
    (set, get) => ({
      entries: {},

      addExercise: (entry) =>
        set((s) => {
          const dayEntries = [...(s.entries[entry.date] || []), entry];
          return { entries: { ...s.entries, [entry.date]: dayEntries } };
        }),

      removeExercise: (date, id) =>
        set((s) => {
          const dayEntries = (s.entries[date] || []).filter((e) => e.id !== id);
          const updated = { ...s.entries };
          if (dayEntries.length === 0) {
            delete updated[date];
          } else {
            updated[date] = dayEntries;
          }
          return { entries: updated };
        }),

      getForDate: (date) => get().entries[date] || [],

      getTotalBurnedForDate: (date) => {
        const dayEntries = get().entries[date];
        if (!dayEntries) return 0;
        return dayEntries.reduce((sum, e) => sum + e.caloriesBurned, 0);
      },

      reset: () => set({ entries: {} }),
    }),
    {
      name: 'calobite-exercise',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
