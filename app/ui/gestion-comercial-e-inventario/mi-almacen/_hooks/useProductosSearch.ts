'use client';

import { useQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { GetProductosParams } from '~/app/_types/producto';

interface UseProductosSearchParams {
  filtros: Partial<GetProductosParams>;
  enabled?: boolean;
}

/**
 * Hook para búsqueda de productos.
 * per_page se puede pasar en filtros; por defecto carga hasta 1500 productos.
 */
export function useProductosSearch({
  filtros,
  enabled = true,
}: UseProductosSearchParams) {
  const query = useQuery({
    queryKey: ['productos-search', filtros],
    queryFn: async () => {
      const response = await productosApiV2.getAllByAlmacen({
        ...filtros,
        almacen_id: filtros.almacen_id,
        per_page: filtros.per_page ?? 1500,
        page: filtros.page ?? 1,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.data ?? [];
    },
    enabled: enabled,
    staleTime: 1000 * 30, // 30 segundos
    placeholderData: (prev) => prev, // Mantener datos previos mientras carga nuevos
  });

  return {
    data: query.data ?? [],
    // isFetching cubre carga inicial + refetches con cache: muestra loading
    // siempre que se está pidiendo data nueva (evita tabla en blanco/data vieja).
    loading: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    isFetched: query.isFetched,
  };
}
