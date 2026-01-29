import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi, type VentaFilters } from '~/lib/api/venta'

export default function useGetVentas({
  where,
}: {
  where?: VentaFilters
}) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS, where],
    queryFn: async () => {
      // Usar la API de Laravel en lugar del action de Prisma
      const response = await ventaApi.list(where)
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data
    },
    // Siempre habilitado, si no hay filtros se cargan todas las ventas
  })

  return {
    response: data?.data,
    loading: isLoading,
  }
}
