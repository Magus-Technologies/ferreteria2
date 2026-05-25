import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { entregasNuevasApi } from '~/lib/api/entregas'

export default function useAccionesEntrega(ventaId: string | undefined) {
  const { message } = App.useApp()
  const qc = useQueryClient()

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaId] })
    qc.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'resumen-ventas'] })
  }

  const confirmar = useMutation({
    mutationFn: (id: number) => entregasNuevasApi.confirmar(id),
    onSuccess: () => { message.success('Entrega confirmada'); invalidar() },
    onError: (e: any) => message.error(e?.message ?? 'Error al confirmar'),
  })

  const enCamino = useMutation({
    mutationFn: (id: number) => entregasNuevasApi.enCamino(id),
    onSuccess: () => { message.success('Entrega marcada en camino'); invalidar() },
    onError: (e: any) => message.error(e?.message ?? 'Error'),
  })

  const anular = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      entregasNuevasApi.anular(id, motivo),
    onSuccess: () => { message.success('Entrega anulada'); invalidar() },
    onError: (e: any) => message.error(e?.message ?? 'Error al anular'),
  })

  const reasignar = useMutation({
    mutationFn: ({
      id,
      choferId,
      vehiculoId,
    }: {
      id: number
      choferId: string
      vehiculoId?: number | null
    }) => entregasNuevasApi.reasignarChofer(id, choferId, vehiculoId),
    onSuccess: () => { message.success('Chofer reasignado'); invalidar() },
    onError: (e: any) => message.error(e?.message ?? 'Error al reasignar'),
  })

  return { confirmar, enCamino, anular, reasignar }
}
