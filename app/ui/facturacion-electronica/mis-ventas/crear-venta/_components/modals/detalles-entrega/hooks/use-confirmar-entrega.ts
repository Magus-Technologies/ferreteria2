import { useCallback, useState } from 'react'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import {
  entregaProductoApi,
  EstadoEntrega,
  QuienEntrega,
  TipoEntrega,
  TipoDespacho,
  TipoPedido,
  type CreateEntregaProductoRequest,
  type UpdateEntregaProductoRequest,
} from '~/lib/api/entrega-producto'
import useCreateVenta from '../../../../_hooks/use-create-venta'
import { useDetallesEntrega } from '../context'
import type { TipoDespachoUI } from '../types'

/**
 * Snapshot mínimo de la entrega "origen" de un restante — los datos que el
 * backend ya tenía y que el restante hereda (almacén de salida y user que
 * registró la venta).
 */
export interface EntregaOrigenResto {
  almacen_salida_id: number
  user_id: string
}

/**
 * Modo del modal — define qué pasa cuando el usuario presiona "Confirmar".
 *
 * - `crear-venta`: crea o edita una venta junto con su entrega (uso normal en
 *   `mis-ventas/crear-venta`). Es el comportamiento histórico del modal.
 * - `actualizar-entrega`: actualiza UNA entrega existente — usado al reusar
 *   este modal desde `mis-entregas` cuando la entrega aún está abierta.
 * - `crear-entrega-resto`: crea una NUEVA entrega para los productos que
 *   quedaron pendientes después de cerrar una entrega previa como `'en'`.
 *   La venta original ya existe (`ventaId`), y el restante hereda
 *   `almacen_salida_id` + `user_id` de la entrega origen.
 */
