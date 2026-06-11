import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { mapToEntregaDB } from '~/app/ui/facturacion-electronica/mis-entregas/_hooks/use-get-entregas'
import type { EntregaProductoFilters } from '~/lib/api/entrega-producto'

/**
 * Entregas de una venta para el modal "Ver entregas" (mis-ventas).
 * Lee de la tabla NUEVA vía `entregas/por-venta` y mapea a la forma legacy
 * (`mapToEntregaDB`) que el modal ya consume — así el render no cambia.
 */
export default function useGetEntregas({
  filters,
}: {
  filters?: EntregaProductoFilters
}) {
  const ventaId = filters?.venta_id

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaId],
    // IMPORTANTE: esta key se comparte con useEntregasDeVenta (modal Configurar
    // Entrega) y use-init-guia. El cache SIEMPRE guarda el ApiResponse crudo;
    // el mapeo a forma legacy se hace en `select` (solo vista de este hook).
    // Antes el queryFn guardaba el array ya mapeado y el modal leía
    // `res.data.data` sobre un array → historial vacío tras un refresh.
    queryFn: () => entregasNuevasApi.porVenta(String(ventaId)),
    enabled: !!ventaId,
    select: (res) => {
      const rows = (res.data as any)?.data ?? []
      return Array.isArray(rows) ? rows.map(mapToEntregaDB) : []
    },
  })

  return {
    response: Array.isArray(data) ? data : [],
    loading: isLoading,
  }
}
