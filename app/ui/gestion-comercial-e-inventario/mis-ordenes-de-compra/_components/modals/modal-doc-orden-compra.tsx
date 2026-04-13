'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { ordenCompraApi, type OrdenCompra, type OrdenCompraProducto } from '~/lib/api/orden-compra'

interface ModalDocOrdenCompraProps {
    open: boolean
    onClose: () => void
    orden: OrdenCompra | undefined
}

const COLUMNAS_OC = [
    { label: 'Código', value: 'codigo' },
    { label: 'Descripción', value: 'producto' },
    { label: 'Marca', value: 'marca' },
    { label: 'Unidad', value: 'unidad' },
    { label: 'Cantidad', value: 'cantidad' },
    { label: 'Precio Unitario', value: 'precio' },
    { label: 'Flete', value: 'flete' },
]

const EXTRAS_OC = [
    { label: 'Subtotal', value: 'subtotal' },
    { label: 'Total', value: 'total' },
]

// Construye el bloque de detalle para el mensaje de WhatsApp
function buildDetalleOC(
    productos: OrdenCompraProducto[],
    ordenTotal: number,
    columnas: string[],
    extras: string[]
): string {
    if (!productos.length || !columnas.length) return ''

    // Mapeo de campo -> extractor de valor del producto
    const extractores: Record<string, (p: OrdenCompraProducto) => string> = {
        codigo: (p) => p.codigo || '—',
        producto: (p) => p.nombre || '—',
        marca: (p) => p.marca || '—',
        unidad: (p) => p.unidad || '—',
        cantidad: (p) => String(p.cantidad),
        precio: (p) => `S/ ${Number(p.precio).toFixed(2)}`,
        flete: (p) => `S/ ${Number(p.flete ?? 0).toFixed(2)}`,
    }

    const LABELS: Record<string, string> = {
        codigo: 'Cód',
        producto: 'Desc',
        marca: 'Marca',
        unidad: 'Und',
        cantidad: 'Cant',
        precio: 'P.Unit',
        flete: 'Flete',
    }

    const colsActivas = columnas.filter((c) => extractores[c])

    const lineas = productos.map((p) => {
        const partes = colsActivas.map((c) => `${LABELS[c]}: ${extractores[c](p)}`)
        return `• ${partes.join(' | ')}`
    })

    let texto = `DETALLE:\n${lineas.join('\n')}`

    // Subtotal (suma de p.subtotal ó p.precio*p.cantidad)
    if (extras.includes('subtotal')) {
        const subtotal = productos.reduce((acc, p) => acc + (Number(p.subtotal) || Number(p.precio) * Number(p.cantidad)), 0)
        texto += `\n\nSUBTOTAL: S/ ${subtotal.toFixed(2)}`
    }
    if (extras.includes('total')) {
        texto += `\nTOTAL: S/ ${Number(ordenTotal).toFixed(2)}`
    }

    return texto
}

export default function ModalDocOrdenCompra({ open, onClose, orden }: ModalDocOrdenCompraProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const fetchedRef = useRef<number | null>(null)
    const { data: empresa } = useEmpresaPublica()
    // Productos cargados (pueden no venir en el objeto inicial de la tabla)
    const [productosLoaded, setProductosLoaded] = useState<OrdenCompraProducto[]>([])

    const fetchPdf = useCallback(async (id: number) => {
        const token = getAuthToken()
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const res = await fetch(`${API_URL}/pdf/orden-compra/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/pdf',
            },
        })
        if (!res.ok) throw new Error(`Error al generar PDF: ${res.status}`)
        const blob = await res.blob()
        return URL.createObjectURL(blob)
    }, [])

    useEffect(() => {
        if (open && orden?.id && fetchedRef.current !== orden.id) {
            fetchedRef.current = orden.id
            setLoading(true)
            // Cargar PDF
            fetchPdf(orden.id)
                .then((url) => { setPdfUrl(url) })
                .catch((err) => { console.error('Error cargando PDF de OC:', err) })
                .finally(() => { setLoading(false) })
            // Cargar productos si no están disponibles
            if (!orden.productos || orden.productos.length === 0) {
                ordenCompraApi.getById(orden.id).then((res) => {
                    if (res.data?.data?.productos) {
                        setProductosLoaded(res.data.data.productos)
                    }
                }).catch(() => {})
            } else {
                setProductosLoaded(orden.productos)
            }
        }

        if (!open) {
            setPdfUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            fetchedRef.current = null
            setProductosLoaded([])
        }
    }, [open, orden?.id, fetchPdf, orden?.productos])

    const whatsappMensajeAuto = (() => {
        if (!orden) return undefined
        const empresaNombre = empresa?.razon_social || ''
        const proveedor = orden.proveedor?.razon_social || 'Proveedor'
        const ruc = orden.proveedor?.ruc || orden.ruc || ''
        let msg = `Hola!\n\nLe compartimos nuestra Orden de Compra desde ${empresaNombre}\n\n`
        msg += `ORDEN DE COMPRA:\n\t${orden.codigo}\n\n`
        msg += `PROVEEDOR:\n\t${proveedor}${ruc ? ` (RUC: ${ruc})` : ''}`
        return msg
    })()

    // URL pública del PDF (no requiere auth)
    const pdfPublicUrl = orden?.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/pdf/orden-compra/${orden.id}`
        : undefined

    const ordenTotal = Number(orden?.total ?? 0)

    const nroDoc = orden?.codigo ?? 'Orden de Compra'

    return (
        <ModalShowDoc
            open={open}
            setOpen={(val) => !val && onClose()}
            nro_doc={nroDoc}
            tipoDocumento="compra"
            backendPdfUrl={pdfUrl}
            backendPdfLoading={loading && !pdfUrl}
            clienteTelefonos={undefined}
            whatsappMensajeAuto={whatsappMensajeAuto}
            whatsappConfig={{
                pdfPublicUrl,
                columnas: COLUMNAS_OC,
                defaultColumnas: ['codigo', 'producto', 'marca', 'unidad', 'cantidad'],
                extras: EXTRAS_OC,
                defaultExtras: ['total'],
                buildDetalle: (columnas, extras) =>
                    buildDetalleOC(productosLoaded, ordenTotal, columnas, extras),
            }}
            emailConfig={{
                emailDefault: orden?.proveedor?.correo ?? '',
                columnas: [...COLUMNAS_OC, ...EXTRAS_OC],
                defaultColumnas: ['codigo', 'producto', 'marca', 'unidad', 'cantidad'],
                onSend: async (email, columnas) => {
                    if (!orden?.id) throw new Error('No hay orden seleccionada')
                    const res = await ordenCompraApi.enviarCorreo(orden.id, { email, columnas })
                    if (res.error) throw new Error(res.error.message)
                },
            }}
        >
            <></>
        </ModalShowDoc>
    )
}
