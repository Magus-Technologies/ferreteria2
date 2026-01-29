import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  transaccionesCajaApi,
  type CrearPrestamoRequest,
} from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCrearPrestamo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CrearPrestamoRequest) =>
      transaccionesCajaApi.crearPrestamo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
    },
  })
}

export default useCrearPrestamo
