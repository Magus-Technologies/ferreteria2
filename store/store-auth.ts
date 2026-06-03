import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '~/lib/api'

type User = LoginResponse['user']

type UseStoreAuthProps = {
  user: User | null
  setUser: (user: User | null) => void
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
}

/**
 * Cache de sesión en localStorage. Permite:
 *  - Mostrar la UI inmediatamente al navegar (sin splash) si ya hay user cacheado.
 *  - Evitar el round-trip HTTP de `getUser()` en cada mount del layout.
 *  - Refrescar el user en background sin bloquear la UI.
 *
 * El user se descarta explícitamente en `logout()` y en cualquier 401.
 */
export const useStoreAuth = create<UseStoreAuthProps>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth-user-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
