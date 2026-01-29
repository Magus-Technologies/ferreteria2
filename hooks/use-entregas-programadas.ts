import { useQuery } from '@tanstack/react-query'
import { entregaProductoApi, EstadoEntrega } from '~/lib/api/entrega-producto'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface UseEntregasProgramadasParams {
  fecha_desde?: string
  fecha_hasta?: string
  chofer_id?: string
  enabled?: boolean
}

export function useEntregasProgramadas({
  fecha_desde,
  fecha_hasta,
  chofer_id,
  enabled = true,
}: UseEntregasProgramadasParams = {}) {
  return useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'programadas', fecha_desde, fecha_hasta, chofer_id],
    queryFn: async () => {
      const response = await entregaProductoApi.list({
        fecha_desde,
        fecha_hasta,
        chofer_id,
        estado_entrega: EstadoEntrega.PENDIENTE,
        per_page: -1, // Traer todas
      })
      return response.data?.data || []
    },
    enabled,
  })
}
