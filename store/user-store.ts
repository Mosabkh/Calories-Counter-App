import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { UserProfile, AuthState } from '@/types/data';

interface UserState {
  profile: UserProfile | null;
  auth: AuthState;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setAuth: (auth: AuthState) => void;
  signOut: () => void;
  reset: () => void;
}

const INITIAL_AUTH: AuthState = {
  isAuthenticated: false,
  provider: null,
  user: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      auth: INITIAL_AUTH,

      setProfile: (profile) => set({ profile }),
      updateProfile: (patch) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...patch } : null,
        })),
      setAuth: (auth) => set({ auth }),
      signOut: () => set({ auth: INITIAL_AUTH }),
      reset: () => set({ profile: null, auth: INITIAL_AUTH }),
    }),
    {
      name: 'calobite-user',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
