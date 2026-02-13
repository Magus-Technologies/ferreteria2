import { useMemo } from 'react'
import { Spin, Modal } from 'antd'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import DocNotaDebito, { NotaDebitoDataPDF, ProductoNotaDebitoPDF } from '../docs/doc-nota-debito'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { useStoreModalPdfNotaDebito } from '../../_store/store-modal-pdf-nota-debito'
import { useQuery } from '@tanstack/react-query'
import { facturacionElectronicaApi, NotaDebito } from '~/lib/api/facturacion-electronica'

// ============= COMPONENT =============

export default function ModalPdfNotaDebitoWrapper() {
    const open = useStoreModalPdfNotaDebito((state) => state.open)
    const notaDebitoId = useStoreModalPdfNotaDebito((state) => state.notaDebitoId)
    const closeModal = useStoreModalPdfNotaDebito((state) => state.closeModal)
    const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresaPublica()

    // Cargar datos de la nota de débito cuando se abre el modal
    const { data: responseData, isLoading: isLoadingNotaDebito } = useQuery({
        queryKey: ['nota-debito-pdf', notaDebitoId],
        queryFn: async () => {
            if (!notaDebitoId) return null
            const response = await facturacionElectronicaApi.getNotaDebitoById(notaDebitoId)
            console.log('📡 Respuesta del backend (PDF Nota Débito):', response)
            const data = response.data as any
            return data?.data || data
        },
        enabled: open && !!notaDebitoId,
    })

    const notaDebitoData = responseData

    // Transformar datos de Laravel a formato PDF
    const pdfData = useMemo(() => {
        if (!notaDebitoData) return undefined
        console.log('📄 Datos de nota de débito recibidos:', JSON.stringify(notaDebitoData, null, 2))
        const transformed = transformNotaDebitoData(notaDebitoData)
        console.log('✅ Datos transformados para PDF:', JSON.stringify(transformed, null, 2))
        return transformed
    }, [notaDebitoData])

    if (!open) return null

    const isLoading = isLoadingEmpresa || isLoadingNotaDebito

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
                    <span className="ml-3">Cargando nota de débito...</span>
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
                    <span>No se encontraron datos de la nota de débito</span>
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
            <DocNotaDebito
                data={pdfData}
                nro_doc={pdfData.numero}
                empresa={empresa}
            />
        </ModalShowDoc>
    )
}

// ============= HELPERS =============

/**
 * Transforma los datos de la nota de débito de Laravel al formato esperado por el PDF
 */
/**
 * Transforma los datos de la nota de débito de Laravel al formato esperado por el PDF
 */
