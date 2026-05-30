import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { entregasNuevasApi } from '~/lib/api/entregas'
import { invalidarEntregaYVenta } from '../_lib/invalidar-entrega-venta'

export default function useAccionesEntrega(ventaId: string | undefined) {
  const { message } = App.useApp()
  const qc = useQueryClient()

  // Invalida entregas + ventas (la entrega cambia la cobertura de la venta).
  // Ver invalidarEntregaYVenta para el porqué del staleTime.
  const invalidar = () => invalidarEntregaYVenta(qc)

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

  const crear = useMutation({
    mutationFn: (data: Parameters<typeof entregasNuevasApi.crear>[0]) =>
      entregasNuevasApi.crear(data),
    onSuccess: () => { message.success('Entrega creada'); invalidar() },
    onError: (e: any) => message.error(e?.message ?? 'Error al crear entrega'),
  })

  return { confirmar, enCamino, anular, reasignar, crear }
}
