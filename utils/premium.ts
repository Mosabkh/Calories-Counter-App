import { useSubscriptionStore } from '@/store/subscription-store';

/** Check premium status outside of React (e.g. in utils). */
export function isPremium(): boolean {
  return useSubscriptionStore.getState().isActive;
}

/** React hook — re-renders when subscription status changes. */
export function usePremium(): boolean {
  return useSubscriptionStore((s) => s.isActive);
}
