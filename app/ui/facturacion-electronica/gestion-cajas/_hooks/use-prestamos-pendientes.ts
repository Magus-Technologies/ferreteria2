import { useQuery } from '@tanstack/react-query'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function usePrestamosPendientes() {
  return useQuery({
    queryKey: [QueryKeys.PRESTAMOS_PENDIENTES],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getPrestamosPendientes()
      return response.data
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })
}
