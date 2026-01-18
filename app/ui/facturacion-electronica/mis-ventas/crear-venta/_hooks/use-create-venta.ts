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

type ProductoAgrupado = Pick<
  FormCreateVenta['productos'][number],
  'producto_id' | 'marca_name' | 'producto_name'
> & {
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
  const mapa = new Map<number, ProductoAgrupado>()
  for (const p of productos) {
    if (!mapa.has(p.producto_id)) {
      mapa.set(p.producto_id, {
        producto_id: p.producto_id,
        marca_name: p.marca_name,
        producto_name: p.producto_name,
        unidades_derivadas: [],
      })
    }
    const grupo = mapa.get(p.producto_id)!
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

export default function useCreateVenta() {
  const router = useRouter()
  const { user } = useAuth()
  const user_id = user?.id
  const { notification, message } = useApp()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = useCallback(async (values: FormCreateVenta) => {
    console.log('🚀 ~ handleSubmit ~ values:', values)
    console.log('🔍 DEBUG - direccion_seleccionada:', values.direccion_seleccionada)
    console.log('🔍 DEBUG - direccion:', values.direccion)

    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })
    
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
      direccion_seleccionada, // ✅ Ahora SÍ se usará
      ruc_dni,
      telefono,
      ...restValues
    } = values
    

    
    if (!productos || productos.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto',
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

    // Agrupar productos por producto_id
    const productos_agrupados = agruparProductos({ productos })

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
      productos_por_almacen: productos_por_almacen,
      // Agregar métodos de pago si existen
      despliegue_de_pago_ventas: metodos_de_pago && metodos_de_pago.length > 0
        ? metodos_de_pago
        : undefined,
    }

    console.log('📤 Datos a enviar a Laravel:', JSON.stringify(dataFormated, null, 2))
    console.log('🔍 dataFormated.direccion_seleccionada:', dataFormated.direccion_seleccionada)
    console.log('🔍 forma_de_pago:', restValues.forma_de_pago, 'tipo:', typeof restValues.forma_de_pago)
    
    setLoading(true)
    try {
      // Usar la API de Laravel en lugar del action de Prisma
      const response = await ventaApi.create(dataFormated)

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
      message.success('Venta creada exitosamente')

      console.log('✅ Venta creada exitosamente')
      console.log('📦 response.data?.data:', response.data?.data)

      // Emitir evento de venta creada
      if (response.data?.data) {
        console.log('📢 Emitiendo evento ventaCreada')
        ventaEvents.emit(response.data.data)
      }

      // Actualizar caché de productos para bloquear botón eliminar
      // Obtener IDs de productos vendidos
      const productosVendidosIds = productos.map((p) => p.producto_id)
      const uniqueProductoIds = [...new Set(productosVendidosIds)]

      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === 'productos-by-almacen' ||
            query.queryKey[0] === 'productos-search',
        },
        (oldData: any) => {
          if (!oldData?.data) return oldData

          return {
            ...oldData,
            data: oldData.data.map((producto: any) => {
              if (uniqueProductoIds.includes(producto.id)) {
                return {
                  ...producto,
                  tiene_ingresos: true, // Bloquear botón eliminar inmediatamente
                }
              }
              return producto
            }),
          }
        }
      )
    } catch (error) {
      console.error('Error al crear venta:', error)
      notification.error({
        message: 'Error inesperado al crear venta',
      })
    } finally {
      setLoading(false)
    }
  }, [router, user_id, notification, message, almacen_id, queryClient])

  return { handleSubmit, loading }
}
