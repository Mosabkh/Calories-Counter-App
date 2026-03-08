import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export type ReminderFrequency = 'daily' | 'weekly';

export interface ReminderConfig {
  enabled: boolean;
  hour: number;      // 0-23
  minute: number;    // 0-55, multiples of 5 (UI enforces 5-min intervals)
  frequency?: ReminderFrequency; // only used by weighIn; defaults to 'daily'
  weekday?: number; // 1 (Sun) – 7 (Sat), only used when frequency is 'weekly'
}

interface RemindersState {
  breakfast: ReminderConfig;
  lunch: ReminderConfig;
  dinner: ReminderConfig;
  weighIn: ReminderConfig;

  updateReminder: (key: 'breakfast' | 'lunch' | 'dinner' | 'weighIn', config: Partial<ReminderConfig>) => void;
  reset: () => void;
}

const DEFAULTS: Pick<RemindersState, 'breakfast' | 'lunch' | 'dinner' | 'weighIn'> = {
  breakfast: { enabled: false, hour: 8, minute: 0 },
  lunch: { enabled: false, hour: 12, minute: 30 },
  dinner: { enabled: false, hour: 19, minute: 0 },
  weighIn: { enabled: false, hour: 7, minute: 0, frequency: 'daily', weekday: 2 },
};

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      updateReminder: (key, config) =>
        set((s) => ({
          [key]: {
            ...s[key],
            ...config,
            // Ensure weighIn always retains frequency and weekday
            ...(key === 'weighIn' && {
              frequency: config.frequency ?? s.weighIn.frequency ?? 'daily',
              weekday: config.weekday ?? s.weighIn.weekday ?? 2,
            }),
          },
        })),

      reset: () => set(DEFAULTS),
    }),
    {
      name: 'calobite-reminders',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
