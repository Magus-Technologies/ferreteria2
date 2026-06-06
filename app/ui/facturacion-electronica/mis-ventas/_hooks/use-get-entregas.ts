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
    queryFn: async () => {
      const response = await entregasNuevasApi.porVenta(String(ventaId))
      const rows = (response.data as any)?.data ?? response.data ?? []
      return Array.isArray(rows) ? rows.map(mapToEntregaDB) : []
    },
    enabled: !!ventaId,
  })

  return {
    // Garantizar siempre un array — el stale-cache puede tener el formato
    // viejo ({ data: [...] }) cuando el realtime invalida la query.
    response: Array.isArray(data) ? data : [],
    loading: isLoading,
  }
}
