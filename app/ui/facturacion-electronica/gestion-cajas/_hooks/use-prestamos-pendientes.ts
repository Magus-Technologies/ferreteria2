import { useQuery } from '@tanstack/react-query'
import { transaccionesCajaApi, type Prestamo } from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function usePrestamosPendientes() {
  return useQuery({
    queryKey: [QueryKeys.PRESTAMOS_PENDIENTES],
    queryFn: async () => {
      const response = await transaccionesCajaApi.getPrestamosPendientes()
      // response.data es { success: boolean; data: Prestamo[] }
      // Devolver directamente el array de préstamos
      return response.data?.data || []
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })
}
