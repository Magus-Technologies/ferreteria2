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

  // Si el usuario NO eligió un estado en el filtro, ocultar "En Espera"
  // (defensivo, por si el backend en producción no aplica ese exclude por defecto).
  const rows = data?.data
  const responseFiltrada =
    Array.isArray(rows) && !where?.estado_de_venta
      ? rows.filter((v: any) => v.estado_de_venta !== 'ee')
      : rows

  return {
    response: responseFiltrada,
    // isFetching (no isLoading): muestra el overlay "Cargando..." en cada búsqueda,
    // no solo la primera — el cliente lo pidió para que siempre se vea feedback al Buscar.
    loading: isFetching,
  }
}