function transformNotaDebitoData(notaDebito: any): NotaDebitoDataPDF {
    console.log('🔍 Transformando nota de débito:', {
        id: notaDebito.id,
        serie: notaDebito.serie,
        numero: notaDebito.numero,
        comprobante_referencia: notaDebito.comprobante_referencia,
        comprobante_electronico: notaDebito.comprobante_electronico,
        venta: notaDebito.venta,
    })

    // El comprobante afectado (referencia) contiene los detalles y datos del cliente
    // La API devuelve 'comprobante_referencia' o 'venta'
    const comprobanteAfectado = notaDebito.comprobante_referencia || notaDebito.venta?.comprobante_electronico || null
    const comprobanteElectronico = notaDebito.comprobante_electronico
    const venta = notaDebito.venta

    // Calcular totales
    const total = Number(notaDebito.total || notaDebito.monto_total) || 0
    const subtotal = Number(notaDebito.monto_subtotal) || (total / 1.18)
    const igv = Number(notaDebito.monto_igv) || (total - subtotal)

    // Número completo
    const numeroCompleto = notaDebito.numero_completo || notaDebito.numero ||
        `${notaDebito.serie}-${notaDebito.numero}`

    // 1. Intentar obtener detalles del comprobante afectado (Factura/Boleta original)
    let productos: ProductoNotaDebitoPDF[] = []

    if (comprobanteAfectado?.detalles && comprobanteAfectado.detalles.length > 0) {
        console.log('✅ Usando detalles del comprobante afectado (referencia)')
        productos = comprobanteAfectado.detalles.map((detalle: any) => ({
            codigo: detalle.codigo_producto || 'N/A',
            descripcion: detalle.descripcion || '',
            cantidad: Number(detalle.cantidad) || 0,
            unidad: detalle.unidad_medida || 'UND',
            precio_unitario: Number(detalle.precio_unitario) || 0,
            subtotal: Number(detalle.valor_venta || detalle.subtotal) || 0,
        }))
    } else if (venta?.detalles && venta.detalles.length > 0) {
        console.log('✅ Usando detalles de la venta asociada')
        productos = venta.detalles.map((detalle: any) => ({
            codigo: detalle.producto?.codigo || 'N/A',
            descripcion: detalle.descripcion || detalle.producto?.nombre || '',
            cantidad: Number(detalle.cantidad) || 0,
            unidad: 'UND',
            precio_unitario: Number(detalle.precio_unitario) || 0,
            subtotal: Number(detalle.subtotal) || 0,
        }))
    } else if (comprobanteElectronico?.detalles && comprobanteElectronico.detalles.length > 0) {
        console.log('⚠️ Usando detalles del comprobante electrónico de la nota')
        productos = comprobanteElectronico.detalles.map((detalle: any) => ({
            codigo: detalle.codigo_producto || 'N/A',
            descripcion: detalle.descripcion || '',
            cantidad: Number(detalle.cantidad) || 0,
            unidad: detalle.unidad_medida || 'UND',
            precio_unitario: Number(detalle.precio_unitario) || 0,
            subtotal: Number(detalle.valor_venta || detalle.subtotal) || 0,
        }))
    } else {
        // CASO FALLBACK: Crear producto genérico con la descripción de la nota
        console.warn('⚠️ No se encontraron detalles, usando producto genérico')
        productos = [{
            codigo: 'N/A',
            descripcion: notaDebito.descripcion || 'Nota de Débito por intereses/mora',
            cantidad: 1,
            unidad: 'UND',
            precio_unitario: subtotal,
            subtotal: subtotal,
        }]
    }

    // 2. Intentar obtener datos del cliente
    let cliente = {
        numero_documento: '',
        razon_social: '',
        nombres: '',
        apellidos: '',
        direccion: '',
    }

    // A. Intentar objetos completos
    const clienteObj =
        comprobanteElectronico?.cliente ||
        comprobanteAfectado?.cliente ||
        venta?.cliente

    if (clienteObj) {
        console.log('✅ Cliente encontrado en objeto:', clienteObj)
        cliente = {
            numero_documento: clienteObj.numero_documento || '',
            razon_social: clienteObj.razon_social || '',
            nombres: clienteObj.nombres || '',
            apellidos: clienteObj.apellidos || '',
            direccion: clienteObj.direccion || '',
        }
    }

    // B. Si no hay objeto, o falta el documento, buscar en campos planos
    if (!cliente.numero_documento || cliente.numero_documento === 'N/A') {
        console.log('⚠️ Buscando cliente en campos planos')
        // Prioridad de campos planos
        const numDoc =
            comprobanteElectronico?.cliente_numero_documento ||
            comprobanteAfectado?.cliente_numero_documento ||
            venta?.cliente_numero_documento ||
            notaDebito.cliente_numero_documento

        const rz =
            comprobanteElectronico?.cliente_razon_social ||
            comprobanteAfectado?.cliente_razon_social ||
            venta?.cliente_razon_social ||
            notaDebito.cliente_razon_social

        const dir =
            comprobanteElectronico?.cliente_direccion ||
            comprobanteAfectado?.cliente_direccion ||
            venta?.cliente_direccion ||
            notaDebito.cliente_direccion

        if (numDoc) {
            cliente.numero_documento = numDoc
            cliente.razon_social = rz || ''
            cliente.direccion = dir || ''

            // Si es DNI y tenemos nombres planos (raro pero posible)
            if (!rz && !cliente.razon_social) {
                cliente.razon_social = 'Cliente General'
            }
        }
    }

    return {
        id: notaDebito.id,
        numero: numeroCompleto,
        fecha: notaDebito.fecha_emision || notaDebito.fecha,
        motivo: notaDebito.motivo?.descripcion || notaDebito.motivo_nota?.descripcion || notaDebito.descripcion || 'Sin motivo especificado',
        comprobante_afectado: {
            tipo: comprobanteAfectado ? getTipoComprobanteLabel(comprobanteAfectado.tipo_comprobante || venta?.comprobante_electronico?.tipo_comprobante || '') : 'COMPROBANTE',
            numero: comprobanteAfectado?.numero || comprobanteAfectado?.serie_numero || venta?.comprobante_electronico?.numero || 'N/A',
        },
        cliente,
        productos,
        subtotal,
        igv,
        total,
        observaciones: notaDebito.observaciones,
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
