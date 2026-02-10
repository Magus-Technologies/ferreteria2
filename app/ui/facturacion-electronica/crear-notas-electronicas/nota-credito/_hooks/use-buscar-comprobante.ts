import { useState, useCallback } from 'react'
import { facturacionElectronicaApi } from '~/lib/api/facturacion-electronica'
import { FormInstance } from 'antd'
import { FormCreateNotaCredito } from '../_components/body-crear-nota-credito'
import useApp from 'antd/es/app/useApp'

export default function useBuscarComprobante(form: FormInstance<FormCreateNotaCredito>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<'01' | '03' | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const { notification } = useApp()

  // Cargar datos del comprobante seleccionado
  const cargarComprobante = useCallback(
    async (comprobanteId: number) => {
      try {
        const response = await facturacionElectronicaApi.getComprobanteById(comprobanteId)
        
        if (response.error) {
          notification.error({
            message: 'Error al cargar comprobante',
            description: response.error.message,
          })
          return
        }

        const comprobante = response.data?.data
        if (!comprobante) {
          notification.error({ message: 'Comprobante no encontrado' })
          return
        }

        console.log('🔍 [DEBUG cargarComprobante] comprobante completo:', comprobante)
        console.log('🔍 [DEBUG cargarComprobante] comprobante.venta_id:', comprobante.venta_id, 'tipo:', typeof comprobante.venta_id)

        // ⚠️ VALIDAR que el comprobante tenga venta_id
        if (!comprobante.venta_id) {
          notification.error({
            message: 'Comprobante sin venta asociada',
            description: `El comprobante ${comprobante.serie}-${comprobante.numero} no tiene una venta asociada. Solo se pueden crear notas de crédito para comprobantes con venta asociada.`,
            duration: 6,
          })
          return
        }

        // Cargar datos del cliente y venta
        const ventaIdString = String(comprobante.venta_id)
        console.log('🔍 [DEBUG cargarComprobante] ventaIdString después de conversión:', ventaIdString, 'tipo:', typeof ventaIdString)
        
        form.setFieldsValue({
          venta_id: ventaIdString, // Convertir a string
          tipo_documento_modifica: comprobante.tipo_comprobante as '01' | '03',
          serie_documento_modifica: comprobante.serie,
          numero_documento_modifica: String(comprobante.numero),
          cliente_id: comprobante.cliente?.id,
          cliente_tipo_documento: comprobante.cliente?.tipo_documento,
          cliente_numero_documento: comprobante.cliente?.numero_documento,
          cliente_nombre: comprobante.cliente?.nombre,
          cliente_direccion: comprobante.cliente?.direccion,
          cliente_telefono: comprobante.cliente?.telefono,
          cliente_email: comprobante.cliente?.email,
          tipo_moneda: comprobante.tipo_moneda as 'PEN' | 'USD',
        })

        console.log('🔍 [DEBUG cargarComprobante] Valores del formulario después de setFieldsValue:')
        console.log('  - venta_id:', form.getFieldValue('venta_id'))
        console.log('  - tipo_documento_modifica:', form.getFieldValue('tipo_documento_modifica'))
        console.log('  - serie_documento_modifica:', form.getFieldValue('serie_documento_modifica'))

        // Cargar productos del comprobante
        if (comprobante.detalles && comprobante.detalles.length > 0) {
          const productos = comprobante.detalles.map((detalle: any) => ({
            // Usar campos directos de la tabla comprobante_electronico_detalles
            codigo: detalle.codigo_producto || '', // Campo directo de la tabla
            descripcion: detalle.descripcion || '', // Campo directo de la tabla
            unidad_medida: detalle.unidad_medida || 'NIU', // Campo directo de la tabla (código SUNAT)
            cantidad: Number(detalle.cantidad),
            precio_unitario: Number(detalle.precio_unitario),
            precio_venta: Number(detalle.precio_unitario),
            subtotal: Number(detalle.cantidad) * Number(detalle.precio_unitario),
          }))

          form.setFieldValue('productos', productos)
        }

        notification.success({
          message: 'Comprobante cargado',
          description: `${comprobante.tipo_comprobante === '01' ? 'Factura' : 'Boleta'} ${comprobante.serie}-${comprobante.numero}`,
        })

      } catch (error) {
        console.error('Error al cargar comprobante:', error)
        notification.error({
          message: 'Error al cargar comprobante',
        })
      }
    },
    [form, notification]
  )

  return {
    searchQuery,
    setSearchQuery,
    tipoDocumento,
    setTipoDocumento,
    modalOpen,
    setModalOpen,
    cargarComprobante,
  }
}
