import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { IAuthStore } from '@/interfaces/auth';

/**
 * The only place server data is mirrored into client state: the session.
 * Everything else lives in TanStack Query.
 */
export const useAuthStore = create<IAuthStore>()(
  persist(
    (set) => ({
      access: undefined,
      refresh: undefined,
      auth: null,
      user: null,
      organization: null,
      hydrated: false,

      initUserStore: ({ auth, user, organization, tokens }) =>
        set({
          auth,
          user,
          organization,
          access: tokens.access,
          refresh: tokens.refresh,
        }),

      setAccess: (tokens) =>
        set({
          access: tokens.access,
          refresh: tokens.refresh,
        }),

      setAccount: ({ auth, user, organization }) =>
        set((state) => ({
          auth: auth ?? state.auth,
          user: user ?? state.user,
          organization: organization ?? state.organization,
        })),

      setHydrated: () => set({ hydrated: true }),

      logoutAccount: () =>
        set({
          access: undefined,
          refresh: undefined,
          auth: null,
          user: null,
          organization: null,
        }),
    }),
    {
      name: 'komtru-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        access: state.access,
        refresh: state.refresh,
        auth: state.auth,
        user: state.user,
        organization: state.organization,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/**
 * Await rehydration from `localStorage`. Use when imperative code (not a
 * component) needs the session before it acts.
 */
export function waitForHydration(): Promise<void> {
  if (useAuthStore.getState().hydrated) return Promise.resolve();

  return new Promise((resolve) => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.hydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}

/** True once the store has rehydrated *and* an access token is present. */
export function isAuthenticated(): boolean {
  const { hydrated, access } = useAuthStore.getState();
  return hydrated && Boolean(access?.token);
}
