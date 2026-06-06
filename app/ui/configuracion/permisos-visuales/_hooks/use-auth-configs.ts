import { useQuery } from '@tanstack/react-query';
import { autorizacionesApi, autorizacionesKeys, type AutorizacionConfig } from '~/lib/api/autorizaciones';
import { apiRequest } from '~/lib/api';
import type { Accion } from '../_types';

type TipoAutorizador = 'usuario' | 'cargo' | 'jerarquia';

interface UseAuthConfigsReturn {
  authConfigs: AutorizacionConfig[];
  users: { id: string; name: string }[];
  isRequiereAuth: (modulo: string, accion: Accion) => boolean;
  getAutorizadorId: (modulo: string, accion: Accion) => string | null;
  getTipoAutorizador: (modulo: string, accion: Accion) => TipoAutorizador;
  getCargoAutorizador: (modulo: string, accion: Accion) => string | null;
}

export function useAuthConfigs(rolId: number | null): UseAuthConfigsReturn {
  const { data: configsResponse } = useQuery({
    queryKey: autorizacionesKeys.configs(rolId ?? undefined),
    queryFn: () => autorizacionesApi.getConfigs(rolId!),
    enabled: !!rolId,
  });

  const authConfigs: AutorizacionConfig[] = (() => {
    const raw = configsResponse?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) return (raw as any).data;
    return [];
  })();

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<any[]>('/autorizaciones/usuarios'),
    enabled: !!rolId,
  });

  const users: { id: string; name: string }[] = (() => {
    const raw = usersResponse?.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as any).data)) return (raw as any).data;
    return [];
  })();

  const getAuthConfig = (modulo: string, accion: Accion): AutorizacionConfig | undefined => {
    return authConfigs.find(c => c.modulo === modulo && c.accion === accion);
  };

  const isRequiereAuth = (modulo: string, accion: Accion): boolean => {
    return getAuthConfig(modulo, accion)?.requiere_autorizacion ?? false;
  };

  const getAutorizadorId = (modulo: string, accion: Accion): string | null => {
    return getAuthConfig(modulo, accion)?.autorizador_id ?? null;
  };

  const getTipoAutorizador = (modulo: string, accion: Accion): TipoAutorizador => {
    return (getAuthConfig(modulo, accion)?.tipo_autorizador as TipoAutorizador) ?? 'usuario';
  };

  const getCargoAutorizador = (modulo: string, accion: Accion): string | null => {
    return getAuthConfig(modulo, accion)?.cargo_autorizador ?? null;
  };

  return {
    authConfigs,
    users,
    isRequiereAuth,
    getAutorizadorId,
    getTipoAutorizador,
    getCargoAutorizador,
  };
}