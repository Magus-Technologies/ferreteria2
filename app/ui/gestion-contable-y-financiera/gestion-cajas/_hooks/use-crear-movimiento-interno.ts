import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  transaccionesCajaApi,
  type CrearMovimientoInternoRequest,
} from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCrearMovimientoInterno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CrearMovimientoInternoRequest) =>
      transaccionesCajaApi.crearMovimientoInterno(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
    },
  })
}

export default useCrearMovimientoInterno
