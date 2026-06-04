import { FormCreateVenta } from '../_components/others/body-vender'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import { useAuth } from '~/lib/auth-context'
import { useState, useCallback } from 'react'
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
  type CreateEntregaProductoRequest
} from '~/lib/api/entrega-producto'
import { fcmApi } from '~/lib/api/fcm'
import type { TipoDireccion } from '~/lib/api/cliente'
import dayjs from 'dayjs'
 import { cajaApi } from '~/lib/api/caja'
import { fechaSubmit } from '~/utils/fechas'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreProductoAgregadoVenta } from '../_store/store-producto-agregado-venta'

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
      'producto_id' | 'marca_name' | 'producto_name' | 'subtotal'
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
    })
  }
  return Array.from(mapa.values())
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
  const queryClient = useQueryClient()
  const isEditing = !!ventaId

  const handleSubmit = useCallback(async (values: FormCreateVenta) => {
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })

    const esEnEspera = values.estado_de_venta === EstadoDeVenta.EN_ESPERA
    const valesExcluidos = useStoreProductoAgregadoVenta.getState().valesExcluidos

    // Validar apertura de caja solo para ventas finalizadas (no para "en espera")
    if (!esEnEspera) {
      try {
        const cajaResponse = await cajaApi.cajaActiva()
        const cajaActiva = cajaResponse.data?.data

        if (!cajaActiva) {
          onMissingApertura?.()
          return
        }

        const fechaApertura = dayjs(cajaActiva.fecha_apertura)
        const hoy = dayjs()

        if (!fechaApertura.isSame(hoy, 'day')) {
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
      productos,
      tipo_de_cambio,
      tipo_moneda,
      estado_de_venta,
      cliente_id,
      recomendado_por_id,
      metodos_de_pago,
      direccion,
      direccion_seleccionada,
      ruc_dni,
      telefono,
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

    // Para Boleta/NV: enviar cliente_id si existe, o undefined para que backend use "CLIENTE VARIOS"
    const clienteIdFinal = cliente_id || undefined

    // Si no hay estado_de_venta, usar 'cr' (Creado) por defecto
    const estadoVenta = estado_de_venta || EstadoDeVenta.CREADO

    // Validar métodos de pago para ventas al contado
    const formaDePagoValue = restValues.forma_de_pago as unknown as string
    const estadoVentaValue = estadoVenta as unknown as string

    if (formaDePagoValue === 'co' && estadoVentaValue === 'cr') {
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
      fecha: isEditing
        ? dayjs(restValues.fecha).format('YYYY-MM-DD HH:mm:ss')
        : fechaSubmit(restValues.fecha),
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
      stock_ya_aplicado: stock_ya_aplicado || undefined,
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
      despliegue_de_pago_ventas: restValues.forma_de_pago !== FormaDePago.CREDITO && metodos_de_pago && metodos_de_pago.length > 0
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
    }

    setLoading(true)
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

      // Emitir evento de venta creada (solo en modo creación normal)
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
      const ejecutarBloqueDomicilio = ventaCreada && tipo_despacho === 'Domicilio' && !_omitir_entrega &&
        (!isEditing || tieneSplitDomicilio)
      if (ejecutarBloqueDomicilio) {
        try {
          // Obtener los IDs de unidades derivadas de venta desde la respuesta
          const productosVenta = ventaCreada.productos_por_almacen || []
          const unidadesDerivadas: any[] = []

          // Si el modal envió cantidades_parciales (split de Domicilio), usar
          // entregar_programado por unidad. Si no, programar todo por defecto.
          let parcialIdx = 0
          productosVenta.forEach((productoAlmacen: any) => {
            if (productoAlmacen.unidades_derivadas) {
              productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                const parcial = cantidades_parciales?.[parcialIdx]
                parcialIdx++
                const cantidadAEntregar = parcial
                  ? Number(parcial.entregar_programado ?? 0)
                  : Number(unidad.cantidad)
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
            estado_entrega: EstadoEntrega.PENDIENTE,
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
            quien_entrega: despachador_id ? QuienEntrega.CHOFER : QuienEntrega.ALMACEN,
            user_id: user_id,
            tipo_pedido: (tipo_pedido as TipoPedido) || undefined,
            cargo_destino: cargo_destino || undefined,
            vehiculo_id: vehiculo_id ? Number(vehiculo_id) : undefined,
            productos_entregados: unidadesDerivadas,
          }


          // Crear la entrega
          const entregaResponse = await entregaProductoApi.create(entregaData)

          if (entregaResponse.error) {
            console.error('❌ Error al crear entrega:', entregaResponse.error)
            notification.warning({
              message: 'Venta creada pero entrega no pudo ser registrada',
              description: 'La venta se creó correctamente pero hubo un error al registrar la entrega. Puedes crearla manualmente desde "Mis Ventas".',
            })
          } else {
            message.success(despachador_id
              ? 'Entrega programada exitosamente para el despachador'
              : 'Entrega programada exitosamente (sin despachador asignado)')

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
          (isEditing && tipo_despacho === 'Parcial' && cantidades_parciales &&
            cantidades_parciales.some((c) => Number(c.entregar || 0) > 0 || Number(c.entregar_programado || 0) > 0))
        )
        && ventaCreada && !_omitir_entrega
      ) {
        // DESPACHO PARCIAL: entregar solo las cantidades especificadas
        if (cantidades_parciales && cantidades_parciales.some(c => c.entregar > 0)) {
          try {
            const parcialConAlmacenPendiente = quien_entrega === 'almacen'
            const productosVenta = ventaCreada.productos_por_almacen || []
            const unidadesDerivadas: any[] = []

            // Iterar por índice: cantidades_parciales y las unidades de la respuesta
            // están en el mismo orden (se generan desde los mismos productos del formulario)
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
    } finally {
      setLoading(false)
    }
  }, [router, user_id, notification, message, almacen_id, queryClient, isEditing, ventaId, onMissingApertura])

  return { handleSubmit, loading }
}
