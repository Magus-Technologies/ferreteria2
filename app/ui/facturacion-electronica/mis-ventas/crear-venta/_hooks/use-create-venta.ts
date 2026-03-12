import { FormCreateVenta } from '../_components/others/body-vender'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import { useAuth } from '~/lib/auth-context'
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  TipoDocumento,
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
  type CreateEntregaProductoRequest
} from '~/lib/api/entrega-producto'
import { fcmApi } from '~/lib/api/fcm'
import dayjs from 'dayjs'
import { cajaApi } from '~/lib/api/caja'

type ProductoAgrupado = Pick<
  FormCreateVenta['productos'][number],
  'producto_id' | 'marca_name' | 'producto_name'
> & {
  paquete_id?: number
  paquete_nombre?: string
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
    console.log('🚀 ~ handleSubmit ~ values:', values)
    console.log('🔍 DEBUG - direccion_seleccionada:', values.direccion_seleccionada)
    console.log('🔍 DEBUG - direccion:', values.direccion)

    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })

    // ✅ VALIDAR APERTURA DE HOY ANTES DE FINALIZAR
    try {
      const cajaResponse = await cajaApi.cajaActiva()
      const cajaActiva = cajaResponse.data?.data
      
      console.log('🔍 Validando apertura - cajaActiva:', cajaActiva)
      
      if (!cajaActiva) {
        console.warn('⚠️ No hay apertura de caja activa')
        console.log('📞 Llamando onMissingApertura callback')
        onMissingApertura?.()
        return
      }

      const fechaApertura = dayjs(cajaActiva.fecha_apertura)
      const hoy = dayjs()
      
      console.log('📅 Comparando fechas:')
      console.log('  fechaApertura:', fechaApertura.format('YYYY-MM-DD'))
      console.log('  hoy:', hoy.format('YYYY-MM-DD'))
      console.log('  ¿Es del mismo día?:', fechaApertura.isSame(hoy, 'day'))
      
      if (!fechaApertura.isSame(hoy, 'day')) {
        console.warn('⚠️ La apertura no es de hoy')
        console.log('📞 Llamando onMissingApertura callback')
        onMissingApertura?.()
        return
      }
    } catch (error) {
      console.error('❌ Error al validar apertura:', error)
      console.log('📞 Llamando onMissingApertura callback por error')
      onMissingApertura?.()
      return
    }

    const {
      productos,
      tipo_de_cambio,
      tipo_moneda,
      estado_de_venta,
      cliente_id,
      recomendado_por_id,
      metodos_de_pago,
      _cliente_direccion_1,
      _cliente_direccion_2,
      _cliente_direccion_3,
      _cliente_direccion_4,
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
      latitud,
      longitud,
      observaciones,
      quien_entrega,
      cantidades_parciales,
      parcial_resto_programado,
      codigo_vale,
      ...restValues
    } = values



    // Separar productos y servicios
    const soloProductos = (productos || []).filter(p => p._tipo !== 'servicio')
    const soloServicios = (productos || []).filter(p => p._tipo === 'servicio')

    if (soloProductos.length === 0 && soloServicios.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto o servicio',
      })

    // IMPORTANTE: Laravel backend permite cliente_id nullable para Boleta/NV
    // Si no hay cliente, el backend usará automáticamente "CLIENTE VARIOS" (DNI: 99999999)
    // Para Factura, SÍ requerir selección manual de cliente

    if (!cliente_id && restValues.tipo_documento === '01') {
      return notification.error({
        message: 'Por favor, selecciona un cliente',
        description: 'Las facturas requieren obligatoriamente un cliente registrado.',
      })
    }

    // Validar cliente obligatorio para ventas a crédito
    if (!cliente_id && restValues.forma_de_pago === FormaDePago.CREDITO) {
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
    console.log('🔍 DEBUG - Validación métodos de pago:')
    console.log('  forma_de_pago:', restValues.forma_de_pago)
    console.log('  estadoVenta:', estadoVenta)
    console.log('  metodos_de_pago:', metodos_de_pago)
    console.log('  metodos_de_pago es array?:', Array.isArray(metodos_de_pago))
    console.log('  metodos_de_pago.length:', metodos_de_pago?.length)

    // Comparar con el valor mapeado 'co' (Contado) y 'cr' (Creado)
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

    console.log('🔍 DEBUG - Valores del formulario:')
    console.log('  tipo_documento:', restValues.tipo_documento, typeof restValues.tipo_documento)
    console.log('  forma_de_pago:', restValues.forma_de_pago, typeof restValues.forma_de_pago)
    console.log('  tipo_moneda:', tipo_moneda, typeof tipo_moneda)
    console.log('  estado_de_venta:', estadoVenta, typeof estadoVenta)

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
      costo: 0, // El costo se calculará en el backend
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
        comision: 0,
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
      fecha: restValues.fecha.format('YYYY-MM-DD HH:mm:ss'),
      estado_de_venta: estadoVenta as EstadoDeVenta,
      // Enviar cliente_id solo si existe, sino undefined (backend usará "CLIENTE VARIOS")
      cliente_id: clienteIdFinal,
      // ✅ Enviar dirección seleccionada (D1, D2, D3 o D4)
      direccion_seleccionada: direccion_seleccionada as 'D1' | 'D2' | 'D3' | 'D4' | undefined,
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
      // Agregar métodos de pago si existen, extrayendo correctamente los IDs
      despliegue_de_pago_ventas: metodos_de_pago && metodos_de_pago.length > 0
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
    }

    console.log('📤 Datos a enviar a Laravel:', JSON.stringify(dataFormated, null, 2))
    console.log('🔍 dataFormated.direccion_seleccionada:', dataFormated.direccion_seleccionada)
    console.log('🔍 forma_de_pago:', restValues.forma_de_pago, 'tipo:', typeof restValues.forma_de_pago)

    setLoading(true)
    try {
      // Usar create o update según el modo
      const response = isEditing
        ? await ventaApi.update(ventaId!, dataFormated)
        : await ventaApi.create(dataFormated)

      console.log('📥 Response completa:', response)
      console.log('📦 response.data:', response.data)
      console.log('📦 response.data?.data:', response.data?.data)

      if (response.error) {
        notification.error({
          message: response.error.message || 'Error al crear venta',
          description: response.error.errors
            ? Object.entries(response.error.errors).map(([key, value]) => `${key}: ${value}`).join('\n')
            : undefined
        })
        return
      }

      // Éxito
      message.success(isEditing ? 'Venta actualizada exitosamente' : 'Venta creada exitosamente')

      console.log(isEditing ? '✅ Venta actualizada exitosamente' : '✅ Venta creada exitosamente')
      console.log('📦 response.data?.data:', response.data?.data)

      // En modo edición, invalidar queries y redirigir
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['venta', ventaId] })
        queryClient.invalidateQueries({ queryKey: ['ventas'] })
        router.push('/ui/facturacion-electronica/mis-ventas')
        return
      }

      // Emitir evento de venta creada (solo en modo creación)
      if (response.data?.data) {
        console.log('📢 Emitiendo evento ventaCreada')
        ventaEvents.emit(response.data.data)
      }

      // ✅ CREAR ENTREGA AUTOMÁTICAMENTE SI ES DESPACHO A DOMICILIO
      const ventaCreada = response.data?.data

      console.log('🔍 DEBUG - Datos de entrega:')
      console.log('  ventaCreada:', ventaCreada ? 'SÍ' : 'NO')
      console.log('  tipo_despacho:', tipo_despacho, '(tipo:', typeof tipo_despacho, ')')
      console.log('  despachador_id:', despachador_id, '(tipo:', typeof despachador_id, ')')
      console.log('  fecha_programada:', fecha_programada)
      console.log('  hora_inicio:', hora_inicio)
      console.log('  hora_fin:', hora_fin)
      console.log('  direccion_entrega:', direccion_entrega)
      console.log('  Condición 1 - ventaCreada:', !!ventaCreada)
      console.log('  Condición 2 - tipo_despacho === "Domicilio":', tipo_despacho === 'Domicilio')
      console.log('  Condición 3 - despachador_id:', !!despachador_id)
      console.log('  ¿Se cumple la condición completa?:', !!(ventaCreada && tipo_despacho === 'Domicilio' && despachador_id))

      if (ventaCreada && tipo_despacho === 'Domicilio' && despachador_id) {
        console.log('🚚 Creando entrega automáticamente...')

        try {
          // Obtener los IDs de unidades derivadas de venta desde la respuesta
          const productosVenta = ventaCreada.productos_por_almacen || []
          const unidadesDerivadas: any[] = []

          productosVenta.forEach((productoAlmacen: any) => {
            if (productoAlmacen.unidades_derivadas) {
              productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                unidadesDerivadas.push({
                  unidad_derivada_venta_id: unidad.id,
                  cantidad_entregada: Number(unidad.cantidad),
                  ubicacion: undefined,
                })
              })
            }
          })

          console.log('📦 Unidades derivadas para entrega:', unidadesDerivadas)

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
            latitud: latitud ? Number(latitud) : undefined,
            longitud: longitud ? Number(longitud) : undefined,
            observaciones: observaciones,
            almacen_salida_id: almacen_id,
            chofer_id: String(despachador_id),
            quien_entrega: QuienEntrega.CHOFER,
            user_id: user_id,
            productos_entregados: unidadesDerivadas,
          }

          console.log('📤 Datos de entrega a enviar:', entregaData)

          // Crear la entrega
          const entregaResponse = await entregaProductoApi.create(entregaData)

          if (entregaResponse.error) {
            console.error('❌ Error al crear entrega:', entregaResponse.error)
            notification.warning({
              message: 'Venta creada pero entrega no pudo ser registrada',
              description: 'La venta se creó correctamente pero hubo un error al registrar la entrega. Puedes crearla manualmente desde "Mis Ventas".',
            })
          } else {
            console.log('✅ Entrega creada automáticamente:', entregaResponse.data)
            message.success('Entrega programada exitosamente para el despachador')

            // 🔔 Enviar notificación push al despachador
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
              console.log('🔔 Notificación enviada al despachador')
            } catch (notifError) {
              console.warn('⚠️ No se pudo enviar notificación push:', notifError)
            }
          }
        } catch (error) {
          console.error('❌ Error al crear entrega automática:', error)
          notification.warning({
            message: 'Venta creada pero entrega no pudo ser registrada',
            description: 'La venta se creó correctamente pero hubo un error al registrar la entrega. Puedes crearla manualmente desde "Mis Ventas".',
          })
        }
      } else if (tipo_despacho === 'Parcial' && ventaCreada) {
        // DESPACHO PARCIAL: entregar solo las cantidades especificadas
        if (cantidades_parciales && cantidades_parciales.some(c => c.entregar > 0)) {
          try {
            const productosVenta = ventaCreada.productos_por_almacen || []
            const unidadesDerivadas: any[] = []

            productosVenta.forEach((productoAlmacen: any) => {
              if (productoAlmacen.unidades_derivadas) {
                productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                  // Buscar la cantidad parcial correspondiente
                  const parcial = cantidades_parciales.find(
                    (c) => c.unidad_derivada_id === unidad.unidad_derivada_normal_id
                  )
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
                tipo_entrega: TipoEntrega.PARCIAL,
                tipo_despacho: TipoDespacho.INMEDIATO,
                estado_entrega: EstadoEntrega.ENTREGADO,
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
                message.success('Entrega parcial registrada exitosamente')

                // ✅ CREAR SEGUNDA ENTREGA PROGRAMADA para el resto (si se configuró)
                if (parcial_resto_programado?.despachador_id) {
                  const unidadesDerivadas2: any[] = []

                  productosVenta.forEach((productoAlmacen: any) => {
                    if (productoAlmacen.unidades_derivadas) {
                      productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                        const parcial = cantidades_parciales.find(
                          (c) => c.unidad_derivada_id === unidad.unidad_derivada_normal_id
                        )
                        if (parcial && (parcial.total - parcial.entregar) > 0) {
                          unidadesDerivadas2.push({
                            unidad_derivada_venta_id: unidad.id,
                            cantidad_entregada: parcial.total - parcial.entregar,
                            ubicacion: undefined,
                          })
                        }
                      })
                    }
                  })

                  if (unidadesDerivadas2.length > 0) {
                    const entregaRestoData: CreateEntregaProductoRequest = {
                      venta_id: ventaCreada.id,
                      tipo_entrega: TipoEntrega.PARCIAL,
                      tipo_despacho: TipoDespacho.PROGRAMADO,
                      estado_entrega: EstadoEntrega.PENDIENTE,
                      fecha_entrega: dayjs().format('YYYY-MM-DD'),
                      fecha_programada: parcial_resto_programado.fecha_programada,
                      hora_inicio: parcial_resto_programado.hora_inicio,
                      hora_fin: parcial_resto_programado.hora_fin,
                      direccion_entrega: parcial_resto_programado.direccion_entrega,
                      observaciones: parcial_resto_programado.observaciones,
                      almacen_salida_id: almacen_id,
                      chofer_id: parcial_resto_programado.despachador_id,
                      quien_entrega: QuienEntrega.CHOFER,
                      user_id: user_id,
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

                      // 🔔 Notificar al despachador del resto
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
                        console.warn('⚠️ No se pudo enviar notificación push al despachador del resto:', notifError)
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
      } else if (tipo_despacho === 'EnTienda' && quien_entrega) {
        console.log('🏪 Creando entrega en tienda automáticamente...')

        try {
          // Obtener los IDs de unidades derivadas de venta desde la respuesta
          const productosVenta = ventaCreada.productos_por_almacen || []
          const unidadesDerivadas: any[] = []

          productosVenta.forEach((productoAlmacen: any) => {
            if (productoAlmacen.unidades_derivadas) {
              productoAlmacen.unidades_derivadas.forEach((unidad: any) => {
                unidadesDerivadas.push({
                  unidad_derivada_venta_id: unidad.id,
                  cantidad_entregada: Number(unidad.cantidad),
                  ubicacion: undefined,
                })
              })
            }
          })

          // Preparar datos de la entrega en tienda
          const entregaData: CreateEntregaProductoRequest = {
            venta_id: ventaCreada.id,
            tipo_entrega: TipoEntrega.RECOJO_EN_TIENDA,
            tipo_despacho: TipoDespacho.INMEDIATO,
            estado_entrega: EstadoEntrega.ENTREGADO, // En tienda se entrega inmediatamente
            fecha_entrega: dayjs().format('YYYY-MM-DD'),
            almacen_salida_id: almacen_id,
            quien_entrega: quien_entrega as QuienEntrega,
            user_id: user_id,
            productos_entregados: unidadesDerivadas,
          }

          console.log('📤 Datos de entrega en tienda a enviar:', entregaData)

          // Crear la entrega
          const entregaResponse = await entregaProductoApi.create(entregaData)

          if (entregaResponse.error) {
            console.error('❌ Error al crear entrega en tienda:', entregaResponse.error)
          } else {
            console.log('✅ Entrega en tienda creada automáticamente:', entregaResponse.data)
          }
        } catch (error) {
          console.error('❌ Error al crear entrega en tienda automática:', error)
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
