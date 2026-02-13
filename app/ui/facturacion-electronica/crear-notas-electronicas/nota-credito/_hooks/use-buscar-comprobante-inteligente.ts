import { useState, useCallback, useEffect } from 'react'
import { facturacionElectronicaApi } from '~/lib/api/facturacion-electronica'
import { FormInstance } from 'antd'
import { FormCreateNotaCredito } from '../_components/body-crear-nota-credito'
import useApp from 'antd/es/app/useApp'
import { useDebounce } from 'use-debounce'

/**
 * Hook para búsqueda inteligente de comprobantes
 * - Si detecta formato de comprobante (B01-1, F001-123), busca directamente
 * - Si detecta texto general (nombre cliente), abre modal de búsqueda
 */
export default function useBuscarComprobanteInteligente(form: FormInstance<FormCreateNotaCredito>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebounce(searchQuery, 800)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const { notification } = useApp()

  // Detectar si es un formato de comprobante (B01-1, F001-123, etc.)
  const esFormatoComprobante = (query: string): boolean => {
    // Formato: letra(s) + números + guión + números
    // Ejemplos: B01-1, F001-123, B001-00000001
    const regex = /^[A-Z]+\d+-\d+$/i
    return regex.test(query.trim())
  }

  // Buscar comprobante directamente por serie-número
  const buscarComprobanteDirecto = useCallback(
    async (query: string) => {
      try {
        setIsSearching(true)
        const response = await facturacionElectronicaApi.buscarComprobantes({
          query: query.trim(),
          limit: 1,
        })

        if (response.error) {
          notification.error({
            message: 'Error al buscar comprobante',
            description: response.error.message,
          })
          return
        }

        const comprobantes = response.data?.data || []
        
        if (comprobantes.length === 0) {
          notification.warning({
            message: 'Comprobante no encontrado',
            description: `No se encontró el comprobante "${query}"`,
          })
          return
        }

        // Cargar el comprobante encontrado
        await cargarComprobante(comprobantes[0].id)
      } catch (error) {
        console.error('Error al buscar comprobante:', error)
        notification.error({
          message: 'Error al buscar comprobante',
        })
      } finally {
        setIsSearching(false)
      }
    },
    [notification]
  )

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

        // Validar que el comprobante tenga venta_id
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
        
        form.setFieldsValue({
          venta_id: ventaIdString,
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

        // Cargar productos del comprobante
        if (comprobante.detalles && comprobante.detalles.length > 0) {
          const productos = comprobante.detalles.map((detalle: any) => ({
            codigo: detalle.codigo_producto || '',
            descripcion: detalle.descripcion || '',
            unidad_medida: detalle.unidad_medida || 'NIU',
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

        // Limpiar el campo de búsqueda
        setSearchQuery('')
      } catch (error) {
        console.error('Error al cargar comprobante:', error)
        notification.error({
          message: 'Error al cargar comprobante',
        })
      }
    },
    [form, notification]
  )

  // Efecto para búsqueda automática cuando se escribe
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 3) {
      return
    }

    const query = debouncedQuery.trim()

    // Si es formato de comprobante, buscar directamente
    if (esFormatoComprobante(query)) {
      buscarComprobanteDirecto(query)
    } else {
      // Si es texto general, abrir modal para búsqueda personalizada
      setModalOpen(true)
    }
  }, [debouncedQuery, buscarComprobanteDirecto])

  return {
    searchQuery,
    setSearchQuery,
    modalOpen,
    setModalOpen,
    cargarComprobante,
    isSearching,
  }
}
