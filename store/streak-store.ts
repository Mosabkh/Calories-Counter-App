import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { yesterdayKey } from '@/utils/date';
import type { StreakData } from '@/types/data';

interface StreakState {
  streak: StreakData;

  /** Call when a meal is logged. Pass today's date key ('YYYY-MM-DD'). */
  recordActivity: (todayKey: string) => void;
  reset: () => void;
}

const INITIAL_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLoggedDate: null,
};

export const useStreakStore = create<StreakState>()(
  persist(
    (set) => ({
      streak: INITIAL_STREAK,

      recordActivity: (todayKey) =>
        set((s) => {
          const { lastLoggedDate, currentStreak, longestStreak } = s.streak;

          // Already logged today
          if (lastLoggedDate === todayKey) return s;

          const yesterday = yesterdayKey();
          let newStreak: number;

          if (lastLoggedDate === yesterday) {
            // Consecutive day
            newStreak = currentStreak + 1;
          } else {
            // Streak broken or first ever log
            newStreak = 1;
          }

          return {
            streak: {
              currentStreak: newStreak,
              longestStreak: Math.max(longestStreak, newStreak),
              lastLoggedDate: todayKey,
            },
          };
        }),

      reset: () => set({ streak: INITIAL_STREAK }),
    }),
    {
      name: 'calobite-streak',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
