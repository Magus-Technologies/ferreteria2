'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { requerimientoInternoApi, type RequerimientoInterno, type RequerimientoInternoProducto } from '~/lib/api/requerimiento-interno'

interface ModalDocSolicitudOCProps {
    open: boolean
    onClose: () => void
    requerimiento: RequerimientoInterno | null | undefined
}

const COLUMNAS_SOC = [
    { label: 'Código', value: 'codigo' },
    { label: 'Cantidad', value: 'cantidad' },
    { label: 'Unidad', value: 'unidad' },
    { label: 'Descripción', value: 'descripcion' },
]

// Construye el bloque de detalle para el mensaje de WhatsApp
function buildDetalleSOC(
    productos: RequerimientoInternoProducto[],
    columnas: string[]
): string {
    if (!productos.length || !columnas.length) return ''

    // Mapeo de campo -> extractor de valor del producto
    const extractores: Record<string, (p: RequerimientoInternoProducto) => string> = {
        codigo: (p) => p.producto?.cod_producto || '—',
        cantidad: (p) => String(p.cantidad),
        unidad: (p) => p.unidad || p.producto?.unidad_medida?.name || '—',
        descripcion: (p) => p.producto?.name || p.nombre_adicional || '—',
    }

    const LABELS: Record<string, string> = {
        codigo: 'Cód',
        cantidad: 'Cant',
        unidad: 'Und',
        descripcion: 'Desc',
    }

    const colsActivas = columnas.filter((c) => extractores[c])

    const lineas = productos.map((p) => {
        const partes = colsActivas.map((c) => `${LABELS[c]}: ${extractores[c](p)}`)
        return `• ${partes.join(' | ')}`
    })

    return `DETALLE:\n${lineas.join('\n')}`
}

export default function ModalDocSolicitudOC({ open, onClose, requerimiento }: ModalDocSolicitudOCProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const fetchedRef = useRef<number | null>(null)
    const { data: empresa } = useEmpresaPublica()
    
    // Productos cargados (pueden no venir con todas las relaciones en el objeto inicial)
    const [productosLoaded, setProductosLoaded] = useState<RequerimientoInternoProducto[]>([])

    const fetchPdf = useCallback(async (id: number) => {
        const token = getAuthToken()
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
        const res = await fetch(`${API_URL}/api/pdf/requerimiento-interno/${id}`, {
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
        if (open && requerimiento?.id && fetchedRef.current !== requerimiento.id) {
            fetchedRef.current = requerimiento.id
            setLoading(true)
            
            // Cargar PDF
            fetchPdf(requerimiento.id)
                .then((url) => { setPdfUrl(url) })
                .catch((err) => { console.error('Error cargando PDF de SOC:', err) })
                .finally(() => { setLoading(false) })
                
            // Cargar detalle completo si es necesario
            if (!requerimiento.productos || requerimiento.productos.length === 0) {
                requerimientoInternoApi.getById(requerimiento.id).then((res) => {
                    if (res.data?.data?.productos) {
                        setProductosLoaded(res.data.data.productos)
                    }
                }).catch(() => {})
            } else {
                setProductosLoaded(requerimiento.productos)
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
    }, [open, requerimiento?.id, fetchPdf, requerimiento?.productos])

    const whatsappMensajeAuto = (() => {
        if (!requerimiento) return undefined
        const empresaNombre = empresa?.razon_social || ''
        let msg = `Hola!\n\nLe compartimos nuestro Requerimiento Interno desde ${empresaNombre}\n\n`
        msg += `REQUERIMIENTO:\n\t${requerimiento.codigo}\n`
        msg += `TÍTULO:\n\t${requerimiento.titulo}\n`
        msg += `ÁREA:\n\t${requerimiento.cargo}\n`
        return msg
    })()

    // URL pública del PDF (no requiere auth)
    const pdfPublicUrl = requerimiento?.id
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdf/requerimiento-interno/${requerimiento.id}`
        : undefined

    const nroDoc = requerimiento?.codigo ?? 'Requerimiento Interno'

    return (
        <ModalShowDoc
            open={open}
            setOpen={(val) => !val && onClose()}
            nro_doc={nroDoc}
            tipoDocumento="compra" // Usamos el tipo "compra" para aprovechar configuraciones similares
            backendPdfUrl={pdfUrl}
            backendPdfLoading={loading && !pdfUrl}
            clienteTelefonos={undefined}
            whatsappMensajeAuto={whatsappMensajeAuto}
            whatsappConfig={{
                pdfPublicUrl,
                columnas: COLUMNAS_SOC,
                defaultColumnas: ['codigo', 'cantidad', 'unidad', 'descripcion'],
                buildDetalle: (columnas) =>
                    buildDetalleSOC(productosLoaded, columnas),
            }}
            emailConfig={{
                emailDefault: '',
                columnas: COLUMNAS_SOC,
                defaultColumnas: ['codigo', 'cantidad', 'unidad', 'descripcion'],
                onSend: async (email, columnas) => {
                    if (!requerimiento?.id) throw new Error('No hay requerimiento seleccionado')
                    const res = await requerimientoInternoApi.enviarCorreo(requerimiento.id, { email, columnas })
                    if (res.error) throw new Error(res.error.message)
                },
            }}
        >
            <></>
        </ModalShowDoc>
    )
}
