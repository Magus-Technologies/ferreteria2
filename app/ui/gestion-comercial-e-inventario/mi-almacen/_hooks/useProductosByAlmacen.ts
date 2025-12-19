'use client';

import { useQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { GetProductosParams } from '~/app/_types/producto';

interface UseProductosByAlmacenParams {
  filtros: GetProductosParams;
  enabled?: boolean;
}

export function useProductosByAlmacen({
  filtros,
  enabled = true,
}: UseProductosByAlmacenParams) {
  const query = useQuery({
    queryKey: ['productos-by-almacen', filtros],
    queryFn: async () => {
      const response = await productosApiV2.getAllByAlmacen(filtros);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data!;
    },
    enabled: enabled && !!filtros.almacen_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    data: query.data?.data ?? [],
    loading: query.isLoading,
    error: query.error,
    currentPage: query.data?.current_page ?? 1,
    totalPages: query.data?.last_page ?? 1,
    total: query.data?.total ?? 0,
    perPage: query.data?.per_page ?? 100,
    refetch: query.refetch,
  };
}
