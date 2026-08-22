import { FormCreateVenta } from '../_components/others/body-vender'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import { useAuth } from '~/lib/auth-context'
import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  TipoDocumento,
  TipoDespachoVenta,
  FormaDePago,
  TipoMoneda,
  EstadoDeVenta,
  type CreateVentaRequest,
  type ProductoVentaRequest,
  ventaApi
} from '~/lib/api/venta'
import { ventaEvents } from './venta-events'
import { extractDesplieguePagoId } from '~/lib/utils/despliegue-pago-utils'
import {
  entregaProductoApi,
  TipoEntrega,
  TipoDespacho,
  EstadoEntrega,
  QuienEntrega,
  TipoPedido,
  type CreateEntregaProductoRequest,
  type UpdateEntregaProductoRequest,
  type ProductoEntregadoRequest,
} from '~/lib/api/entrega-producto'
import { entregasNuevasApi, type EntregaNueva } from '~/lib/api/entregas'
import { fcmApi } from '~/lib/api/fcm'
import { clienteApi, TipoDireccion, TipoCliente } from '~/lib/api/cliente'
import { LEGACY_CLIENTE_DIRECCION_ID_FIELDS } from '~/lib/utils/cliente-direcciones-form'
import dayjs from 'dayjs'
 import { cajaApi } from '~/lib/api/caja'
import { fechaSubmit } from '~/utils/fechas'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreProductoAgregadoVenta } from '../_store/store-producto-agregado-venta'
import { useStoreEntregaPendiente } from '../_store/store-entrega-pendiente'

type ProductoAgrupado = Pick<
  FormCreateVenta['productos'][number],
  'producto_id' | 'marca_name' | 'producto_name'
> & {
  paquete_id?: number
  paquete_nombre?: string
  costo?: number
  unidades_derivadas: Array<
    Omit<
      FormCreateVenta['productos'][number],
      '_row_id' | 'producto_id' | 'marca_name' | 'producto_name' | 'subtotal'
    >
  >
}

export function agruparProductos({
  productos,
}: {
  productos: FormCreateVenta['productos']
}) {
  // Agrupar por producto_id + paquete_id para que el mismo producto
  // en un paquete no se mezcle con el mismo producto suelto
  const mapa = new Map<string, ProductoAgrupado>()
  for (const p of productos) {
    const key = `${p.producto_id}-${p.paquete_id || 0}`
    if (!mapa.has(key)) {
      mapa.set(key, {
        producto_id: p.producto_id,
        marca_name: p.marca_name,
        producto_name: p.producto_name,
        paquete_id: p.paquete_id,
        paquete_nombre: p.paquete_nombre,
        costo: p.costo,
        unidades_derivadas: [],
      })
    }
    const grupo = mapa.get(key)!
    grupo.unidades_derivadas.push({
      cantidad: p.cantidad,
      unidad_derivada_id: p.unidad_derivada_id,
      unidad_derivada_name: p.unidad_derivada_name,
      unidad_derivada_factor: p.unidad_derivada_factor,
      precio_venta: p.precio_venta,
      recargo: p.recargo,
      descuento: p.descuento,
      descuento_tipo: p.descuento_tipo,
      producto_codigo: p.producto_codigo,
      comision: p.comision,
      _cantidad_reservada: p._cantidad_reservada,
      _unidad_reserva_id: p._unidad_reserva_id,
    })
  }
  return Array.from(mapa.values())
}

/**
 * Claves que el modal de entrega deja listas (store-entrega-pendiente) y que el
 * submit toma de ahí. Todo lo demás —pago, cliente, productos, estado— sale
 * del form vivo, nunca de la foto que tomó el modal.
 */
const CLAVES_ENTREGA_PENDIENTE = [
  'tipo_despacho',
  'despachador_id',
  'fecha_programada',
  'hora_inicio',
  'hora_fin',
  'direccion_entrega',
  'referencia_entrega',
  'latitud',
  'longitud',
  'observaciones',
  'quien_entrega',
  'cantidades_parciales',
  'parcial_resto_programado',
  'tipo_pedido',
  'cargo_destino',
  'vehiculo_id',
] as const

/**
 * Entrega de la venta que todavía se puede reprogramar.
 *
 * Toda venta nace con una entrega —"recojo en tienda" por defecto, o la que se
 * programó al crearla— y esa entrega ya tiene asignadas todas las unidades. Al
 * editar el despacho hay que MODIFICAR esa misma; crear una segunda por las
 * mismas cantidades la rechaza el backend ("la cantidad entregada no puede ser
 * mayor a la cantidad pendiente (0)"). Eso era lo que pasaba al editar: la
 * venta se guardaba, la advertencia pasaba desapercibida y el chofer, el
 * vehículo y el horario recién cargados nunca llegaban a la base.
 *
 * Solo cuenta la que sigue PENDIENTE: una entrega en camino o entregada ya no
 * se reprograma desde acá. Si hay varias pendientes (ventas parciales) se
 * prefiere la que ya es a domicilio.
 */
async function buscarEntregaReprogramable(ventaId: string): Promise<EntregaNueva | null> {
  const resp = await entregasNuevasApi.porVenta(ventaId)
  const lista = ((resp.data as any)?.data ?? resp.data) as EntregaNueva[] | undefined
  if (!Array.isArray(lista)) return null
  const pendientes = lista.filter((e) => e.estado_entrega_codigo === 'pe')
  return pendientes.find((e) => e.tipo_entrega_codigo === 'de') ?? pendientes[0] ?? null
}

/** "19:30:00" (columna TIME) → "19:30", que es lo que valida el backend. */
const horaHHmm = (v?: string | null) => (v ? String(v).slice(0, 5) : null)

/**
 * Convierte el payload de creación en el de reprogramación de la entrega que
 * ya existe. Lo que en la creación simplemente se omite acá va como `null` a
 * propósito: el backend solo escribe las claves que llegan, así que sin el
 * null quitar el chofer o la referencia dejaría el valor viejo.
 *
 * No lleva `estado_entrega`: la entrega sigue pendiente. Sí lleva las
 * cantidades de TODAS las unidades de la venta, incluidas las que van en 0:
 * en un split ("de estas 4, 2 van a domicilio") el backend reescribe el
 * detalle con lo nuevo comprometido y el resto vuelve a quedar pendiente
 * para otra entrega, igual que cuando la venta se crea con ese split.
 */
