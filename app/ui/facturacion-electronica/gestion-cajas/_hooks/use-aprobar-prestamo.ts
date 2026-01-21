import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transaccionesCajaApi } from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { message } from 'antd'

export function useAprobarPrestamo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ prestamoId, subCajaOrigenId }: { prestamoId: string; subCajaOrigenId: number }) =>
      transaccionesCajaApi.aprobarPrestamo(prestamoId, subCajaOrigenId),
    onSuccess: (response) => {
      message.success(response?.data?.message || 'Préstamo aprobado exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRESTAMOS_PENDIENTES] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al aprobar préstamo')
    },
  })
}
