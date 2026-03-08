import { useUserStore } from '@/store/user-store';
import { useDiaryStore } from '@/store/diary-store';
import { useWeightStore } from '@/store/weight-store';
import { useExerciseStore } from '@/store/exercise-store';
import { useStreakStore } from '@/store/streak-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { usePhotoStore } from '@/store/photo-store';
import { useRemindersStore } from '@/store/reminders-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import type { AuthState } from '@/types/data';

/**
 * Sign in anonymously (continue without account).
 * Sets auth state to anonymous so the app knows the user skipped sign-in.
 */
export function signInAnonymously(): void {
  const auth: AuthState = {
    isAuthenticated: false,
    provider: 'anonymous',
    user: null,
  };
  useUserStore.getState().setAuth(auth);
}

/**
 * Sign out: clears auth state and optionally resets all stores.
 * When a backend is added, this should also call the provider's sign-out.
 */
export async function signOut(): Promise<void> {
  useUserStore.getState().reset();
  useDiaryStore.getState().reset();
  useWeightStore.getState().reset();
  useExerciseStore.getState().reset();
  useStreakStore.getState().reset();
  useFavoritesStore.getState().reset();
  usePhotoStore.getState().reset();
  useRemindersStore.getState().reset();
  useSubscriptionStore.getState().reset();
  // Intentionally NOT resetting onboarding — user should land on welcome screen, not redo 26 steps
}

// ── Google / Apple Sign-In ─────────────────────────────────────────
// These will be implemented when Supabase Auth is integrated.
// For now, create-account.tsx uses signInAnonymously() for both paths.
// When ready:
//   1. Install @supabase/supabase-js
//   2. Configure Supabase Auth with Google + Apple providers
//   3. Replace signInAnonymously calls with real OAuth flows
//   4. Store the Supabase session token in expo-secure-store
