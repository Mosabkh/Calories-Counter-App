import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { WeightEntry } from '@/types/data';

interface WeightState {
  entries: WeightEntry[]; // sorted by timestamp descending

  addEntry: (entry: WeightEntry) => void;
  removeEntry: (id: string) => void;
  getLatest: () => WeightEntry | undefined;
  getEntriesInRange: (startDate: string, endDate: string) => WeightEntry[];
  /** Convert all entries to a new unit using the provided conversion function */
  convertAll: (toUnit: 'kg' | 'lb', convert: (v: number) => number) => void;
  reset: () => void;
}

export const useWeightStore = create<WeightState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((s) => ({
          entries: [entry, ...s.entries].sort((a, b) => b.timestamp - a.timestamp),
        })),

      removeEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
        })),

      getLatest: () => get().entries[0],

      getEntriesInRange: (startDate, endDate) =>
        get().entries.filter((e) => e.date >= startDate && e.date <= endDate),

      convertAll: (toUnit, convert) =>
        set((s) => ({
          entries: s.entries.map((e) => ({
            ...e,
            weight: convert(e.weight),
            unit: toUnit,
          })),
        })),

      reset: () => set({ entries: [] }),
    }),
    {
      name: 'calobite-weight',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
