import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { useStoreFiltrosMisEntregas } from '../_store/store-filtros-mis-entregas'

export default function useResumenVentas() {
  const { filtros } = useStoreFiltrosMisEntregas()

  const apiParams = {
    fecha_desde: filtros.fecha_desde?.format('YYYY-MM-DD'),
    fecha_hasta: filtros.fecha_hasta?.format('YYYY-MM-DD'),
    search: filtros.search,
  }

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'resumen-ventas', apiParams],
    queryFn: () => entregasNuevasApi.resumenVentas(apiParams),
    select: (res) => res.data?.data ?? [],
  })

  return {
    ventas: data ?? [],
    loading: isFetching,
    error,
    refetch,
  }
}
