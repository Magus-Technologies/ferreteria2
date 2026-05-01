'use client'

import { useEffect } from 'react'
import { Form } from 'antd'
import useApp from 'antd/es/app/useApp'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'
import ModalDetallesEntrega from '../../../mis-ventas/crear-venta/_components/modals/modal-detalles-entrega'
import type {
  TipoDespachoUI,
  SeccionOcultable,
} from '../../../mis-ventas/crear-venta/_components/modals/detalles-entrega/types'

interface ModalEntregaUpdateProps {
  open: boolean
  setOpen: (open: boolean) => void
  entrega?: any
  onSuccess?: () => void
}

/**
 * Wrapper que reusa `<ModalDetallesEntrega>` (refactorizado en
 * `mis-ventas/crear-venta`) para ACTUALIZAR una entrega existente desde
 * `mis-entregas`. Reemplaza los modales viejos `ModalMarcarEntregada`,
 * `ModalEntregarParcial` y la acción "Despachar" del `ModalDespachoEntrega`.
 *
 * Mapea `entrega.tipo_entrega` (`rt`|`de`|`pa`) al `tipoDespachoUI` del
 * modal y configura `ocultar` para esconder las piezas que no aplican al
 * actualizar (botón Omitir, tabla de productos editable, programar resto).
 */
export default function ModalEntregaUpdate({
  open,
  setOpen,
  entrega,
  onSuccess,
}: ModalEntregaUpdateProps) {
  const [form] = Form.useForm()
  const { message } = useApp()
  const queryClient = useQueryClient()

  // Pre-llenar el form con los valores actuales de la entrega cada vez
  // que se abre el modal o cambia la entrega.
  useEffect(() => {
    if (!open || !entrega) return

    form.setFieldsValue({
      quien_entrega: entrega.quien_entrega || 'almacen',
      observaciones: entrega.observaciones || '',
      // Domicilio
      despachador_id: entrega.chofer_id || undefined,
      tipo_pedido: entrega.tipo_pedido || 'interno',
      cargo_destino: entrega.cargo_destino || undefined,
      fecha_programada: entrega.fecha_programada
        ? dayjs(entrega.fecha_programada).format('YYYY-MM-DD')
        : undefined,
      hora_inicio: entrega.hora_inicio || undefined,
      hora_fin: entrega.hora_fin || undefined,
      direccion_entrega: entrega.direccion_entrega || '',
      referencia_entrega: entrega.referencia_entrega || '',
      latitud: entrega.latitud != null ? Number(entrega.latitud) : undefined,
      longitud: entrega.longitud != null ? Number(entrega.longitud) : undefined,
      vehiculo_id: entrega.vehiculo_id || undefined,
    })
  }, [open, entrega, form])

  if (!entrega) return null

  // Mapeo `tipo_entrega` (API) → `tipoDespachoUI` (modal).
  const tipoDespacho: TipoDespachoUI =
    entrega.tipo_entrega === 'rt'
      ? 'EnTienda'
      : entrega.tipo_entrega === 'de'
      ? 'Domicilio'
      : 'Parcial'

  // Secciones que NO aplican al actualizar una entrega ya creada.
  // - `omitir`: el botón "Omitir" solo tiene sentido al crear.
  // - `tabla-productos`: los productos ya quedaron fijados al crearse la entrega.
  // - `programar-resto`: el resto se programa al crear la venta, no aquí.
  const ocultar: SeccionOcultable[] = ['omitir', 'programar-resto']

  return (
    <ModalDetallesEntrega
      open={open}
      setOpen={setOpen}
      form={form}
      tipoDespacho={tipoDespacho}
      ocultar={ocultar}
      clienteNombre={entrega.venta?.cliente?.razon_social || entrega.venta?.cliente?.nombres}
      direccion={entrega.direccion_entrega || ''}
      onConfirmar={() => {
        message.success('Entrega actualizada')
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
        onSuccess?.()
      }}
      onEditarCliente={() => {
        message.info('Edita el cliente desde la venta original')
      }}
    />
  )
}
