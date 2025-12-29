import { entregaProductoApi, EntregaProductoFilters } from '~/lib/api/entrega-producto'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useGetEntregas({
  filters,
}: {
  filters?: EntregaProductoFilters
}) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, filters],
    queryFn: async () => {
      const response = await entregaProductoApi.list(filters)
      return response.data
    },
    enabled: !!filters,
  })

  return {
    response: data?.data,
    loading: isLoading,
  }
}
