import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosMisEntregas } from '../_store/store-filtros-mis-entregas'
import { useAuth } from '~/lib/auth-context'
import { entregaProductoApi } from '~/lib/api/entrega-producto'

export default function useGetEntregas() {
  const { filtros } = useStoreFiltrosMisEntregas()
  const { user } = useAuth()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, filtros, user?.id],
    queryFn: async () => {
      const response = await entregaProductoApi.list({
        fecha_desde: filtros.fecha_desde?.format('YYYY-MM-DD'),
        fecha_hasta: filtros.fecha_hasta?.format('YYYY-MM-DD'),
        estado_entrega: filtros.estado_entrega as any,
        // Filtrar solo entregas del despachador actual
        chofer_id: user?.id,
      })
      return response.data?.data || []
    },
    enabled: !!user?.id,
  })

  return {
    entregas: (data || []) as any[],
    loading: isLoading,
    error,
    refetch,
  }
}
