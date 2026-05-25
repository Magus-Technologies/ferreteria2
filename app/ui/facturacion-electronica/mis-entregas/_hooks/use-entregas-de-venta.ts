import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregasNuevasApi } from '~/lib/api/entregas'

export default function useEntregasDeVenta(ventaId: string | undefined) {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaId],
    queryFn: () => entregasNuevasApi.porVenta(ventaId!),
    enabled: !!ventaId,
    select: (res) => res.data ?? [],
  })

  return {
    entregas: data ?? [],
    loading: isFetching,
    error,
    refetch,
  }
}
