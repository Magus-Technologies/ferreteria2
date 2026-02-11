import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useAuth } from '~/lib/auth-context'
import { agruparProductos } from '../crear-compra/_hooks/use-create-compra'
import { FormCreateRecepcionAlmacen } from '../_components/modals/modal-crear-recepcion-almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { recepcionAlmacenApi } from '~/lib/api/recepcion-almacen'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import dayjs from 'dayjs'

export default function useCreateRecepcionAlmacen({
  compra_id,
  onSuccess,
}: {
  compra_id: string | undefined
  onSuccess?: () => void
}) {
  const { user } = useAuth()
  const user_id = user?.id

  const { notification, message } = useApp()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const mutation = useMutation({
    mutationFn: async (values: FormCreateRecepcionAlmacen) => {
      if (!user_id) throw new Error('No hay un usuario seleccionado')
      if (!almacen_id) throw new Error('No hay un almacen seleccionado')
      if (!compra_id) throw new Error('No hay una compra seleccionada')

      const { productos, fecha, ...rest } = values

      // Agrupar productos por producto_id
      const productos_agrupados = agruparProductos({ productos })

      // Transformar al formato que espera el backend Laravel
      const productos_por_almacen = productos_agrupados.map(p => {
        const unidad_derivada = p.unidades_derivadas[0]
        const costo_unidad =
          unidad_derivada.precio_compra /
          Number(unidad_derivada.unidad_derivada_factor)

        return {
          producto_id: p.producto_id,
          almacen_id: almacen_id,
          costo: costo_unidad,
          unidades_derivadas: p.unidades_derivadas.map(u => ({
            unidad_derivada_name: u.unidad_derivada_name,
            factor: Number(u.unidad_derivada_factor),
            cantidad: Number(u.cantidad),
            lote: u.lote || null,
            vencimiento: u.vencimiento
              ? dayjs(u.vencimiento).format('YYYY-MM-DD')
              : null,
            flete: Number(u.flete || 0),
            bonificacion: u.bonificacion || false,
          })),
        }
      })

      const result = await recepcionAlmacenApi.create({
        compra_id,
        user_id,
        fecha: dayjs(fecha).format('YYYY-MM-DD HH:mm:ss'),
        observaciones: rest.observaciones || undefined,
        transportista_razon_social: rest.transportista_razon_social || undefined,
        transportista_ruc: rest.transportista_ruc || undefined,
        transportista_placa: rest.transportista_placa || undefined,
        transportista_licencia: rest.transportista_licencia || undefined,
        transportista_dni: rest.transportista_dni || undefined,
        transportista_name: rest.transportista_name || undefined,
        transportista_guia_remision: rest.transportista_guia_remision || undefined,
        productos_por_almacen,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })
      message.success('Recepción de almacén creada exitosamente')
      onSuccess?.()
    },
    onError: (error: Error) => {
      notification.error({
        message: 'Error al crear recepción',
        description: error.message || 'Error al procesar la solicitud',
      })
    },
  })

  async function handleSubmit(values: FormCreateRecepcionAlmacen) {
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })
    if (!compra_id)
      return notification.error({ message: 'No hay una compra seleccionada' })

    setLoading(true)
    mutation.mutate(values, {
      onSettled: () => setLoading(false),
    })
  }

  return {
    handleSubmit,
    loading: loading || mutation.isPending,
  }
}
