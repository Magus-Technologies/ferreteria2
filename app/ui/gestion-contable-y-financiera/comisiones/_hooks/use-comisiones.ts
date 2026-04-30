import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import {
  comisionApi,
  FiltrosComision,
  RegistrarPagoPayload,
} from '~/lib/api/comision'

export function useComisionesPorVendedor(filtros: FiltrosComision) {
  return useQuery({
    queryKey: [QueryKeys.COMISIONES_POR_VENDEDOR, filtros],
    queryFn: async () => {
      const res = await comisionApi.porVendedor(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useComisionDetalleVendedor(
  userId: string | null,
  filtros: Omit<FiltrosComision, 'user_id'>
) {
  return useQuery({
    queryKey: [QueryKeys.COMISIONES_DETALLE_VENDEDOR, userId, filtros],
    queryFn: async () => {
      if (!userId) return null
      const res = await comisionApi.detalleVendedor(userId, filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    enabled: !!userId,
    // Siempre considerar stale para que al abrir el modal del detalle se
    // refresque (evita que después de pagar o crear una nueva venta el
    // modal muestre datos viejos cuando se reabre).
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useHistorialPagosComision(filtros: FiltrosComision) {
  return useQuery({
    queryKey: [QueryKeys.COMISIONES_HISTORIAL_PAGOS, filtros],
    queryFn: async () => {
      const res = await comisionApi.historialPagos(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
  })
}

export function useRegistrarPagoComision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RegistrarPagoPayload) => {
      const res = await comisionApi.registrarPago(payload)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_POR_VENDEDOR],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_HISTORIAL_PAGOS],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_DETALLE_VENDEDOR],
      })
    },
  })
}

export function useEliminarPagoComision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await comisionApi.eliminarPago(id)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_POR_VENDEDOR],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_HISTORIAL_PAGOS],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_DETALLE_VENDEDOR],
      })
    },
  })
}
