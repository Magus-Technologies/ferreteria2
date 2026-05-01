import { useCallback, useState } from 'react'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import {
  entregaProductoApi,
  EstadoEntrega,
  QuienEntrega,
  TipoPedido,
  type UpdateEntregaProductoRequest,
} from '~/lib/api/entrega-producto'
import useCreateVenta from '../../../../_hooks/use-create-venta'
import { useDetallesEntrega } from '../context'
import type { TipoDespachoUI } from '../types'

/**
 * Modo del modal — define qué pasa cuando el usuario presiona "Confirmar".
 *
 * - `crear-venta`: crea o edita una venta junto con su entrega (uso normal en
 *   `mis-ventas/crear-venta`). Es el comportamiento histórico del modal.
 * - `actualizar-entrega`: actualiza UNA entrega existente — usado al reusar
 *   este modal desde `mis-entregas`. Pendiente de implementar (Fase G).
 */
export type ModoConfirmar =
  | { kind: 'crear-venta'; ventaId?: string }
  | { kind: 'actualizar-entrega'; entregaId: number }

interface UseConfirmarEntregaParams {
  mode: ModoConfirmar
  form: FormInstance
  tipoDespacho: TipoDespachoUI
  /** Callback cuando el confirm se completa exitosamente — cierra el modal etc. */
  onSuccess: () => void
  /** Callback que se invoca cuando se omite la entrega (botón "Omitir"). */
  onOmitir?: () => void
}

/**
 * Hook que centraliza la lógica del botón "Confirmar" del modal.
 *
 * Hoy solo implementa el modo `crear-venta`. El modo `actualizar-entrega`
 * queda preparado pero falla con un error explícito hasta que se implemente.
 */
