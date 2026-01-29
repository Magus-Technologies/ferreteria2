'use client';

import { useQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { GetProductosParams } from '~/app/_types/producto';

interface UseProductosSearchParams {
  filtros: Partial<GetProductosParams>;
  enabled?: boolean;
}

/**
 * Hook para búsqueda de productos (sin paginación, máximo 100 resultados)
 * Usado para cards-info y otros componentes que necesitan datos agregados
 */
export function useProductosSearch({
  filtros,
  enabled = true,
}: UseProductosSearchParams) {
  const query = useQuery({
    queryKey: ['productos-search', filtros],
    queryFn: async () => {
      console.log('🔍 Búsqueda de productos con filtros:', filtros);
      
      const response = await productosApiV2.getAllByAlmacen({
        ...filtros,
        almacen_id: filtros.almacen_id || 1,
        per_page: 100, // Aumentado para búsquedas
        page: 1,
      });

      if (response.error) {
        console.error('❌ Error en búsqueda:', response.error);
        throw new Error(response.error.message);
      }

      console.log('✅ Productos encontrados:', response.data?.data?.length || 0);

      return response.data?.data ?? [];
    },
    enabled: enabled && !!filtros.almacen_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetched: query.isFetched,
  };
}
