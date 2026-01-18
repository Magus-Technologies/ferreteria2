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

      // Laravel devuelve { data: {...} } y apiRequest lo envuelve en { data: { data: {...} } }
      const ingresoSalidaData = (res.data as any)?.data

      if (!ingresoSalidaData) {
        throw new Error('No se recibieron datos del servidor')
      }

      const transformedData = {
        ...ingresoSalidaData,
        tipo_documento: tipo_documento, // Usar el tipo original de Prisma para compatibilidad
      }

      // Llamar onSuccess primero
      onSuccess?.(transformedData as unknown as DataDocIngresoSalida)

      // Actualizar el stock del producto específico en la caché
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

              return {
                ...oldData,
                data: oldData.data.map((producto: any) => {
                  if (producto.id === productoActualizado.producto_id) {
                    return {
                      ...producto,
                      tiene_ingresos: true, // Bloquear botón eliminar inmediatamente
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
        } catch {
          // Si falla la actualización del caché, no fallar silenciosamente
        }
      }
    } catch {
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
