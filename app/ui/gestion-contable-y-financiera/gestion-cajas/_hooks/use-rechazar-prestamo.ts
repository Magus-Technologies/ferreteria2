import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { message } from 'antd'

export function useRechazarPrestamo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ prestamoId, motivo }: { prestamoId: string; motivo?: string }) =>
      transaccionesCajaApi.rechazarPrestamo(prestamoId, motivo),
    onSuccess: (response) => {
      message.success(response?.data?.message || 'Préstamo rechazado')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS_PENDIENTES] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al rechazar préstamo')
    },
  })
}
