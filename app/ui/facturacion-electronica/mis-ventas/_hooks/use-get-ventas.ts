import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi, type VentaFilters } from '~/lib/api/venta'

export default function useGetVentas({
  where,
}: {
  where?: VentaFilters
}) {
  const { data, isFetching } = useQuery({
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

  // "Todos" (sin estado) ahora muestra TODOS los estados, incluidos En Espera y
  // Anulado. La lista no se filtra en el front; los totales (total-ventas /
  // cards) son los que excluyen los estados que no son ventas finalizadas.
  const rows = data?.data

  return {
    response: rows,
    // isFetching (no isLoading): muestra el overlay "Cargando..." en cada búsqueda,
    // no solo la primera — el cliente lo pidió para que siempre se vea feedback al Buscar.
    loading: isFetching,
  }
}
