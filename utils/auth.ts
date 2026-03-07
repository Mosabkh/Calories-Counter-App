import { useUserStore } from '@/store/user-store';
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
  useUserStore.getState().signOut();
}

// ── Google / Apple Sign-In ─────────────────────────────────────────
// These will be implemented when Supabase Auth is integrated.
// For now, create-account.tsx uses signInAnonymously() for both paths.
// When ready:
//   1. Install @supabase/supabase-js
//   2. Configure Supabase Auth with Google + Apple providers
//   3. Replace signInAnonymously calls with real OAuth flows
//   4. Store the Supabase session token in expo-secure-store
