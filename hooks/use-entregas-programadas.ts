import { useQuery } from '@tanstack/react-query'
import { entregaProductoApi } from '~/lib/api/entrega-producto'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface UseEntregasProgramadasParams {
  fecha_desde?: string
  fecha_hasta?: string
  chofer_id?: string
  vehiculo_id?: number
  solo_programadas?: boolean
  enabled?: boolean
}

export function useEntregasProgramadas({
  fecha_desde,
  fecha_hasta,
  chofer_id,
  vehiculo_id,
  solo_programadas = true,
  enabled = true,
}: UseEntregasProgramadasParams = {}) {
  return useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'programadas', fecha_desde, fecha_hasta, chofer_id, vehiculo_id, solo_programadas],
    queryFn: async () => {

      const response = await entregaProductoApi.list({
        fecha_desde,
        fecha_hasta,
        chofer_id,
        vehiculo_id,
        // En el modal de programación usamos solo activas; en el calendario
        // general podemos incluir también las ya entregadas.
        solo_programadas,
        per_page: -1,
      })

      return response.data?.data || []
    },
    enabled,
  })
}
