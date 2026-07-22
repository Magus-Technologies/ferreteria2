import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  transaccionesCajaApi,
  type CrearMovimientoInternoRequest,
} from '~/lib/api/transacciones-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCrearMovimientoInterno() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CrearMovimientoInternoRequest) => {
      // apiRequest NO lanza en errores HTTP: devuelve { error }. Sin este check,
      // la mutación "resolvía" igual y el modal mostraba "Movimiento realizado
      // exitosamente" aunque el backend lo hubiera rechazado (saldo insuficiente,
      // caja no abierta, validación) — sin mover ni un sol.
      const res = await transaccionesCajaApi.crearMovimientoInterno(data)
      if (res.error) {
        throw new Error(res.error.message)
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SUB_CAJAS] })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.MOVIMIENTOS_INTERNOS] })
    },
  })
}

export default useCrearMovimientoInterno
