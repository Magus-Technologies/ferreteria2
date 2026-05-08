'use client';

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { GetProductosParams } from '~/app/_types/producto';

interface UseProductosSearchParams {
  filtros: Partial<GetProductosParams>;
  enabled?: boolean;
}

/**
 * Hook para búsqueda de productos con scroll infinito.
 * Carga los productos por páginas de 1000 para optimizar el rendimiento.
 */
export function useProductosSearch({
  filtros,
  enabled = true,
}: UseProductosSearchParams) {
  const query = useInfiniteQuery({
    queryKey: ['productos-search', filtros],
    queryFn: async ({ pageParam }) => {
      const response = await productosApiV2.getAllByAlmacen({
        ...filtros,
        almacen_id: filtros.almacen_id,
        per_page: filtros.per_page ?? 1000,
        page: pageParam as number,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.current_page >= lastPage.last_page) {
        return undefined;
      }
      return lastPage.current_page + 1;
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // Aplanar todas las páginas cargadas en un solo array de productos para AG Grid.
  // useMemo garantiza referencia estable — sin esto flatMap crea un array nuevo
  // en cada render, lo que resetea la selección de AG Grid innecesariamente.
  const data = useMemo(
    () => query.data?.pages.flatMap((page) => page?.data ?? []) ?? [],
    [query.data]
  );

  return {
    data,
    loading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
    isFetched: query.isFetched,
  };
}
