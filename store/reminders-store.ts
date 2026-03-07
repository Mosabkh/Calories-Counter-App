import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export interface ReminderConfig {
  enabled: boolean;
  hour: number;   // 0-23
  minute: number;  // 0-59
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
  weighIn: { enabled: false, hour: 7, minute: 0 },
};

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      updateReminder: (key, config) =>
        set((s) => ({
          [key]: { ...s[key], ...config },
        })),

      reset: () => set(DEFAULTS),
    }),
    {
      name: 'calobite-reminders',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
