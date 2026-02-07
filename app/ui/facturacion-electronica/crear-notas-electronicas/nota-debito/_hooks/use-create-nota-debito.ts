import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import useApp from 'antd/es/app/useApp'
import { useAuth } from '~/lib/auth-context'
import { useStoreAlmacen } from '~/store/store-almacen'
import { facturacionElectronicaApi, type CrearNotaDebitoData } from '~/lib/api/facturacion-electronica'
import { FormCreateNotaDebito } from '../_components/body-crear-nota-debito'

export default function useCreateNotaDebito() {
  const router = useRouter()
  const { user } = useAuth()
  const user_id = user?.id
  const { notification, message } = useApp()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (values: FormCreateNotaDebito) => {
      console.log('🚀 ~ handleSubmit ~ values:', values)

      if (!user_id) {
        return notification.error({ message: 'No hay un usuario seleccionado' })
      }
      if (!almacen_id) {
        return notification.error({ message: 'No hay un almacén seleccionado' })
      }

      const { productos, fecha_emision, tipo_de_cambio, ...restValues } = values

      if (!productos || productos.length === 0) {
        return notification.error({
          message: 'Por favor, ingresa al menos un producto',
        })
      }

      // Calcular totales
      const subtotal = productos.reduce((sum, p) => sum + (p.subtotal || 0), 0)
      const igv = subtotal * 0.18
      const total = subtotal + igv

      // Transformar productos al formato del backend
      const items = productos.map((p) => ({
        producto_id: p.producto_id!,
        unidad_derivada_id: p.unidad_derivada_id!,
        cantidad: Number(p.cantidad),
        precio_unitario: Number(p.precio_unitario),
        subtotal: Number(p.subtotal),
        igv: Number(p.subtotal) * 0.18,
        total: Number(p.subtotal) * 1.18,
      }))

      // Construir request para Laravel
      const dataFormated: CrearNotaDebitoData = {
        venta_id: restValues.cliente_id!, // TODO: Cambiar por venta_id real cuando se implemente búsqueda
        motivo_id: restValues.motivo_nota_id,
        serie: restValues.serie_documento_modifica, // TODO: Obtener serie correcta
        almacen_id: almacen_id,
        descripcion: restValues.motivo_descripcion || '',
        monto_total: total,
        monto_igv: igv,
        monto_subtotal: subtotal,
        fecha: fecha_emision.format('YYYY-MM-DD HH:mm:ss'),
        observaciones: restValues.observaciones,
        items: items,
      }

      console.log('📤 Datos a enviar a Laravel:', JSON.stringify(dataFormated, null, 2))

      setLoading(true)
      try {
        const response = await facturacionElectronicaApi.crearNotaDebito(dataFormated)

        if (response.error) {
          notification.error({
            message: response.error.message || 'Error al crear nota de débito',
            description: response.error.errors
              ? Object.entries(response.error.errors)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n')
              : undefined,
          })
          return
        }

        // Éxito
        message.success('Nota de débito creada exitosamente')
        console.log('✅ Nota de débito creada:', response.data?.data)

        // Redirigir a la lista de notas de débito
        router.push('/ui/facturacion-electronica/mis-notas-debito')
      } catch (error) {
        console.error('Error al crear nota de débito:', error)
        notification.error({
          message: 'Error inesperado al crear nota de débito',
        })
      } finally {
        setLoading(false)
      }
    },
    [router, user_id, notification, message, almacen_id]
  )

  return { handleSubmit, loading }
}
