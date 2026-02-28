'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getAuthToken, removeAuthToken, LoginResponse } from './api';
import { useRouter } from 'next/navigation';

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
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Cargar el usuario al montar el componente
  useEffect(() => {
    // Evitar doble llamada en Strict Mode
    if (initialized) return;
    setInitialized(true);
    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUser = async () => {
    const token = getAuthToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getUser();

      if (response.data) {
        setUser(response.data);
      } else {
        // Si hay error al obtener el usuario, eliminar el token
        removeAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      if (response.data) {
        // ✅ SOLUCIÓN: Establecer el usuario directamente desde la respuesta del login
        // NO llamar a loadUser() porque causa el error 401
        setUser(response.data.user);
        setLoading(false); // Importante: marcar como cargado
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
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar keys de birthday alert para que se muestre al volver a iniciar sesión
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('birthday_alert_shown_'))
        .forEach(key => sessionStorage.removeItem(key));
      setUser(null);
      removeAuthToken();
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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

// Hook para verificar si el usuario está autenticado
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return { user, loading };
}