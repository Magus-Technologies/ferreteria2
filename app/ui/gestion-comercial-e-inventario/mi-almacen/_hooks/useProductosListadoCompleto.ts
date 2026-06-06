'use client';

import { useQuery } from '@tanstack/react-query';
import { productosApiV2 } from '~/lib/api';
import type { Producto } from '~/app/_types/producto';

/**
 * Hook simple que carga TODOS los productos de un almacén de una sola vez.
 * Usado por:
 *  - table-producto-search.tsx (modal de búsqueda global)
 *  - header-crear-venta.tsx (prefetch en background)
 *
 * El backend cachea el JSON completo por 10 minutos.
 */
export function useProductosListadoCompleto(
  almacenId: number | null | undefined,
  enabled = true
) {
  return useQuery<Producto[]>({
    queryKey: ['productos-listado-completo', almacenId],
    queryFn: async () => {
      if (!almacenId) return [];
      const response = await productosApiV2.getListadoCompletoPorAlmacen(almacenId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!.data;
    },
    enabled: enabled && !!almacenId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 10,    // 10 minutos
    refetchOnWindowFocus: false,
  });
}
