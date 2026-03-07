import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly';

export interface SubscriptionState {
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt: string | null; // ISO date string
  productId: string | null;

  activate: (plan: SubscriptionPlan, expiresAt: string, productId: string) => void;
  deactivate: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      plan: 'free',
      isActive: false,
      expiresAt: null,
      productId: null,

      activate: (plan, expiresAt, productId) =>
        set({ plan, isActive: true, expiresAt, productId }),

      deactivate: () =>
        set({ plan: 'free', isActive: false, expiresAt: null, productId: null }),

      reset: () =>
        set({ plan: 'free', isActive: false, expiresAt: null, productId: null }),
    }),
    {
      name: 'calobite-subscription',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