export type ModoConfirmar =
  | { kind: 'crear-venta'; ventaId?: string }
  | { kind: 'actualizar-entrega'; entregaId: number }
  | { kind: 'crear-entrega-resto'; ventaId: string; entregaOrigen: EntregaOrigenResto }

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
  // Modo CREAR-ENTREGA-RESTO — usado desde mis-entregas cuando la entrega
  // origen ya está cerrada como 'en' pero quedaron productos con
  // `cantidad_pendiente > 0`. Crea NUEVAS entregas (POST) sobre la misma
  // venta usando los productos del Provider y los datos del form según el
  // tipo de despacho elegido (EnTienda/Domicilio/Parcial).
  //
  // Caso especial Parcial + programar-resto activo: se crean DOS entregas:
  //   1. Entrega "ahora" — Parcial INMEDIATO ENTREGADO con `entregar`.
  //   2. Entrega "resto" — Despacho PROGRAMADO PENDIENTE con
  //      `entregar_programado`, fecha/hora/dirección/chofer del bloque resto.
  // Si la segunda llamada falla, la primera ya quedó creada — se reporta
  // el error pero no se hace rollback (el backend no expone un endpoint
  // transaccional para esto). Aceptable porque la inconsistencia es
  // detectable: la entrega ahora queda en `'en'` y `cantidad_pendiente > 0`.
  // ───────────────────────────────────────────────────────────────────────
  const [creandoEntregaResto, setCreandoEntregaResto] = useState(false)
  const handleConfirmarCrearEntregaResto = useCallback(async () => {
    if (mode.kind !== 'crear-entrega-resto') return
    const v = form.getFieldsValue()

    const tipoEntrega: TipoEntrega =
      tipoDespacho === 'EnTienda'
        ? TipoEntrega.RECOJO_EN_TIENDA
        : tipoDespacho === 'Domicilio'
        ? TipoEntrega.DESPACHO
        : TipoEntrega.PARCIAL

    // EnTienda y Parcial (la parte "ahora") se entregan al confirmar
    // (INMEDIATO + ENTREGADO). Domicilio sale a ruta (PROGRAMADO + EN_CAMINO).
    const tipoDespachoApi: TipoDespacho =
      tipoDespacho === 'Domicilio' ? TipoDespacho.PROGRAMADO : TipoDespacho.INMEDIATO
    const estadoEntrega: EstadoEntrega =
      tipoDespacho === 'Domicilio' ? EstadoEntrega.EN_CAMINO : EstadoEntrega.ENTREGADO

    // Productos a incluir según el tipo:
    //   - Domicilio: lo programado a entregar ahora (entregar_programado).
    //     En modo `tablaSimple`, la column def setea `entregar_programado`
    //     con el valor que el usuario tipea en la columna "Entregar".
    //   - EnTienda/Parcial: lo de "entregar" (entrega física al cliente).
    const productosFiltrados = productosEntrega.filter((p) =>
      tipoDespacho === 'Domicilio' ? p.entregar_programado > 0 : p.entregar > 0,
    )
    if (productosFiltrados.length === 0) {
      throw new Error('No hay productos a entregar — revisa las cantidades')
    }

    const payload1: CreateEntregaProductoRequest = {
      venta_id: mode.ventaId,
      tipo_entrega: tipoEntrega,
      tipo_despacho: tipoDespachoApi,
      estado_entrega: estadoEntrega,
      fecha_entrega: dayjs().format('YYYY-MM-DD'),
      almacen_salida_id: mode.entregaOrigen.almacen_salida_id,
      user_id: mode.entregaOrigen.user_id,
      productos_entregados: productosFiltrados.map((p) => ({
        unidad_derivada_venta_id: p.unidad_derivada_venta_id,
        cantidad_entregada:
          tipoDespacho === 'Domicilio' ? p.entregar_programado : p.entregar,
      })),
    }

    if (tipoDespacho === 'EnTienda') {
      payload1.quien_entrega = (v.quien_entrega as QuienEntrega) || QuienEntrega.ALMACEN
      if (v.observaciones) payload1.observaciones = v.observaciones
    } else if (tipoDespacho === 'Domicilio') {
      payload1.quien_entrega = QuienEntrega.CHOFER
      if (v.despachador_id) payload1.chofer_id = v.despachador_id
      if (v.tipo_pedido) payload1.tipo_pedido = v.tipo_pedido as TipoPedido
      if (v.cargo_destino) payload1.cargo_destino = v.cargo_destino
      if (v.fecha_programada) {
        payload1.fecha_programada = dayjs(v.fecha_programada).format('YYYY-MM-DD')
      }
      if (v.hora_inicio) payload1.hora_inicio = v.hora_inicio
      if (v.hora_fin) payload1.hora_fin = v.hora_fin
      if (v.direccion_entrega) payload1.direccion_entrega = v.direccion_entrega
      if (v.referencia_entrega) payload1.referencia_entrega = v.referencia_entrega
      if (v.latitud != null) payload1.latitud = Number(v.latitud)
      if (v.longitud != null) payload1.longitud = Number(v.longitud)
      if (v.observaciones) payload1.observaciones = v.observaciones
      if (v.vehiculo_id) payload1.vehiculo_id = v.vehiculo_id
    } else if (tipoDespacho === 'Parcial') {
      payload1.quien_entrega =
        (quienEntregaParcial as QuienEntrega) || QuienEntrega.ALMACEN
      if (v.observaciones) payload1.observaciones = v.observaciones
    }

    setCreandoEntregaResto(true)
    try {
      const r1 = await entregaProductoApi.create(payload1)
      if (r1.error) {
        throw new Error(r1.error.message || 'Error al crear entrega')
      }

      // ── Parcial + programar-resto: crear segunda entrega programada ──
      if (tipoDespacho === 'Parcial' && programarResto) {
        const productosResto = productosEntrega.filter((p) => p.entregar_programado > 0)
        if (productosResto.length > 0) {
          const restoFechaProgramada = form.getFieldValue('_resto_fecha_programada')
          const restoDireccion = form.getFieldValue('_resto_direccion_entrega')
          const restoReferencia = form.getFieldValue('_resto_referencia_entrega')
          const restoLatitud = form.getFieldValue('_resto_latitud')
          const restoLongitud = form.getFieldValue('_resto_longitud')
          const restoDespachadorId = form.getFieldValue('_resto_despachador_id')
          const restoVehiculoId = form.getFieldValue('_resto_vehiculo_id')
          const restoCargo = form.getFieldValue('_resto_cargo_destino')

          const payload2: CreateEntregaProductoRequest = {
            venta_id: mode.ventaId,
            // El "resto programado" siempre se modela como Despacho — tiene
            // dirección, fecha y chofer, igual que un domicilio normal.
            tipo_entrega: TipoEntrega.DESPACHO,
            tipo_despacho: TipoDespacho.PROGRAMADO,
            estado_entrega: EstadoEntrega.PENDIENTE,
            fecha_entrega: dayjs().format('YYYY-MM-DD'),
            almacen_salida_id: mode.entregaOrigen.almacen_salida_id,
            user_id: mode.entregaOrigen.user_id,
            quien_entrega: QuienEntrega.CHOFER,
            tipo_pedido: tipoPedidoResto,
            productos_entregados: productosResto.map((p) => ({
              unidad_derivada_venta_id: p.unidad_derivada_venta_id,
              cantidad_entregada: p.entregar_programado,
            })),
          }

          if (tipoPedidoResto === TipoPedido.INTERNO && restoDespachadorId) {
            payload2.chofer_id = restoDespachadorId
          }
          if (tipoPedidoResto === TipoPedido.EXTERNO && restoCargo) {
            payload2.cargo_destino = restoCargo
          }
          if (restoFechaProgramada) {
            payload2.fecha_programada = dayjs(restoFechaProgramada).format('YYYY-MM-DD')
          }
          if (horaInicioResto) payload2.hora_inicio = horaInicioResto
          if (horaFinResto) payload2.hora_fin = horaFinResto
          if (restoDireccion) payload2.direccion_entrega = restoDireccion
          if (restoReferencia) payload2.referencia_entrega = restoReferencia
          if (restoLatitud != null) payload2.latitud = Number(restoLatitud)
          if (restoLongitud != null) payload2.longitud = Number(restoLongitud)
          if (observacionesResto) payload2.observaciones = observacionesResto
          if (restoVehiculoId) payload2.vehiculo_id = restoVehiculoId

          const r2 = await entregaProductoApi.create(payload2)
          if (r2.error) {
            throw new Error(
              `Entrega de "ahora" creada, pero falló al programar resto: ${
                r2.error.message || 'error desconocido'
              }`,
            )
          }
        }
      }

      onSuccess()
    } finally {
      setCreandoEntregaResto(false)
    }
  }, [
    mode,
    form,
    tipoDespacho,
    productosEntrega,
    quienEntregaParcial,
    programarResto,
    horaInicioResto,
    horaFinResto,
    observacionesResto,
    tipoPedidoResto,
    onSuccess,
  ])

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

  // Selector del handler + loading flag según el modo activo.
  const handleConfirmar =
    mode.kind === 'crear-venta'
      ? handleConfirmarCrearVenta
      : mode.kind === 'actualizar-entrega'
      ? handleConfirmarActualizarEntrega
      : handleConfirmarCrearEntregaResto
  const loading =
    mode.kind === 'crear-venta'
      ? creandoVenta
      : mode.kind === 'actualizar-entrega'
      ? actualizandoEntrega
      : creandoEntregaResto

  return {
    handleConfirmar,
    handleOmitir,
    loading,
  }
}
