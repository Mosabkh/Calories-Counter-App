import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { ActivityLevel } from '@/utils/calories';

export interface OnboardingPayload {
  // Step 1: Basics
  name?: string;
  gender?: 'male' | 'female';
  birthMonth?: string;
  birthDay?: string;
  birthYear?: string;

  // Step 2: Body & Goals
  goal?: 'lose' | 'maintain' | 'gain';
  accomplish?: string;
  activityLevel?: ActivityLevel;
  height?: number;
  heightUnit?: 'cm' | 'ft';
  currentWeight?: number;
  startWeight?: number;
  weightDecimal?: number;
  targetWeight?: number;
  targetWeightDecimal?: number;
  weightUnit?: 'kg' | 'lb';
  weeklyGoalSpeed?: number;

  // Step 3: Lifestyle
  roadblocks?: string;
  eatsMoreOnWeekends?: boolean;
  weekendDays?: string[];
  addBurnedCalories?: boolean;
  rolloverCalories?: boolean;
  enableNotifications?: boolean;
}

interface OnboardingState {
  currentStep: number;
  payload: OnboardingPayload;
  isOnboardingComplete: boolean;
  setStep: (step: number) => void;
  updatePayload: (data: Partial<OnboardingPayload>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      payload: {},
      isOnboardingComplete: false,
      setStep: (step) => set({ currentStep: step }),
      updatePayload: (data) =>
        set((state) => ({ payload: { ...state.payload, ...data } })),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      reset: () => set({ currentStep: 1, payload: {}, isOnboardingComplete: false }),
    }),
    {
      name: 'calobite-onboarding',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
