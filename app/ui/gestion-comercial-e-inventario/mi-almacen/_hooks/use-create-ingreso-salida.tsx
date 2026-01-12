import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { TipoDocumento } from '@prisma/client'
import { toUTCBD } from '~/utils/fechas'
import {
  FormCreateIngresoSalidaProps,
} from '../_components/modals/modal-create-ingreso-salida'
import { ingresosSalidasApi } from '~/lib/api/ingreso-salida'
import { DataDocIngresoSalida } from '../_components/docs/doc-ingreso-salida'

export default function useCreateIngresoSalida({
  tipo_documento,
  onSuccess,
}: {
  tipo_documento: TipoDocumento
  onSuccess?: (res: DataDocIngresoSalida) => void
}) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { notification } = App.useApp()

  async function crearIngresoSalidaForm(values: FormCreateIngresoSalidaProps) {
    setLoading(true)
    try {
      // Convertir TipoDocumento a 'Ingreso' o 'Salida' para el API
      const tipoDocumentoApi: 'Ingreso' | 'Salida' =
        tipo_documento === TipoDocumento.Ingreso ? 'Ingreso' : 'Salida'

      const data = {
        ...values,
        tipo_documento: tipoDocumentoApi,
        fecha: values.fecha
          ? toUTCBD({
              date: values.fecha,
            })
          : undefined,
      }

      const res = await ingresosSalidasApi.create(data)

      console.log('📦 Respuesta completa de la API:', res)
      console.log('📦 res.data:', res.data)
      console.log('📦 res.data.data:', (res.data as any)?.data)

      if (res.error) {
        notification.error({
          message: 'Error',
          description: res.error.message,
        })
        return
      }

      notification.success({
        message: `${tipo_documento === TipoDocumento.Ingreso ? 'Ingreso' : 'Salida'} creado exitosamente`,
      })

      // Convertir el response de Laravel al formato Prisma
      // Laravel devuelve { data: {...} } y apiRequest lo envuelve en { data: { data: {...} } }
      const ingresoSalidaData = (res.data as any)?.data
      
      console.log('📦 ingresoSalidaData:', ingresoSalidaData)
      console.log('📦 productos_por_almacen:', ingresoSalidaData?.productos_por_almacen)
      
      if (!ingresoSalidaData) {
        console.error('❌ No se recibieron datos del ingreso/salida:', res)
        throw new Error('No se recibieron datos del servidor')
      }
      
      const transformedData = {
        ...ingresoSalidaData,
        tipo_documento: tipo_documento, // Usar el tipo original de Prisma
      }

      console.log('📦 transformedData que se pasará a onSuccess:', transformedData)

      // Llamar onSuccess primero
      onSuccess?.(transformedData as unknown as DataDocIngresoSalida)

      // Actualizar el stock del producto específico en la caché DESPUÉS de onSuccess
      // Para evitar que errores en el caché impidan mostrar el documento
      if (ingresoSalidaData?.productos_por_almacen?.[0]?.producto_almacen) {
        try {
          const productoActualizado = ingresoSalidaData.productos_por_almacen[0].producto_almacen
          
          // Actualizar todas las queries de productos que contengan este producto
          queryClient.setQueriesData(
            {
              predicate: (query) =>
                query.queryKey[0] === 'productos-by-almacen' ||
                query.queryKey[0] === 'productos-search',
            },
            (oldData: any) => {
              if (!oldData?.data) return oldData

              // Actualizar el producto en el array
              return {
                ...oldData,
                data: oldData.data.map((producto: any) => {
                  // Si es el producto que acabamos de modificar, actualizar su stock
                  if (producto.id === productoActualizado.producto_id) {
                    return {
                      ...producto,
                      producto_en_almacenes: producto.producto_en_almacenes?.map((pa: any) => {
                        if (pa.id === productoActualizado.id) {
                          return {
                            ...pa,
                            stock_fraccion: productoActualizado.stock_fraccion,
                            costo: productoActualizado.costo,
                          }
                        }
                        return pa
                      }),
                    }
                  }
                  return producto
                }),
              }
            }
          )
        } catch (cacheError) {
          // Si falla la actualización del caché, solo loguearlo pero no fallar
          console.warn('⚠️ Error al actualizar caché:', cacheError)
        }
      }
    } catch (error) {
      console.error('Error en crearIngresoSalidaForm:', error)
      notification.error({
        message: 'Error',
        description: 'Error al procesar la solicitud',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    crearIngresoSalidaForm,
    loading: loading,
  }
}
