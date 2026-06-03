'use client'

import { useQuery } from '@tanstack/react-query'
import { productosApiV2 } from '~/lib/api/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'

/**
 * Hook que carga TODOS los productos de un almacén de UNA SOLA VEZ
 * y los cachea agresivamente.
 *
 * Decisión de diseño: el cliente NO quiere paginación. Entonces:
 *  1) El BACK devuelve un shape LIGERO (sin compras, sin productoComplementario,
 *     sin tiene_ingresos) — ver ProductoController@listadoModal.
 *  2) El BACK cachea 10 min por almacén.
 *  3) El FRONT cachea 10 min en TanStack Query + 30 min en gcTime.
 *  4) Los filtros (búsqueda, marca, stock) se aplican EN MEMORIA sobre
 *     el set cacheado → sin round-trip al back.
 *
 * Resultado: el modal abre instantáneamente, la búsqueda es instantánea
 * (Fuse.js sobre el set cacheado en <1ms), y solo se vuelve a pedir al
 * back cuando:
 *   - Es la primera vez
 *   - El cache del back expiró (10 min)
 *   - Se invalida explícitamente al crear/editar/eliminar un producto
 */
export function useProductosListadoCompleto(almacenId: number | undefined) {
  return useQuery({
    queryKey: [QueryKeys.PRODUCTOS_LISTADO_COMPLETO, almacenId],
    queryFn: async () => {
      if (!almacenId) return []

      const response = await productosApiV2.getListadoLigeroPorAlmacen(almacenId)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
    enabled: !!almacenId,
    staleTime: 10 * 60 * 1000, // 10 min — coincide con el TTL del back
    gcTime: 30 * 60 * 1000, // 30 min — sobrevive navegaciones largas
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // si está stale, refetch (si no, usa cache)
  })
}