export function useConfirmarEntrega({
  mode,
  form,
  tipoDespacho,
  onSuccess,
  onOmitir,
}: UseConfirmarEntregaParams) {
  // Hook que crea/edita la venta — solo aplica al modo `crear-venta`.
  // En `actualizar-entrega` `ventaId` queda undefined y este hook no se usa.
  const ventaId = mode.kind === 'crear-venta' ? mode.ventaId : undefined
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta({ ventaId })

  // State del Provider — necesario para construir el payload del split parcial/domicilio.
  const {
    productosEntrega,
    quienEntregaParcial,
    programarResto,
    horaInicioResto,
    horaFinResto,
    observacionesResto,
    tipoPedidoResto,
  } = useDetallesEntrega()

  // ───────────────────────────────────────────────────────────────────────
  // Modo CREAR-VENTA — lógica histórica del modal (split parcial/domicilio).
  // ───────────────────────────────────────────────────────────────────────
  const handleConfirmarCrearVenta = useCallback(async () => {
    const ventaValues = form.getFieldsValue()

    if (tipoDespacho === 'Domicilio' && productosEntrega.length > 0) {
      // Domicilio con split: una entrega con solo entregar_programado.
      ventaValues.cantidades_parciales = productosEntrega.map((p) => ({
        producto_id: 0,
        producto_name: p.producto,
        producto_codigo: '',
        unidad_derivada_id: p.unidad_derivada_venta_id,
        unidad_derivada_name: '',
        total: p.total,
        entregado: 0,
        pendiente: p.total,
        entregar: 0,
        entregar_programado: p.entregar_programado,
      }))
    }

    if (tipoDespacho === 'Parcial') {
      // Inmediata: lo de "entregar". Programada: lo de "entregar_programado".
      // Resto = total − entregar − entregar_programado queda en cantidad_pendiente.
      ventaValues.cantidades_parciales = productosEntrega.map((p) => ({
        producto_id: 0,
        producto_name: p.producto,
        producto_codigo: '',
        unidad_derivada_id: p.unidad_derivada_venta_id,
        unidad_derivada_name: '',
        total: p.total,
        entregado: p.entregado,
        pendiente: p.pendiente,
        entregar: p.entregar,
        entregar_programado: p.entregar_programado,
      }))
      ventaValues.quien_entrega = quienEntregaParcial

      const totalProgramado = productosEntrega.reduce(
        (acc, p) => acc + p.entregar_programado,
        0,
      )
      const tieneResto = programarResto && totalProgramado > 0
      if (tieneResto) {
        const restoDespachadorId = form.getFieldValue('_resto_despachador_id')
        const restoFechaProgramada = form.getFieldValue('_resto_fecha_programada')
        const restoVehiculoId = form.getFieldValue('_resto_vehiculo_id')
        const restoDireccion = form.getFieldValue('_resto_direccion_entrega')
        const restoReferencia = form.getFieldValue('_resto_referencia_entrega')
        const restoLatitud = form.getFieldValue('_resto_latitud')
        const restoLongitud = form.getFieldValue('_resto_longitud')
        const restoCargo = form.getFieldValue('_resto_cargo_destino')

        ventaValues.parcial_resto_programado = {
          tipo_pedido: tipoPedidoResto,
          despachador_id:
            tipoPedidoResto === TipoPedido.INTERNO ? restoDespachadorId : undefined,
          cargo_destino:
            tipoPedidoResto === TipoPedido.EXTERNO ? restoCargo : undefined,
          fecha_programada: restoFechaProgramada
            ? dayjs(restoFechaProgramada).format('YYYY-MM-DD')
            : undefined,
          hora_inicio: horaInicioResto,
          hora_fin: horaFinResto,
          direccion_entrega: restoDireccion,
          referencia_entrega: restoReferencia,
          latitud: restoLatitud,
          longitud: restoLongitud,
          observaciones: observacionesResto,
          vehiculo_id: restoVehiculoId || undefined,
        }
      }
    }

    await crearVenta(ventaValues)
    onSuccess()
  }, [
    form,
    tipoDespacho,
    productosEntrega,
    quienEntregaParcial,
    programarResto,
    horaInicioResto,
    horaFinResto,
    observacionesResto,
    tipoPedidoResto,
    crearVenta,
    onSuccess,
  ])

  // ───────────────────────────────────────────────────────────────────────
  // Modo ACTUALIZAR-ENTREGA — usado al reusar el modal en mis-entregas.
  // Construye un payload de UpdateEntregaProductoRequest a partir del form
  // según el `tipoDespacho` y llama al endpoint PUT /entregas-productos/{id}.
  // ───────────────────────────────────────────────────────────────────────
  const [actualizandoEntrega, setActualizandoEntrega] = useState(false)
  const handleConfirmarActualizarEntrega = useCallback(async () => {
    if (mode.kind !== 'actualizar-entrega') return
    const v = form.getFieldsValue()
    const payload: UpdateEntregaProductoRequest = {}

    if (tipoDespacho === 'EnTienda') {
      // Marcar como entregado — el cliente está físicamente en tienda.
      payload.estado_entrega = EstadoEntrega.ENTREGADO
      payload.quien_entrega = (v.quien_entrega as QuienEntrega) || QuienEntrega.ALMACEN
      if (v.observaciones) payload.observaciones = v.observaciones
    } else if (tipoDespacho === 'Domicilio') {
      // Despacho a domicilio — pasa a EN_CAMINO con todos los datos del viaje.
      payload.estado_entrega = EstadoEntrega.EN_CAMINO
      payload.quien_entrega = QuienEntrega.CHOFER
      if (v.despachador_id) payload.chofer_id = v.despachador_id
      if (v.tipo_pedido) payload.tipo_pedido = v.tipo_pedido as TipoPedido
      if (v.cargo_destino) payload.cargo_destino = v.cargo_destino
      if (v.fecha_programada) {
        payload.fecha_programada = dayjs(v.fecha_programada).format('YYYY-MM-DD')
      }
      if (v.hora_inicio) payload.hora_inicio = v.hora_inicio
      if (v.hora_fin) payload.hora_fin = v.hora_fin
      if (v.direccion_entrega) payload.direccion_entrega = v.direccion_entrega
      if (v.referencia_entrega) payload.referencia_entrega = v.referencia_entrega
      if (v.latitud != null) payload.latitud = Number(v.latitud)
      if (v.longitud != null) payload.longitud = Number(v.longitud)
      if (v.observaciones) payload.observaciones = v.observaciones
      if (v.vehiculo_id) payload.vehiculo_id = v.vehiculo_id
    } else if (tipoDespacho === 'Parcial') {
      // Despacho parcial — al confirmar marcamos lo de "ahora" como ENTREGADO
      // (lo programado se gestiona aparte como entrega futura).
      payload.estado_entrega = EstadoEntrega.ENTREGADO
      payload.quien_entrega = (quienEntregaParcial as QuienEntrega) || QuienEntrega.ALMACEN
      if (v.observaciones) payload.observaciones = v.observaciones
    }

    setActualizandoEntrega(true)
    try {
      const response = await entregaProductoApi.update(mode.entregaId, payload)
      if (response.error) throw new Error(response.error.message || 'Error al actualizar entrega')
      onSuccess()
    } finally {
      setActualizandoEntrega(false)
    }
  }, [mode, form, tipoDespacho, quienEntregaParcial, onSuccess])

  // ───────────────────────────────────────────────────────────────────────
  // Botón "Omitir" — solo aplica en modo crear-venta. Crea la venta sin
  // generar la entrega (deja `cantidad_pendiente` para programarse luego).
  // ───────────────────────────────────────────────────────────────────────
  const handleOmitir = useCallback(async () => {
    if (mode.kind !== 'crear-venta') return
    const ventaValues = form.getFieldsValue()
    await crearVenta({ ...ventaValues, _omitir_entrega: true })
    onOmitir?.()
  }, [mode.kind, form, crearVenta, onOmitir])

  return {
    handleConfirmar:
      mode.kind === 'crear-venta'
        ? handleConfirmarCrearVenta
        : handleConfirmarActualizarEntrega,
    handleOmitir,
    loading: mode.kind === 'crear-venta' ? creandoVenta : actualizandoEntrega,
  }
}
