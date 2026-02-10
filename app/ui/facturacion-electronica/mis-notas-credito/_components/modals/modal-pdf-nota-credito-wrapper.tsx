import { useMemo } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocNotaCredito, { NotaCreditoDataPDF, ProductoNotaCreditoPDF } from '../docs/doc-nota-credito'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { useStoreModalPdfNotaCredito } from '../../_store/store-modal-pdf-nota-credito'
import { useQuery } from '@tanstack/react-query'
import { facturacionElectronicaApi, NotaCredito } from '~/lib/api/facturacion-electronica'

// ============= COMPONENT =============

export default function ModalPdfNotaCreditoWrapper() {
  const open = useStoreModalPdfNotaCredito((state) => state.open)
  const notaCreditoId = useStoreModalPdfNotaCredito((state) => state.notaCreditoId)
  const closeModal = useStoreModalPdfNotaCredito((state) => state.closeModal)
  const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresaPublica()

  // Cargar datos de la nota de crédito cuando se abre el modal
  const { data: responseData, isLoading: isLoadingNotaCredito } = useQuery({
    queryKey: ['nota-credito-pdf', notaCreditoId],
    queryFn: async () => {
      if (!notaCreditoId) return null
      // Usar el endpoint de PDF que carga todas las relaciones necesarias
      const response = await facturacionElectronicaApi.generarPdfNotaCredito(notaCreditoId)
      console.log('📡 Respuesta del backend (PDF):', response)
      return response.data // ApiResponse<NotaCredito> -> NotaCredito
    },
    enabled: open && !!notaCreditoId,
  })

  const notaCreditoData = responseData

  // Transformar datos de Laravel a formato PDF
  const pdfData = useMemo(() => {
    if (!notaCreditoData) return undefined
    console.log('📄 Datos de nota de crédito recibidos:', notaCreditoData)
    const transformed = transformNotaCreditoData(notaCreditoData)
    console.log('✅ Datos transformados para PDF:', transformed)
    return transformed
  }, [notaCreditoData])

  if (!open) return null

  const isLoading = isLoadingEmpresa || isLoadingNotaCredito

  if (isLoading) {
    return (
      <Modal
        open={open}
        onCancel={closeModal}
        footer={null}
        centered
      >
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
          <span className="ml-3">Cargando nota de crédito...</span>
        </div>
      </Modal>
    )
  }

  if (!pdfData) {
    return (
      <Modal
        open={open}
        onCancel={closeModal}
        footer={null}
        centered
      >
        <div className="flex items-center justify-center py-8">
          <span>No se encontraron datos de la nota de crédito</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalShowDoc
      open={open}
      setOpen={closeModal}
      nro_doc={pdfData.numero}
    >
      <DocNotaCredito
        data={pdfData}
        nro_doc={pdfData.numero}
        empresa={empresa}
      />
    </ModalShowDoc>
  )
}

// ============= HELPERS =============

/**
 * Transforma los datos de la nota de crédito de Laravel al formato esperado por el PDF
 */
function transformNotaCreditoData(notaCredito: NotaCredito): NotaCreditoDataPDF {
  console.log('🔍 Transformando nota de crédito:', {
    id: notaCredito.id,
    serie: notaCredito.serie,
    numero: notaCredito.numero,
    comprobante_electronico: notaCredito.comprobante_electronico,
    venta: notaCredito.venta,
  })

  const comprobanteRef = notaCredito.comprobante_electronico
  const clienteVenta = notaCredito.venta?.cliente

  // ⚠️ CASO 1: Si existe comprobante de referencia, usar sus datos
  if (comprobanteRef && comprobanteRef.detalles && comprobanteRef.detalles.length > 0) {
    console.log('✅ Usando datos del comprobante de referencia')
    
    const productos: ProductoNotaCreditoPDF[] = comprobanteRef.detalles.map((detalle: any) => ({
      codigo: detalle.codigo_producto || '',
      descripcion: detalle.descripcion || '',
      cantidad: Number(detalle.cantidad) || 0,
      unidad: detalle.unidad_medida || 'UND',
      precio_unitario: Number(detalle.precio_unitario) || 0,
      subtotal: Number(detalle.valor_venta || detalle.subtotal) || 0,
    }))

    const total = Number(notaCredito.monto_total) || 0
    const subtotal = Number(notaCredito.monto_subtotal) || (total / 1.18)
    const igv = Number(notaCredito.monto_igv) || (total - subtotal)

    return {
      id: notaCredito.id,
      numero: notaCredito.numero_completo || `${notaCredito.serie}-${notaCredito.numero}`,
      fecha: notaCredito.fecha_emision,
      motivo: notaCredito.motivo_nota?.descripcion || 'Sin motivo especificado',
      comprobante_afectado: {
        tipo: getTipoComprobanteLabel(comprobanteRef.tipo_comprobante || ''),
        numero: comprobanteRef.numero || notaCredito.referencia_documento || 'N/A',
      },
      cliente: {
        numero_documento: comprobanteRef.cliente_numero_documento || '',
        razon_social: comprobanteRef.cliente_razon_social || '',
        nombres: '',
        apellidos: '',
        direccion: comprobanteRef.cliente_direccion || '',
      },
      productos,
      subtotal,
      igv,
      total,
      observaciones: notaCredito.observaciones,
    }
  }

  // ⚠️ CASO 2: Si NO existe comprobante de referencia, usar datos de la venta
  console.warn('⚠️ No se encontró comprobante de referencia, usando datos de la venta')
  
  // Crear un producto genérico con el monto total
  const total = Number(notaCredito.monto_total) || 0
  const subtotal = Number(notaCredito.monto_subtotal) || (total / 1.18)
  const igv = Number(notaCredito.monto_igv) || (total - subtotal)

  const productos: ProductoNotaCreditoPDF[] = [{
    codigo: 'N/A',
    descripcion: notaCredito.descripcion || 'Nota de Crédito',
    cantidad: 1,
    unidad: 'UND',
    precio_unitario: subtotal,
    subtotal: subtotal,
  }]

  // Obtener datos del cliente de la venta
  const numeroDocumento = clienteVenta?.numero_documento || 'N/A'
  const razonSocial = clienteVenta?.razon_social || 
                      (clienteVenta?.nombres && clienteVenta?.apellidos 
                        ? `${clienteVenta.nombres} ${clienteVenta.apellidos}` 
                        : 'Cliente no especificado')

  console.log('👤 Datos del cliente desde venta:', {
    numeroDocumento,
    razonSocial,
    direccion: clienteVenta?.direccion,
  })

  return {
    id: notaCredito.id,
    numero: notaCredito.numero_completo || `${notaCredito.serie}-${notaCredito.numero}`,
    fecha: notaCredito.fecha_emision,
    motivo: notaCredito.motivo_nota?.descripcion || 'Sin motivo especificado',
    comprobante_afectado: {
      tipo: 'COMPROBANTE',
      numero: notaCredito.referencia_documento || 'N/A',
    },
    cliente: {
      numero_documento: numeroDocumento,
      razon_social: razonSocial,
      nombres: clienteVenta?.nombres || '',
      apellidos: clienteVenta?.apellidos || '',
      direccion: clienteVenta?.direccion || '',
    },
    productos,
    subtotal,
    igv,
    total,
    observaciones: notaCredito.observaciones,
  }
}

/**
 * Obtiene el label del tipo de comprobante
 */
function getTipoComprobanteLabel(codigo: string): string {
  const mapping: Record<string, string> = {
    '01': 'FACTURA',
    '03': 'BOLETA',
  }
  return mapping[codigo] || codigo
}