function aPayloadReprogramacion(
  d: CreateEntregaProductoRequest,
  productos: ProductoEntregadoRequest[],
): UpdateEntregaProductoRequest {
  return {
    productos_entregados: productos,
    tipo_entrega: d.tipo_entrega,
    tipo_despacho: d.tipo_despacho,
    quien_entrega: d.quien_entrega,
    chofer_id: d.chofer_id ?? null,
    vehiculo_id: d.vehiculo_id ?? null,
    fecha_programada: d.fecha_programada ?? null,
    hora_inicio: horaHHmm(d.hora_inicio),
    hora_fin: horaHHmm(d.hora_fin),
    direccion_entrega: d.direccion_entrega ?? null,
    referencia_entrega: d.referencia_entrega ?? null,
    latitud: d.latitud ?? null,
    longitud: d.longitud ?? null,
    observaciones: d.observaciones ?? null,
    tipo_pedido: d.tipo_pedido ? (String(d.tipo_pedido).toLowerCase() as TipoPedido) : undefined,
    cargo_destino: d.cargo_destino ?? null,
  }
}

export default function useCreateVenta({
  ventaId,
  onMissingApertura,
}: {
  ventaId?: string
  onMissingApertura?: () => void
} = {}) {
  const router = useRouter()
  const { user } = useAuth()
  const user_id = user?.id
  const { notification, message } = useApp()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)
  const queryClient = useQueryClient()
  const isEditing = !!ventaId

  const handleSubmit = useCallback(async (values: FormCreateVenta) => {
    if (submittingRef.current) return

    // Entrega programada desde el modal en modo "solo registrar" (edición de una
    // venta existente): el modal no guardó, dejó el payload esperando acá. Trae
    // `cantidades_parciales` y la configuración de la entrega, que es lo que más
    // abajo decide si la entrega se toca o se deja intacta. Ver
    // store-entrega-pendiente.ts.
    //
    // Se copian SOLO las claves de la entrega, y solo las que traen valor. El
    // modal toma su foto del form al confirmarse; si se confirmó ANTES de
    // cambiar el método de pago, esa foto trae `diferencia_pago: undefined`, y
    // fusionarla entera encima de los valores del form pisaba con undefined el
    // cambio de método que el vendedor acababa de hacer: el pago nunca llegaba
    // al backend.
    const entregaPendiente = useStoreEntregaPendiente.getState().valores
    const entregaProgramadaExplicita = !!entregaPendiente
    if (entregaPendiente) {
      const fusionado: Record<string, any> = { ...values }
      for (const clave of CLAVES_ENTREGA_PENDIENTE) {
        if (entregaPendiente[clave] !== undefined) fusionado[clave] = entregaPendiente[clave]
      }
      values = fusionado as FormCreateVenta
    }
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })

    submittingRef.current = true
    setLoading(true)

    try {
    const esEnEspera = values.estado_de_venta === EstadoDeVenta.EN_ESPERA
    const valesExcluidos = useStoreProductoAgregadoVenta.getState().valesExcluidos

    // Validar apertura de caja solo para ventas finalizadas (no para "en espera").
    // NO se valida que la apertura sea del mismo día: el cliente puede aperturar
    // y cerrar con varios días de diferencia según su operación.
    if (!esEnEspera) {
      try {
        const cajaResponse = await cajaApi.cajaActiva()
        const cajaActiva = cajaResponse.data?.data

        if (!cajaActiva) {
          onMissingApertura?.()
          return
        }
      } catch (error) {
        console.error('Error al validar apertura:', error)
        onMissingApertura?.()
        return
      }
    }

    // Los `_cliente_direccion_*` solo viven en el form para pintar el
    // selector D1/D2/D3/D4 — el backend recibe únicamente la `direccion`
    // efectiva y la `direccion_seleccionada`. Se desestructuran y descartan
    // antes del `...restValues` para que no lleguen al payload.
    const {
      _cliente_direccion_1: _d1Ignored,
      _cliente_direccion_2: _d2Ignored,
      _cliente_direccion_3: _d3Ignored,
      _cliente_direccion_4: _d4Ignored,
      _cliente_direccion_id_1: _cid1Ignored,
      _cliente_direccion_id_2: _cid2Ignored,
      _cliente_direccion_id_3: _cid3Ignored,
      _cliente_direccion_id_4: _cid4Ignored,
      cliente_nombre,
      productos,
      tipo_de_cambio,
      tipo_moneda,
      estado_de_venta,
      cliente_id,
      recomendado_por_id,
      metodos_de_pago,
      diferencia_pago,
      direccion,
      direccion_seleccionada,
      ruc_dni,
      telefono,
      // Slots de teléfono (Cel 1 / Cel 2) — registrados como campos ocultos.
      // Se desestructuran para reconstruir ambos teléfonos y NO contaminar
      // el payload de la venta (que no guarda teléfono).
      telefono_seleccionado,
      _cliente_telefono_1,
      _cliente_telefono_2,
      email,
      // Extraer campos de crédito
      numero_dias,
      fecha_vencimiento,
      // ✅ Extraer datos de entrega
      tipo_despacho,
      despachador_id,
      fecha_programada,
      hora_inicio,
      hora_fin,
      direccion_entrega,
      referencia_entrega,
      latitud,
      longitud,
      observaciones,
      quien_entrega,
      cantidades_parciales,
      parcial_resto_programado,
      _omitir_entrega: _omitir_entrega_form,
      descontar_stock,
      stock_ya_aplicado,
      cotizacion_id,
      codigo_vale,
      tipo_pedido,
      cargo_destino,
      vehiculo_id,
      ...restValues
    } = values

    // `_omitir_entrega` solo se activa con el botón "Omitir" del modal de
    // detalles-entrega — significa "no creo entrega, queda pendiente para
    // programar después".
    //
    // `descontar_stock = 'no'` es DISTINTO: el cliente ya tiene el producto
    // (se llevó algo previamente, consumo interno, etc). En ese caso SÍ se
    // crea la entrega pero como YA ENTREGADA, sin tocar stock. El backend
    // distingue ambos casos vía `descontar_stock` en el payload.
    // Cuando el usuario elige "Omitir Entrega" en el selector de tipo de
    // despacho, se trata igual que presionar "Omitir" en el modal de entrega.
    const _omitir_entrega = _omitir_entrega_form || tipo_despacho === 'Omitir'



    // Filtrar cabeceras de paquete y vales promocionales (son solo UI) y separar productos y servicios
    const productosReales = (productos || []).filter(p => p._tipo_fila !== 'paquete_cabecera' && p._tipo_fila !== 'vale_promocional')
    const soloProductos = productosReales.filter(p => p._tipo !== 'servicio')
    const soloServicios = productosReales.filter(p => p._tipo === 'servicio')

    if (soloProductos.length === 0 && soloServicios.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto o servicio',
      })

    // IMPORTANTE: Laravel backend permite cliente_id nullable para Boleta/NV
    // Si no hay cliente, el backend usará automáticamente "CLIENTE VARIOS" (DNI: 99999999)
    // Para Factura, SÍ requerir selección manual de cliente

    if (!esEnEspera && !cliente_id && restValues.tipo_documento === '01') {
      return notification.error({
        message: 'Por favor, selecciona un cliente',
        description: 'Las facturas requieren obligatoriamente un cliente registrado.',
      })
    }

    // Validar cliente obligatorio para ventas a crédito
    if (!esEnEspera && !cliente_id && restValues.forma_de_pago === FormaDePago.CREDITO) {
      return notification.error({
        message: 'Por favor, selecciona un cliente',
        description: 'Las ventas a crédito requieren obligatoriamente un cliente registrado.',
      })
    }

    // Para Boleta/NV: si el usuario escribió un nombre sin seleccionar cliente, auto-crear
    let clienteIdFinal = cliente_id || undefined
    if (!cliente_id && !esEnEspera && restValues.tipo_documento !== '01' && restValues.forma_de_pago !== FormaDePago.CREDITO) {
      const nombreCompleto = (cliente_nombre as string | undefined)?.trim()
      if (nombreCompleto) {
        try {
          const partes = nombreCompleto.split(' ')
          const resp = await clienteApi.create({
            tipo_cliente: TipoCliente.PERSONA,
            numero_documento: '',
            nombres: partes[0],
            apellidos: partes.slice(1).join(' '),
          })
          const nuevoId = resp.data?.data?.id
          if (nuevoId) clienteIdFinal = nuevoId
        } catch (_) { /* sin documento — continúa con cliente genérico */ }
      }
    }

    // Si no hay estado_de_venta, usar 'cr' (Creado) por defecto
    const estadoVenta = estado_de_venta || EstadoDeVenta.CREADO

    // Validar métodos de pago para ventas al contado.
    // EXCEPCIÓN: al editar una venta que ya tenía un cobro registrado
    // (modelo cobro diferencial), CardsInfoVenta guarda la edición sin
    // métodos de pago a propósito — la diferencia se cobra/devuelve aparte
    // vía cobrar-diferencia/devolver-diferencia. El backend ya rechaza
    // reenviar el total completo en ese caso, así que acá no hay que volver
    // a exigirlo.
    const formaDePagoValue = restValues.forma_de_pago as unknown as string
    const estadoVentaValue = estadoVenta as unknown as string
    const ventaOriginalCache = isEditing ? queryClient.getQueryData<any>(['venta', ventaId]) : undefined
    const totalPagadoPrevioOriginal = Number(ventaOriginalCache?.total_pagado ?? 0)
    const yaTeniaCobroPrevio = isEditing && totalPagadoPrevioOriginal > 0.01

    if (formaDePagoValue === 'co' && estadoVentaValue === 'cr' && !yaTeniaCobroPrevio) {
      if (!metodos_de_pago || metodos_de_pago.length === 0) {
        return notification.error({
          message: 'Métodos de pago requeridos',
          description: 'Para ventas al contado debes agregar al menos un método de pago. Haz clic en el botón "Cobrar".',
        })
      }
    }

    // Agrupar productos por producto_id (solo productos, no servicios)
    const productos_agrupados = agruparProductos({ productos: soloProductos })

    // Mapear DescuentoTipo de Prisma a Laravel
    const mapDescuentoTipo = (tipo?: any): '%' | 'm' | null => {
      if (!tipo) return null
      const tipoStr = tipo as unknown as string
      if (tipoStr === 'Porcentaje' || tipoStr === '%') return '%'
      if (tipoStr === 'Monto' || tipoStr === 'm') return 'm'
      return 'm' // Default
    }

    // Transformar al formato de Laravel
    const productos_por_almacen: ProductoVentaRequest[] = productos_agrupados.map((p) => ({
      producto_id: p.producto_id,
      costo: p.costo ?? 0,
      paquete_id: p.paquete_id || undefined,
      paquete_nombre: p.paquete_nombre || undefined,
      unidades_derivadas: p.unidades_derivadas.map((u) => ({
        unidad_derivada_inmutable_name: u.unidad_derivada_name,
        factor: Number(u.unidad_derivada_factor),
        cantidad: Number(u.cantidad),
        cantidad_pendiente: Number(u.cantidad),
        // Cantidad que la cotización origen ya reservó en esa línea. Solo aplica
        // si la línea conserva la MISMA unidad de la reserva; si el usuario
        // cambió de unidad, se descuenta completa.
        cantidad_ya_aplicada:
          u._unidad_reserva_id != null && u._unidad_reserva_id === u.unidad_derivada_id && Number(u._cantidad_reservada) > 0
            ? Number(u._cantidad_reservada)
            : undefined,
        precio: Number(u.precio_venta),
        recargo: Number(u.recargo || 0),
        descuento_tipo: mapDescuentoTipo(u.descuento_tipo),
        descuento: Number(u.descuento || 0),
        comision: Number(u.comision || 0),
      })),
    }))

    // Convertir tipo_moneda a string para comparación
    const tipoMonedaValue = tipo_moneda as unknown as string

    // Construir request para Laravel (sin serie y número, se generan automáticamente)
    const dataFormated: CreateVentaRequest = {
      tipo_documento: restValues.tipo_documento as TipoDocumento,
      // serie y numero se generan automáticamente en el backend
      forma_de_pago: restValues.forma_de_pago as FormaDePago,
      ...(restValues.forma_de_pago === FormaDePago.CREDITO && {
        numero_dias: numero_dias || undefined,
        fecha_vencimiento: fecha_vencimiento ? fecha_vencimiento.format('YYYY-MM-DD HH:mm:ss') : undefined,
      }),
      tipo_moneda: tipo_moneda as TipoMoneda,
      tipo_de_cambio: tipoMonedaValue === 's' ? 1 : (tipo_de_cambio || 1),
      // La fecha de emisión NO se toca al editar: una edición no cambia cuándo se
      // emitió el comprobante. Por eso al editar el campo NO se envía (el backend
      // solo actualiza los campos presentes en el request).
      // Antes se reenviaba con `dayjs(...).format(...)`, sin la hora del submit: si
      // el usuario tocaba el DatePicker, la fecha se guardaba a MEDIANOCHE.
      // Al concretar un borrador (ee→cr) la fecha la fija el backend con now().
      ...(isEditing ? {} : { fecha: fechaSubmit(restValues.fecha) }),
      estado_de_venta: estadoVenta as EstadoDeVenta,
      // Enviar cliente_id solo si existe, sino undefined (backend usará "CLIENTE VARIOS")
      cliente_id: clienteIdFinal,
      // ✅ Enviar dirección seleccionada (D1, D2, D3 o D4)
      direccion_seleccionada: direccion_seleccionada as TipoDireccion | undefined,
      // ✅ Enviar tipo de despacho (et=En Tienda, do=Domicilio, pa=Parcial)
      tipo_despacho:
        tipo_despacho === 'EnTienda' ? TipoDespachoVenta.EN_TIENDA
          : tipo_despacho === 'Domicilio' ? TipoDespachoVenta.DOMICILIO
          : tipo_despacho === 'Parcial' ? TipoDespachoVenta.PARCIAL
          : tipo_despacho === 'OmitirConStock' ? 'oc' as any
          : undefined,
      // ✅ Enviar quien_entrega para que el backend lo use al auto-crear la
      // entrega de despacho en tienda (antes lo hardcodeaba como 'vendedor').
      quien_entrega: tipo_despacho === 'EnTienda' ? (quien_entrega || 'almacen') as any : undefined,
      // Solo "Omitir entrega" debe impedir el descuento de stock al crear la venta.
      omitir_entrega: _omitir_entrega || undefined,
      // `descontar_stock = 'no'` indica que el cliente ya tiene el producto:
      // backend NO descuenta stock pero SÍ crea la entrega como ENTREGADA.
      descontar_stock,
      // `stock_ya_aplicado = true` cuando la cotización origen reservó stock:
      // backend NO descuenta de nuevo pero sí marca stock_aplicado=true.
      // Se manda como fallback; si viene `cotizacion_id` el backend ignora este
      // flag y verifica reservar_stock directo en la BD (más confiable).
      stock_ya_aplicado: stock_ya_aplicado || undefined,
      // ID de la cotización origen (si la venta se creó cargando una cotización).
      cotizacion_id: cotizacion_id || undefined,
      recomendado_por_id: recomendado_por_id || undefined,
      user_id: user_id,
      almacen_id: almacen_id,
      ...(productos_por_almacen.length > 0 && { productos_por_almacen }),
      // Agregar servicios si existen
      servicios_venta: soloServicios.length > 0
        ? soloServicios.map(s => ({
            servicio_id: s.servicio_id!,
            cantidad: Number(s.cantidad),
            precio_unitario: Number(s.precio_venta),
            subtotal: Number((Number(s.cantidad) * Number(s.precio_venta)).toFixed(4)),
            referencia: s.servicio_referencia || null,
          }))
        : undefined,
      // Agregar métodos de pago si existen, extrayendo correctamente los IDs.
      // En ventas a CRÉDITO el dinero no ingresa al crear (queda como cuenta por
      // cobrar), así que nunca se envían métodos de pago aunque el form los
      // arrastre de una edición previa al contado — el backend los rechazaría.
      // En ventas "en espera" el pago no está confirmado, no enviar métodos
      // de pago aunque el form los tenga de una edición previa al contado.
      despliegue_de_pago_ventas: !esEnEspera && restValues.forma_de_pago !== FormaDePago.CREDITO && metodos_de_pago && metodos_de_pago.length > 0
        ? metodos_de_pago
            .map(mp => {
              const id = extractDesplieguePagoId(mp.despliegue_de_pago_id)
              // Filtrar valores null y convertir a string
              if (id === null) return null
              return {
                ...mp,
                despliegue_de_pago_id: String(id)
              }
            })
            .filter((mp): mp is NonNullable<typeof mp> => mp !== null)
        : undefined,
      // Vale de compra (código de vale generado para canjear)
      codigo_vale: codigo_vale || undefined,
      // Vales excluidos por el vendedor
      vales_excluidos: valesExcluidos.length > 0 ? valesExcluidos : undefined,
      // Cobro/devolución de la diferencia (modelo cobro diferencial): se
      // adjunta a la MISMA edición para que el backend lo aplique dentro de
      // la misma transacción — si el modal de diferencia se canceló, este
      // campo nunca se seteó y no se manda nada.
      diferencia_pago: diferencia_pago
        ? {
            tipo: diferencia_pago.tipo,
            despliegue_de_pago_ventas: (diferencia_pago.despliegue_de_pago_ventas || [])
              .map((dp: any) => {
                const id = extractDesplieguePagoId(dp.despliegue_de_pago_id)
                if (id === null) return null
                return { ...dp, despliegue_de_pago_id: String(id) }
              })
              .filter((dp: any) => dp !== null),
          }
        : undefined,
    }

    try {
      // Usar create o update según el modo
      const response = isEditing
        ? await ventaApi.update(ventaId!, dataFormated)
        : await ventaApi.create(dataFormated)

      if (response.error) {
        notification.error({
          message: response.error.message || 'Error al crear venta',
          description: response.error.errors
            ? Object.entries(response.error.errors).map(([key, value]) => `${key}: ${value}`).join('\n')
            : undefined
        })
        return
      }

      // Sincronizar teléfonos/email editados con la ficha del cliente.
      // Reconstruir Cel 1 (telefono) y Cel 2 (celular): el campo visible
      // `telefono` tiene el valor del slot activo (con ediciones inline); el
      // oculto tiene el slot inactivo. Mapeo: C1→telefono, C2→celular.
      if (clienteIdFinal) {
        const activo = (telefono_seleccionado as string) || 'C1'
        const visible = (telefono as string | undefined)?.trim() || ''
        const ocultoC1 = (_cliente_telefono_1 as string | undefined)?.trim() || ''
        const ocultoC2 = (_cliente_telefono_2 as string | undefined)?.trim() || ''
        const telC1 = activo === 'C1' ? visible : ocultoC1
        const telC2 = activo === 'C2' ? visible : ocultoC2

        const datosContacto: { telefono?: string | null; celular?: string | null; email?: string | null } = {
          telefono: telC1 || null,
          celular: telC2 || null,
        }
        if (email !== undefined) datosContacto.email = (email as string | undefined)?.trim() || null
        clienteApi.update(clienteIdFinal, datosContacto).catch(() => {})
      }

      // Actualizar la dirección del cliente ANTES de emitir el evento de venta creada,
      // para que el ticket PDF que se genera al abrir el modal use la dirección actualizada.
      if (clienteIdFinal && direccion) {
        const tipoDirActiva = (direccion_seleccionada as TipoDireccion) || TipoDireccion.D1
        const cid = clienteIdFinal
        try {
          const resp = await clienteApi.listarDirecciones(cid)
          const dirs = resp.data?.data ?? []
          const found = dirs.find((d) => d.tipo === tipoDirActiva)
          if (found) {
            await clienteApi.actualizarDireccion(found.id, { direccion })
          } else {
            await clienteApi.crearDireccion(cid, { direccion, tipo: tipoDirActiva } as any)
          }
        } catch (_) { /* non-critical — venta ya creada */ }
      }

      // En modo edición, invalidar queries y seguir el flujo normal (mostrar PDF → limpiar)
      if (isEditing) {
        message.success('Venta actualizada exitosamente')
        queryClient.invalidateQueries({ queryKey: ['venta', ventaId] })
        queryClient.invalidateQueries({ queryKey: ['ventas'] })
      }

      // Si es venta en espera: mensaje específico, limpiar formulario y NO abrir modal de documento
      if (estadoVenta === EstadoDeVenta.EN_ESPERA) {
        message.success('Venta puesta en espera correctamente')
        queryClient.invalidateQueries({ queryKey: ['ventas'] })
        ventaEvents.emitEspera()
        return
      }

      // Éxito para venta normal
      if (!isEditing) {
        message.success('Venta creada exitosamente')
      }

      // La venta se guardó, pero la generación del XML/comprobante falló.
      // Mostrar el motivo real en vez de dejar la venta sin XML en silencio.
      const comprobanteError = response.data?.comprobante_error
      if (comprobanteError) {
        notification.error({
          message: 'La venta se guardó, pero NO se generó el comprobante electrónico',
          description: `Motivo: ${comprobanteError}`,
          duration: 8,
        })
      }

      // Alerta de envío a SUNAT (solo facturas/boletas con comprobante).
      const tipoDocRespuesta = response.data?.data?.tipo_documento
      if (tipoDocRespuesta === '01' || tipoDocRespuesta === '03') {
        if (response.data?.enviado_sunat === true) {
          notification.success({
            message: 'Comprobante enviado a SUNAT',
            description: 'El comprobante se envió a SUNAT automáticamente al momento.',
          })
        } else {
          notification.info({
            message: 'Comprobante programado para envío a SUNAT',
            description: 'Se enviará automáticamente según la configuración de envío.',
          })
        }
      }

      // Emitir evento de venta creada/actualizada — abre el modal de
      // ticket/PDF y, al cerrarlo, navega fuera de la página en modo
      // edición (ver body-vender.tsx). El cobro/devolución de la diferencia
      // (si había) ya se resolvió DENTRO de este mismo guardado (atómico —
      // ver diferencia_pago arriba), así que para cuando llegamos acá la
      // venta ya quedó completamente al día.
      if (response.data?.data) {
        ventaEvents.emit(response.data.data)
      }

      // ✅ CREAR ENTREGA AUTOMÁTICAMENTE SI ES DESPACHO A DOMICILIO
      const ventaCreada = response.data?.data

      // En edición, este bloque ejecuta SOLO si el modal envió un split
      // explícito (`cantidades_parciales` con algún `entregar_programado>0`).
      // Si solo se editaron datos básicos sin tocar el modal de entrega,
      // `cantidades_parciales` viene vacío y no se crea nada nuevo (las
      // entregas viejas se mantienen tal cual, el backend sólo regenera
      // detalles preservando lo entregado).
      const tieneSplitDomicilio =
        cantidades_parciales && cantidades_parciales.some((c) => Number(c.entregar_programado || 0) > 0)
      // `entregaProgramadaExplicita`: el usuario abrió el modal de entrega y lo
      // confirmó (botón "Editar Entrega" en una venta ya creada). Esa es una
      // señal directa de intención, así que alcanza por sí sola.
      //
      // Antes en edición se exigía `tieneSplitDomicilio`, o sea deducir la
      // intención a partir de que llegaran `cantidades_parciales`. Cuando esa
      // clave no llegaba —y no llegaba— la venta se guardaba y la entrega
      // quedaba intacta: el vendedor perdía en silencio el chofer, el vehículo y
      // el horario que acababa de programar.
      const ejecutarBloqueDomicilio = ventaCreada && tipo_despacho === 'Domicilio' && !_omitir_entrega &&
        (!isEditing || tieneSplitDomicilio || entregaProgramadaExplicita)
      if (ejecutarBloqueDomicilio) {
        try {
          // Obtener los IDs de unidades derivadas de venta desde la respuesta
          const productosVenta = ventaCreada.productos_por_almacen || []
          const unidadesDerivadas: any[] = []

          // Si el modal envió cantidades_parciales (split de Domicilio), usar
          // entregar_programado por unidad. Si no, programar todo por defecto.
          //
          // Matching por nombre de producto, NO por índice posicional.
          // El API devuelve productos_por_almacen ordenados por pav_id (orden
          // de inserción en BD), mientras que cantidades_parciales sigue el
          // orden del formulario (orden en que el usuario agregó productos).
          // Si difieren, el índice posicional aplica cantidades al producto
          // equivocado.
          //
          // NO usar el unit-type ID en la key: `unidadderivada.id` (catálogo
          // del form) y `unidadderivadainmutable.id` (respuesta del API) son
          // tablas distintas con IDs distintos — solo UNIDAD coincide en id=1
          // por azar; CAJA, KILO, etc. no coinciden. El nombre de producto es
          // suficiente porque un mismo producto no aparece dos veces con
          // distintas unidades en la misma venta.
          const parcialLookup = new Map<string, NonNullable<typeof cantidades_parciales>[number][]>()
          if (cantidades_parciales) {
            for (const c of cantidades_parciales) {
              const key = c.producto_name ?? ''
              const arr = parcialLookup.get(key) ?? []
              arr.push(c)
              parcialLookup.set(key, arr)
            }
          }

          // Para la REPROGRAMACIÓN (edición) van todas las unidades, también
          // las que quedan en 0 — así el detalle de la entrega refleja
          // exactamente lo que mostró el modal. Para la creación solo las > 0.
          const cantidadesPorUnidad: ProductoEntregadoRequest[] = []

          productosVenta.forEach((productoAlmacen: any) => {
            if (productoAlmacen.unidades_derivadas) {
              const prodName = productoAlmacen.producto_almacen?.producto?.name ?? ''
              productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                const queue = parcialLookup.get(prodName)
                const parcial = queue?.shift()
                const cantidadAEntregar = cantidades_parciales
                  ? Number(parcial?.entregar_programado ?? 0)
                  : Number(unidad.cantidad)
                cantidadesPorUnidad.push({
                  unidad_derivada_venta_id: unidad.id,
                  cantidad_entregada: cantidadAEntregar,
                })
                if (cantidadAEntregar > 0) {
                  unidadesDerivadas.push({
                    unidad_derivada_venta_id: unidad.id,
                    cantidad_entregada: cantidadAEntregar,
                    ubicacion: undefined,
                  })
                }
              })
            }
          })


          // Preparar datos de la entrega
          const entregaData: CreateEntregaProductoRequest = {
            venta_id: ventaCreada.id,
            tipo_entrega: TipoEntrega.DESPACHO,
            tipo_despacho: TipoDespacho.PROGRAMADO,
            estado_entrega: descontar_stock === 'no'
              ? EstadoEntrega.ENTREGADO
              : EstadoEntrega.PENDIENTE,
            fecha_entrega: dayjs().format('YYYY-MM-DD'),
            fecha_programada: fecha_programada ? dayjs(fecha_programada).format('YYYY-MM-DD') : undefined,
            hora_inicio: hora_inicio,
            hora_fin: hora_fin,
            direccion_entrega: direccion_entrega,
            referencia_entrega: referencia_entrega || undefined,
            latitud: latitud ? Number(latitud) : undefined,
            longitud: longitud ? Number(longitud) : undefined,
            observaciones: observaciones,
            almacen_salida_id: almacen_id,
            chofer_id: despachador_id ? String(despachador_id) : undefined,
            quien_entrega: descontar_stock === 'no'
              ? (quien_entrega as QuienEntrega) || QuienEntrega.ALMACEN
              : despachador_id ? QuienEntrega.CHOFER : QuienEntrega.ALMACEN,
            user_id: user_id,
            tipo_pedido: (tipo_pedido as TipoPedido) || undefined,
            cargo_destino: cargo_destino || undefined,
            vehiculo_id: vehiculo_id ? Number(vehiculo_id) : undefined,
            productos_entregados: unidadesDerivadas,
          }


          // En edición la venta ya tiene su entrega: se reprograma esa. Crear
          // una nueva es el camino de la venta recién creada (ver
          // buscarEntregaReprogramable).
          const entregaExistente = isEditing ? await buscarEntregaReprogramable(ventaCreada.id) : null
          const entregaResponse = entregaExistente
            ? await entregaProductoApi.update(
                entregaExistente.id,
                aPayloadReprogramacion(entregaData, cantidadesPorUnidad),
              )
            : await entregaProductoApi.create(entregaData)

          if (entregaResponse.error) {
            console.error('❌ Error al registrar entrega:', entregaResponse.error)
            notification.warning({
              message: entregaExistente
                ? 'Venta guardada, pero la entrega NO se pudo reprogramar'
                : 'Venta creada pero entrega no pudo ser registrada',
              // El motivo del backend va visible. Antes se reemplazaba por un
              // texto genérico y un rechazo de validación pasaba por un aviso
              // de cortesía que nadie leía.
              description: entregaResponse.error.message || 'Puedes corregirla desde "Mis Entregas".',
              duration: 8,
            })
          } else {
            message.success(
              entregaExistente
                ? 'Entrega reprogramada exitosamente'
                : despachador_id
                  ? 'Entrega programada exitosamente para el despachador'
                  : 'Entrega programada exitosamente (sin despachador asignado)')

            // Invalidar cache de entregas: la raíz cubre 'por-venta' (historial
            // en mis-ventas) y los listados de Mis Entregas y el calendario.
            queryClient.invalidateQueries({
              queryKey: [QueryKeys.ENTREGAS_PRODUCTOS],
            })

            // 🔔 Enviar notificación push al despachador (solo si hay uno asignado)
            if (despachador_id) {
              try {
                const clienteNombre = ventaCreada.cliente?.nombres
                  ? `${ventaCreada.cliente.nombres} ${ventaCreada.cliente.apellidos || ''}`.trim()
                  : ventaCreada.cliente?.razon_social || 'Cliente'

                await fcmApi.notifyEntregaProgramada({
                  despachador_id: String(despachador_id),
                  venta_serie: ventaCreada.serie || '',
                  venta_numero: ventaCreada.numero || '',
                  direccion: direccion_entrega || '',
                  fecha_programada: fecha_programada ? dayjs(fecha_programada).format('DD/MM/YYYY') : 'Hoy',
                  cliente_nombre: clienteNombre,
                })
              } catch (notifError) {
                console.warn('No se pudo enviar notificación al despachador:', notifError)
              }
            }
          }
        } catch (error) {
          console.error('❌ Error al crear entrega automática:', error)
          notification.warning({
            message: 'Venta creada pero entrega no pudo ser registrada',
            description: 'La venta se creó correctamente pero hubo un error al registrar la entrega. Puedes crearla manualmente desde "Mis Ventas".',
          })
        }
      } else if (
        // En edición, ejecutar solo si el modal envió cantidades_parciales
        // con `entregar > 0` o `entregar_programado > 0`. Si el usuario
        // solo cambió datos básicos sin abrir el modal, no se crean nuevas
        // entregas — las viejas quedan preservadas por el backend.
        (
          (!isEditing && tipo_despacho === 'Parcial') ||
          // Mismo criterio que el bloque de Domicilio: confirmar el modal en una
          // venta ya creada es señal suficiente, sin depender de deducirla desde
          // `cantidades_parciales`.
          (isEditing && tipo_despacho === 'Parcial' && (entregaProgramadaExplicita ||
            (cantidades_parciales &&
              cantidades_parciales.some((c) => Number(c.entregar || 0) > 0 || Number(c.entregar_programado || 0) > 0))))
        )
        && ventaCreada && !_omitir_entrega
      ) {
        // DESPACHO PARCIAL: entregar solo las cantidades especificadas
        if (cantidades_parciales && cantidades_parciales.some(c => c.entregar > 0)) {
          try {
            // Cuando descontar_stock='no' el cliente ya tiene la mercadería,
            // la entrega se completa automáticamente sin importar quien_entrega.
            const parcialConAlmacenPendiente = descontar_stock === 'no'
              ? false
              : quien_entrega === 'almacen'
            const productosVenta = ventaCreada.productos_por_almacen || []
            const unidadesDerivadas: any[] = []

            // Mapeo POSICIONAL a propósito: `cantidades_parciales` se arma en el
            // modal ANTES de crear la venta, así que sus ids NO coinciden con los
            // `unidad.id` que el backend asigna al crear. La única correspondencia
            // estable es el orden: cantidades_parciales incluye TODOS los productos
            // (los excluidos con entregar:0), alineado con productos_por_almacen.
            let parcialIdx = 0
            productosVenta.forEach((productoAlmacen: any) => {
              if (productoAlmacen.unidades_derivadas) {
                productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                  const parcial = cantidades_parciales[parcialIdx]
                  parcialIdx++
                  if (parcial && parcial.entregar > 0) {
                    unidadesDerivadas.push({
                      unidad_derivada_venta_id: unidad.id,
                      cantidad_entregada: parcial.entregar,
                      ubicacion: undefined,
                    })
                  }
                })
              }
            })

            if (unidadesDerivadas.length > 0) {
              const entregaData: CreateEntregaProductoRequest = {
                venta_id: ventaCreada.id,
                tipo_entrega: TipoEntrega.RECOJO_EN_TIENDA,
                tipo_despacho: TipoDespacho.INMEDIATO,
                estado_entrega: parcialConAlmacenPendiente
                  ? EstadoEntrega.PENDIENTE
                  : EstadoEntrega.ENTREGADO,
                fecha_entrega: dayjs().format('YYYY-MM-DD'),
                almacen_salida_id: almacen_id,
                quien_entrega: (quien_entrega as QuienEntrega) || QuienEntrega.ALMACEN,
                user_id: user_id,
                productos_entregados: unidadesDerivadas,
              }

              const entregaResponse = await entregaProductoApi.create(entregaData)

              if (entregaResponse.error) {
                notification.warning({
                  message: 'Venta creada pero entrega parcial no pudo ser registrada',
                  description: 'Puedes crearla manualmente desde "Mis Ventas".',
                })
              } else {
                const entregaParcialCreada: any =
                  entregaResponse.data?.data ?? entregaResponse.data
                const grupoEntregaId = entregaParcialCreada?.grupo_entrega_id || entregaParcialCreada?.id

                message.success(
                  parcialConAlmacenPendiente
                    ? 'Entrega parcial pendiente registrada exitosamente'
                    : 'Entrega parcial registrada exitosamente'
                )

                // Invalidar cache de entregas para que mis-ventas muestre el historial
                queryClient.invalidateQueries({
                  queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaCreada.id],
                })

                // ✅ CREAR SEGUNDA ENTREGA PROGRAMADA para el resto (si se configuró)
                // Usa `entregar_programado` (editable por el usuario) en lugar de `total - entregar`.
                // Lo que NO se programa queda en cantidad_pendiente para programarlo luego desde Mis Ventas.
                if (parcial_resto_programado && (parcial_resto_programado.despachador_id || parcial_resto_programado.cargo_destino)) {
                  const unidadesDerivadas2: any[] = []

                  let parcialIdx2 = 0
                  productosVenta.forEach((productoAlmacen: any) => {
                    if (productoAlmacen.unidades_derivadas) {
                      productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                        const parcial = cantidades_parciales[parcialIdx2]
                        parcialIdx2++
                        const programar = parcial?.entregar_programado ?? 0
                        if (parcial && programar > 0) {
                          unidadesDerivadas2.push({
                            unidad_derivada_venta_id: unidad.id,
                            cantidad_entregada: programar,
                            ubicacion: undefined,
                          })
                        }
                      })
                    }
                  })

                  if (unidadesDerivadas2.length > 0) {
                    const entregaRestoData: CreateEntregaProductoRequest = {
                      venta_id: ventaCreada.id,
                      grupo_entrega_id: grupoEntregaId,
                      tipo_entrega: TipoEntrega.DESPACHO,
                      tipo_despacho: TipoDespacho.PROGRAMADO,
                      estado_entrega: EstadoEntrega.PENDIENTE,
                      fecha_entrega: dayjs().format('YYYY-MM-DD'),
                      fecha_programada: parcial_resto_programado.fecha_programada,
                      hora_inicio: parcial_resto_programado.hora_inicio,
                      hora_fin: parcial_resto_programado.hora_fin,
                      direccion_entrega: parcial_resto_programado.direccion_entrega,
                      referencia_entrega: parcial_resto_programado.referencia_entrega,
                      latitud: parcial_resto_programado.latitud ? Number(parcial_resto_programado.latitud) : undefined,
                      longitud: parcial_resto_programado.longitud ? Number(parcial_resto_programado.longitud) : undefined,
                      observaciones: parcial_resto_programado.observaciones,
                      almacen_salida_id: almacen_id,
                      chofer_id: parcial_resto_programado.despachador_id,
                      tipo_pedido: parcial_resto_programado.tipo_pedido,
                      cargo_destino: parcial_resto_programado.cargo_destino,
                      quien_entrega: QuienEntrega.CHOFER,
                      user_id: user_id,
                      vehiculo_id: parcial_resto_programado.vehiculo_id ? Number(parcial_resto_programado.vehiculo_id) : undefined,
                      productos_entregados: unidadesDerivadas2,
                    }

                    const entregaRestoResponse = await entregaProductoApi.create(entregaRestoData)

                    if (entregaRestoResponse.error) {
                      notification.warning({
                        message: 'Entrega del resto no pudo ser programada',
                        description: 'Puedes crearla manualmente desde "Mis Ventas".',
                      })
                    } else {
                      message.success('Entrega del resto programada exitosamente')

                      // Invalidar cache de entregas después de segunda entrega parcial
                      queryClient.invalidateQueries({
                        queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaCreada.id],
                      })

                      // 🔔 Notificar al despachador del resto (solo si hay despachador interno)
                      if (parcial_resto_programado.despachador_id) {
                        try {
                          const clienteNombre = ventaCreada.cliente?.nombres
                            ? `${ventaCreada.cliente.nombres} ${ventaCreada.cliente.apellidos || ''}`.trim()
                            : ventaCreada.cliente?.razon_social || 'Cliente'

                          await fcmApi.notifyEntregaProgramada({
                            despachador_id: parcial_resto_programado.despachador_id,
                            venta_serie: ventaCreada.serie || '',
                            venta_numero: ventaCreada.numero || '',
                            direccion: parcial_resto_programado.direccion_entrega || '',
                            fecha_programada: parcial_resto_programado.fecha_programada
                              ? dayjs(parcial_resto_programado.fecha_programada).format('DD/MM/YYYY')
                              : 'Por confirmar',
                            cliente_nombre: clienteNombre,
                          })
                        } catch (notifError) {
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            notification.warning({
              message: 'Venta creada pero entrega parcial no pudo ser registrada',
              description: 'Puedes crearla manualmente desde "Mis Ventas".',
            })
          }
        }
      } else if (
        !isEditing &&
        ventaCreada &&
        _omitir_entrega &&
        (
          tipo_despacho === 'Domicilio' ||
          tipo_despacho === 'Parcial'
        )
      ) {
        // Solo crear el placeholder en CREACIÓN. Al editar no se duplica:
        // las entregas viejas (incluido el placeholder original) ya las
        // maneja el backend.
        try {
          const productosVenta = ventaCreada.productos_por_almacen || []
          const unidadesDerivadas: any[] = []

            // OMITIR: crear entrega placeholder con cantidad_entregada=0.
            productosVenta.forEach((productoAlmacen: any) => {
              if (productoAlmacen.unidades_derivadas) {
                productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                  unidadesDerivadas.push({
                    unidad_derivada_venta_id: unidad.id,
                    cantidad_entregada: 0,
                    ubicacion: undefined,
                  })
                })
              }
          })

          const entregaData: CreateEntregaProductoRequest = {
            venta_id: ventaCreada.id,
            tipo_entrega: TipoEntrega.DESPACHO,
                // ? TipoEntrega.PARCIAL
                // : TipoEntrega.DESPACHO,
            tipo_despacho: TipoDespacho.PROGRAMADO,
            estado_entrega: EstadoEntrega.PENDIENTE,
            fecha_entrega: dayjs().format('YYYY-MM-DD'),
            almacen_salida_id: almacen_id,
            quien_entrega: QuienEntrega.ALMACEN,
            user_id: user_id,
            productos_entregados: unidadesDerivadas,
          }

          const entregaResponse = await entregaProductoApi.create(entregaData)

          if (entregaResponse.error) {
            console.error('❌ Error al crear entrega pendiente:', entregaResponse.error)
            notification.warning({
              message: 'Venta creada pero entrega no pudo ser registrada',
              description: 'Puedes crearla manualmente desde "Mis Entregas".',
            })
          } else {
            // Invalidar cache de entregas después de placeholder omitido
            queryClient.invalidateQueries({
              queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'por-venta', ventaCreada.id],
            })
          }
        } catch (error) {
          console.error('❌ Error al crear entrega pendiente (omitir):', error)
        }
      }

      // ✅ Invalidar caché de productos para que se recarguen con tiene_ingresos actualizado
      // Esto forzará una recarga automática de la tabla de productos en mi-almacen
      queryClient.invalidateQueries({
        queryKey: ['productos-by-almacen', almacen_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['productos-search']
      })
      // Invalidar comisiones: la nueva venta puede generar comisión que debe
      // aparecer en /comisiones sin tener que refrescar la página manualmente.
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_POR_VENDEDOR],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.COMISIONES_DETALLE_VENDEDOR],
      })
    } catch (error) {
      console.error('Error al crear venta:', error)
      notification.error({
        message: 'Error inesperado al crear venta',
      })
    }
    } finally {
      // Consumido: no debe arrastrarse a la próxima edición.
      useStoreEntregaPendiente.getState().setValores(null)
      submittingRef.current = false
      setLoading(false)
    }
  }, [router, user_id, notification, message, almacen_id, queryClient, isEditing, ventaId, onMissingApertura])
/////sadadadbajdb ahdbaj wd
  return { handleSubmit, loading }
}
