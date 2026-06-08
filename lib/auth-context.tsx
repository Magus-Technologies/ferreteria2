'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, getAuthToken, removeAuthToken, LoginResponse } from './api';
import { useRouter } from 'next/navigation';
import { clearLogoCache } from '~/hooks/use-empresa-publica';
import { useStoreAuth } from '~/store/store-auth';
import { subscribeModelChanged } from '~/lib/realtime-bus';

export type User = LoginResponse['user'] | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const cachedUser = useStoreAuth((s) => s.user);
  const setCachedUser = useStoreAuth((s) => s.setUser);
  const hasHydrated = useStoreAuth((s) => s.hasHydrated);

  // `loading` ahora representa "todavía no terminamos de hidratar el cache".
  // Si ya hidrató (lectura síncrona del localStorage), NO mostramos splash.
  const [refreshing, setRefreshing] = useState(false);

  // Refrescar el user en background cuando:
  //  1) hay token, 2) ya hidratamos el cache, 3) todavía no estamos refrescando.
  // Esto se hace UNA VEZ por mount del provider, no en cada navegación.
  useEffect(() => {
    if (!hasHydrated) return;
    const token = getAuthToken();
    if (!token) {
      setCachedUser(null);
      return;
    }
    // Si ya tenemos user del cache, igual refrescamos para tener datos frescos,
    // pero sin bloquear la UI: la promesa se resuelve en background.
    let cancelled = false;
    setRefreshing(true);
    authApi
      .getUser()
      .then((response) => {
        if (cancelled) return;
        if (response.data) {
          setCachedUser(response.data);
        } else {
          removeAuthToken();
          setCachedUser(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error al refrescar usuario:', err);
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // Solo cuando el cache termina de hidratar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authApi.login(email, password);
        if (response.data) {
          // Cachear el user inmediatamente para que la próxima mount
          // del layout no muestre splash.
          setCachedUser(response.data.user);
          return { success: true };
        }
        return {
          success: false,
          error: response.error?.message || 'Error al iniciar sesión',
        };
      } catch (error) {
        console.error('Error durante login:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error al iniciar sesión',
        };
      }
    },
    [setCachedUser]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith('birthday_alert_shown_'))
        .forEach((key) => sessionStorage.removeItem(key));
      clearLogoCache();
      setCachedUser(null);
      removeAuthToken();
    }
  }, [setCachedUser]);

  const refreshUser = useCallback(async () => {
    const response = await authApi.getUser();
    if (response.data) {
      setCachedUser(response.data);
    } else {
      removeAuthToken();
      setCachedUser(null);
    }
  }, [setCachedUser]);

  // Tiempo real: cuando aprueban una autorización de acceso para ESTE usuario,
  // refrescar el user para que `auth_granted` se actualice y los candados
  // (AccesoGuard / ComponenteAccesoGuard) desaparezcan solos, sin recargar.
  useEffect(() => {
    const userId = cachedUser?.id;
    if (!userId) return;
    return subscribeModelChanged((payload) => {
      if (
        payload.module === 'autorizaciones' &&
        payload.action === 'aprobada' &&
        payload.user_id === userId
      ) {
        refreshUser();
      }
    });
  }, [cachedUser?.id, refreshUser]);

  // `loading=true` solo si todavía no hidratamos el cache.
  // Eso evita el flash de "splash" en cada navegación cliente.
  const loading = !hasHydrated;

  return (
    <AuthContext.Provider
      value={{ user: cachedUser, loading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook para verificar si el usuario está autenticado.
// Lee el cache de zustand persist; solo dispara redirect si NO hay user
// (y ya hidrató el cache).
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasHydrated = useStoreAuth((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/');
    }
  }, [user, hasHydrated, router]);

  return { user, loading };
}
