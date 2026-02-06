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
      console.log('🚚 useGetEntregas - user:', user)
      console.log('🚚 useGetEntregas - user.id:', user?.id)
      console.log('🚚 useGetEntregas - filtros:', filtros)
      
      const response = await entregaProductoApi.list({
        fecha_desde: filtros.fecha_desde?.format('YYYY-MM-DD'),
        fecha_hasta: filtros.fecha_hasta?.format('YYYY-MM-DD'),
        estado_entrega: filtros.estado_entrega as any,
        // Filtrar solo entregas del despachador actual
        chofer_id: user?.id,
      })
      
      console.log('🚚 useGetEntregas - response:', response)
      console.log('🚚 useGetEntregas - response.data:', response.data)
      console.log('🚚 useGetEntregas - response.data?.data:', response.data?.data)
      
      return response.data?.data || []
    },
    enabled: !!user?.id,
  })

  console.log('🚚 useGetEntregas - data final:', data)
  console.log('🚚 useGetEntregas - isLoading:', isLoading)

  return {
    entregas: (data || []) as any[],
    loading: isLoading,
    error,
    refetch,
  }
}
