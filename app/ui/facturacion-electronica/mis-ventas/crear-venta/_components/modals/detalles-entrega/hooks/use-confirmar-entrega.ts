import { useCallback, useState } from 'react'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
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
  entrega_id: number
  almacen_salida_id: number
  grupo_entrega_id?: number | null
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
  // Invalidación explícita post-evento para que el botón principal y la tabla
  // de mis-entregas refresquen `cantidad_pendiente_detalle` y `estado_entrega`
  // recalculados por el backend. Sin esto, el snapshot cacheado seguía
  // mostrando "Configurar Entrega" aunque ya no quedara nada por programar.
  const queryClient = useQueryClient()

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
      // Incluir cantidades editadas en la tabla "Entregar" para que el backend
      // actualice `cantidad_entregada` y libere el pendiente cuando se reduce
      // la cantidad (ej: programado 10 → editado 5 → libera 5 a pendiente).
      // Sin esto, la DB conservaba el valor viejo y el modal de Confirmar
      // Entrega mostraba la cantidad programada original, no la editada.
      if (productosEntrega.length > 0) {
        payload.productos_entregados = productosEntrega.map((p) => ({
          unidad_derivada_venta_id: p.unidad_derivada_venta_id,
          cantidad_entregada: p.entregar,
        }))
      }
    } else if (tipoDespacho === 'Parcial') {
      // Despacho parcial — al confirmar marcamos lo de "ahora" como ENTREGADO
      // (lo programado se gestiona aparte como entrega futura).
      payload.estado_entrega = EstadoEntrega.ENTREGADO
      payload.quien_entrega = (quienEntregaParcial as QuienEntrega) || QuienEntrega.ALMACEN
      payload.productos_entregados = productosEntrega.map((p) => ({
        unidad_derivada_venta_id: p.unidad_derivada_venta_id,
        cantidad_entregada: p.entregar,
      }))
      if (v.observaciones) payload.observaciones = v.observaciones
    }

    setActualizandoEntrega(true)
    try {
      const response = await entregaProductoApi.update(mode.entregaId, payload)
      if (response.error) throw new Error(response.error.message || 'Error al actualizar entrega')

      // Parcial + programar resto: además de actualizar la entrega original
      // (que pasa a ENTREGADO), creamos una segunda entrega PROGRAMADA para
      // los productos que el usuario quiere despachar después con dirección
      // + fecha + chofer. Mismo patrón que el modo `crear-entrega-resto`.
      if (
        mode.kind === 'actualizar-entrega' &&
        tipoDespacho === 'Parcial' &&
        programarResto
      ) {
        const productosResto = productosEntrega.filter(
          (p) => p.entregar_programado > 0,
        )
        if (productosResto.length > 0) {
          // Necesitamos almacen_salida_id y user_id de la entrega origen.
          // Los pedimos al backend con un fetch corto (no agregamos al payload
          // del update porque este modo no los conoce de antemano).
          const entregaResp = await entregaProductoApi.getById(mode.entregaId)
          const entregaOrig: any = entregaResp.data?.data
          const restoFecha = form.getFieldValue('_resto_fecha_programada')
          const restoDireccion = form.getFieldValue('_resto_direccion_entrega')
          const restoReferencia = form.getFieldValue('_resto_referencia_entrega')
          const restoLat = form.getFieldValue('_resto_latitud')
          const restoLng = form.getFieldValue('_resto_longitud')
          const restoChofer = form.getFieldValue('_resto_despachador_id')
          const restoVehiculo = form.getFieldValue('_resto_vehiculo_id')
          const restoCargo = form.getFieldValue('_resto_cargo_destino')

          const payload2: CreateEntregaProductoRequest = {
            venta_id: entregaOrig?.venta_id,
            grupo_entrega_id: entregaOrig?.grupo_entrega_id || entregaOrig?.id,
            tipo_entrega: TipoEntrega.DESPACHO, // el despacho se programa a domicilio aunque el parcial original haya sido EnTienda
            tipo_despacho: TipoDespacho.PROGRAMADO,
            estado_entrega: EstadoEntrega.PENDIENTE,
            fecha_entrega: dayjs().format('YYYY-MM-DD'),
            almacen_salida_id: entregaOrig?.almacen_salida_id,
            user_id: entregaOrig?.user_id,
            quien_entrega: QuienEntrega.CHOFER,
            tipo_pedido: tipoPedidoResto,
            productos_entregados: productosResto.map((p) => ({
              unidad_derivada_venta_id: p.unidad_derivada_venta_id,
              cantidad_entregada: p.entregar_programado,
            })),
          }
          if (tipoPedidoResto === TipoPedido.INTERNO && restoChofer) {
            payload2.chofer_id = restoChofer
          }
          if (tipoPedidoResto === TipoPedido.EXTERNO && restoCargo) {
            payload2.cargo_destino = restoCargo
          }
          if (restoFecha) payload2.fecha_programada = dayjs(restoFecha).format('YYYY-MM-DD')
          if (horaInicioResto) payload2.hora_inicio = horaInicioResto
          if (horaFinResto) payload2.hora_fin = horaFinResto
          if (restoDireccion) payload2.direccion_entrega = restoDireccion
          if (restoReferencia) payload2.referencia_entrega = restoReferencia
          if (restoLat != null) payload2.latitud = Number(restoLat)
          if (restoLng != null) payload2.longitud = Number(restoLng)
          if (observacionesResto) payload2.observaciones = observacionesResto
          if (restoVehiculo) payload2.vehiculo_id = restoVehiculo

          const r2 = await entregaProductoApi.create(payload2)
          if (r2.error) {
            throw new Error(
              `Entrega actualizada, pero error al programar el resto: ${
                r2.error.message || 'desconocido'
              }`,
            )
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      onSuccess()
    } finally {
      setActualizandoEntrega(false)
    }
  }, [
    mode,
    form,
    tipoDespacho,
    quienEntregaParcial,
    programarResto,
    productosEntrega,
    horaInicioResto,
    horaFinResto,
    observacionesResto,
    tipoPedidoResto,
    onSuccess,
    queryClient,
  ])

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

    // Productos con algo que despachar ahora
    const cantidadParaDomicilio = (p: typeof productosEntrega[number]) =>
      p.entregar_programado > 0 ? p.entregar_programado : p.entregar
    const productosAhora = productosEntrega.filter((p) =>
      tipoDespacho === 'Domicilio' ? cantidadParaDomicilio(p) > 0 : p.entregar > 0,
    )

    if (productosAhora.length === 0) {
      throw new Error('No hay productos a entregar — revisa las cantidades')
    }

    // grupo_entrega_id: hereda de la madre o la usa directamente como raíz.
    // Si ninguno es positivo (primera entrega de la venta), se omite el campo
    // para que el backend use el id de la nueva entrega como grupo raíz.
    const grupoId = mode.entregaOrigen.grupo_entrega_id || mode.entregaOrigen.entrega_id || 0

    // Estado y logística de la hija
    const quienEntregaAhora: QuienEntrega =
      tipoDespacho === 'Domicilio'
        ? QuienEntrega.CHOFER
        : (quienEntregaParcial as QuienEntrega) ||
          (v.quien_entrega as QuienEntrega) ||
          QuienEntrega.ALMACEN

    const estadoHija: EstadoEntrega =
      quienEntregaAhora === QuienEntrega.CHOFER
        ? EstadoEntrega.EN_CAMINO   // chofer sale — confirma después
        : EstadoEntrega.ENTREGADO   // entrega en tienda — cierra ahora

  const tipoEntregaHija: TipoEntrega =
  tipoDespacho === 'EnTienda' ? TipoEntrega.RECOJO_EN_TIENDA
  : TipoEntrega.DESPACHO   // Domicilio o Parcial → la hija "ahora" en parcial va a tienda solo si el usuario lo indica explícitamente

    const tipoDespachoHija: TipoDespacho =
      quienEntregaAhora === QuienEntrega.CHOFER
        ? TipoDespacho.PROGRAMADO
        : TipoDespacho.INMEDIATO

    const payload: CreateEntregaProductoRequest = {
      venta_id: mode.ventaId,
      // Omitir grupo_entrega_id si no es positivo (primera entrega de la venta)
      ...(grupoId > 0 ? { grupo_entrega_id: grupoId } : {}),
      almacen_salida_id: mode.entregaOrigen.almacen_salida_id,
      user_id: mode.entregaOrigen.user_id,
      tipo_entrega: tipoEntregaHija,
      tipo_despacho: tipoDespachoHija,
      estado_entrega: estadoHija,
      fecha_entrega: dayjs().format('YYYY-MM-DD'),
      quien_entrega: quienEntregaAhora,
      productos_entregados: productosAhora.map((p) => ({
        unidad_derivada_venta_id: p.unidad_derivada_venta_id,
        cantidad_entregada:
          tipoDespacho === 'Domicilio' ? cantidadParaDomicilio(p) : p.entregar,
      })),
    }

    // Logística opcional
    if (v.despachador_id) payload.chofer_id = v.despachador_id
    if (v.vehiculo_id) payload.vehiculo_id = v.vehiculo_id
    if (v.tipo_pedido) payload.tipo_pedido = v.tipo_pedido as TipoPedido
    if (v.cargo_destino) payload.cargo_destino = v.cargo_destino
    if (v.fecha_programada) payload.fecha_programada = dayjs(v.fecha_programada).format('YYYY-MM-DD')
    if (v.hora_inicio) payload.hora_inicio = v.hora_inicio
    if (v.hora_fin) payload.hora_fin = v.hora_fin
    if (v.direccion_entrega) payload.direccion_entrega = v.direccion_entrega
    if (v.referencia_entrega) payload.referencia_entrega = v.referencia_entrega
    if (v.latitud != null) payload.latitud = Number(v.latitud)
    if (v.longitud != null) payload.longitud = Number(v.longitud)
    if (v.observaciones) payload.observaciones = v.observaciones

    setCreandoEntregaResto(true)
    try {
      const r1 = await entregaProductoApi.create(payload)
      if (r1.error) throw new Error(r1.error.message || 'Error al crear el despacho')

      // Parcial + programar resto → segunda hija PROGRAMADA para lo que queda
      if (tipoDespacho === 'Parcial' && programarResto) {
        const productosResto = productosEntrega.filter((p) => p.entregar_programado > 0)
        if (productosResto.length > 0) {
          const restoFecha = form.getFieldValue('_resto_fecha_programada')
          const payload2: CreateEntregaProductoRequest = {
            venta_id: mode.ventaId,
            grupo_entrega_id: grupoId,
            almacen_salida_id: mode.entregaOrigen.almacen_salida_id,
            user_id: mode.entregaOrigen.user_id,
            tipo_entrega: TipoEntrega.DESPACHO,
            tipo_despacho: TipoDespacho.PROGRAMADO,
            estado_entrega: EstadoEntrega.EN_CAMINO,
            fecha_entrega: dayjs().format('YYYY-MM-DD'),
            quien_entrega: QuienEntrega.CHOFER,
            tipo_pedido: tipoPedidoResto,
            productos_entregados: productosResto.map((p) => ({
              unidad_derivada_venta_id: p.unidad_derivada_venta_id,
              cantidad_entregada: p.entregar_programado,
            })),
          }
          const restoChofer = form.getFieldValue('_resto_despachador_id')
          const restoVehiculo = form.getFieldValue('_resto_vehiculo_id')
          const restoCargo = form.getFieldValue('_resto_cargo_destino')
          const restoDireccion = form.getFieldValue('_resto_direccion_entrega')
          const restoReferencia = form.getFieldValue('_resto_referencia_entrega')
          const restoLat = form.getFieldValue('_resto_latitud')
          const restoLng = form.getFieldValue('_resto_longitud')
          if (tipoPedidoResto === TipoPedido.INTERNO && restoChofer) payload2.chofer_id = restoChofer
          if (tipoPedidoResto === TipoPedido.EXTERNO && restoCargo) payload2.cargo_destino = restoCargo
          if (restoVehiculo) payload2.vehiculo_id = restoVehiculo
          if (restoFecha) payload2.fecha_programada = dayjs(restoFecha).format('YYYY-MM-DD')
          if (horaInicioResto) payload2.hora_inicio = horaInicioResto
          if (horaFinResto) payload2.hora_fin = horaFinResto
          if (restoDireccion) payload2.direccion_entrega = restoDireccion
          if (restoReferencia) payload2.referencia_entrega = restoReferencia
          if (restoLat != null) payload2.latitud = Number(restoLat)
          if (restoLng != null) payload2.longitud = Number(restoLng)
          if (observacionesResto) payload2.observaciones = observacionesResto

          const r2 = await entregaProductoApi.create(payload2)
          if (r2.error) {
            throw new Error(
              `Despacho creado, pero falló al programar el resto: ${r2.error.message || 'error desconocido'}`,
            )
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
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
    queryClient,
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
