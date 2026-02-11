import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import useApp from 'antd/es/app/useApp'
import { useAuth } from '~/lib/auth-context'
import { useStoreAlmacen } from '~/store/store-almacen'
import { facturacionElectronicaApi, type CrearNotaDebitoData } from '~/lib/api/facturacion-electronica'
import { FormCreateNotaDebito } from '../_components/body-crear-nota-debito'
import { FormInstance } from 'antd'

export default function useCreateNotaDebito(form?: FormInstance<FormCreateNotaDebito>) {
  const router = useRouter()
  const { user } = useAuth()
  const user_id = user?.id
  const { notification, message } = useApp()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (values: FormCreateNotaDebito) => {
      console.log('🚀 ~ handleSubmit ~ values:', values)
      console.log('🔍 [DEBUG handleSubmit] Todos los valores del formulario:', values)
      console.log('🔍 [DEBUG handleSubmit] values.venta_id:', values.venta_id, 'tipo:', typeof values.venta_id)
      console.log('🔍 [DEBUG handleSubmit] Verificación booleana:', !!values.venta_id)
      
      // También verificar directamente desde el form
      const ventaIdFromForm = form?.getFieldValue('venta_id')
      console.log('🔍 [DEBUG handleSubmit] venta_id desde form.getFieldValue:', ventaIdFromForm, 'tipo:', typeof ventaIdFromForm)
      console.log('🔍 [DEBUG handleSubmit] Todos los valores desde form.getFieldsValue:', form?.getFieldsValue())

      if (!user_id) {
        return notification.error({ message: 'No hay un usuario seleccionado' })
      }
      if (!almacen_id) {
        return notification.error({ message: 'No hay un almacén seleccionado' })
      }
      
      // Usar el valor del form si values.venta_id está undefined
      const ventaId = values.venta_id || ventaIdFromForm
      console.log('🔍 [DEBUG handleSubmit] ventaId final a usar:', ventaId)
      
      if (!ventaId) {
        return notification.error({ 
          message: 'Venta no encontrada',
          description: 'Debe seleccionar un comprobante válido primero'
        })
      }

      const { productos, fecha_emision, tipo_de_cambio, ...restValues } = values

      if (!productos || productos.length === 0) {
        return notification.error({
          message: 'Por favor, ingresa al menos un producto',
        })
      }

      // Calcular totales
      // IMPORTANTE: p.subtotal en la tabla incluye IGV (cantidad * precio_con_igv)
      // Necesitamos extraer el valor sin IGV
      const totalConIgv = productos.reduce((sum, p) => sum + (p.subtotal || 0), 0)
      const subtotal = totalConIgv / 1.18 // Valor sin IGV
      const igv = totalConIgv - subtotal // IGV = Total - Subtotal
      const total = totalConIgv

      // Transformar productos al formato del backend
      const items = productos.map((p) => {
        const totalConIgv = Number(p.subtotal) // cantidad * precio_con_igv
        const valorVenta = totalConIgv / 1.18 // Valor sin IGV
        const igvItem = totalConIgv - valorVenta
        
        return {
          producto_id: p.producto_id!,
          unidad_derivada_id: p.unidad_derivada_id!,
          codigo: p.codigo || p.producto_codigo || '',
          descripcion: p.descripcion || p.producto_name || '',
          cantidad: Number(p.cantidad),
          precio_unitario: Number(p.precio_unitario || p.precio_venta || 0),
          valor_venta: valorVenta, // Valor sin IGV
          subtotal: valorVenta, // Backend espera subtotal sin IGV
          igv: igvItem,
          total: totalConIgv,
        }
      })

      // Auto-generar descripción si está vacía
      let descripcion = restValues.observaciones || restValues.motivo_descripcion || ''
      if (!descripcion || descripcion.trim() === '') {
        // Generar descripción automática basada en el motivo
        const tipoDoc = restValues.tipo_documento_modifica === '01' ? 'Factura' : 'Boleta'
        descripcion = `Nota de débito por ${tipoDoc} ${restValues.serie_documento_modifica}-${restValues.numero_documento_modifica}`
      }

      // Construir request para Laravel - USAR ventaId en lugar de values.venta_id
      // IMPORTANTE: serie debe ser la serie de la ND (BD01), NO la del comprobante original
      const dataFormated: CrearNotaDebitoData = {
        venta_id: ventaId, // Usar el valor que obtuvimos del form
        motivo_id: restValues.motivo_nota_id,
        serie: 'BD01', // ✅ Serie de Nota de Débito (NO usar serie_documento_modifica que es B001)
        almacen_id: almacen_id,
        descripcion: descripcion, // Usar descripción generada o del formulario
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
    [router, user_id, notification, message, almacen_id, form]
  )

  return { handleSubmit, loading }
}
