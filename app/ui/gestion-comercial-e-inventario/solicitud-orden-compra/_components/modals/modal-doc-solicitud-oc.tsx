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
    const [esTicket, setEsTicket] = useState(false)
    const fetchedKeyRef = useRef<string | null>(null)
    const { data: empresa } = useEmpresaPublica()

    // Productos cargados (pueden no venir con todas las relaciones en el objeto inicial)
    const [productosLoaded, setProductosLoaded] = useState<RequerimientoInternoProducto[]>([])

    const fetchPdf = useCallback(async (id: number, formato: 'a4' | 'ticket') => {
        const token = getAuthToken()
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const res = await fetch(`${API_URL}/pdf/requerimiento-interno/${id}?formato=${formato}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/pdf',
            },
        })
        if (!res.ok) throw new Error(`Error al generar PDF: ${res.status}`)
        const blob = await res.blob()
        return URL.createObjectURL(blob)
    }, [])

    // Fetch del PDF cuando cambia id o formato
    useEffect(() => {
        if (!open || !requerimiento?.id) return
        const formato: 'a4' | 'ticket' = esTicket ? 'ticket' : 'a4'
        const key = `${requerimiento.id}::${formato}`
        if (fetchedKeyRef.current === key) return

        fetchedKeyRef.current = key
        setLoading(true)
        setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })

        fetchPdf(requerimiento.id, formato)
            .then((url) => { setPdfUrl(url) })
            .catch((err) => { console.error('Error cargando PDF de SOC:', err) })
            .finally(() => { setLoading(false) })
    }, [open, requerimiento?.id, esTicket, fetchPdf])

    // Cargar detalle completo de productos al abrir (independiente del formato)
    useEffect(() => {
        if (!open || !requerimiento?.id) return
        if (!requerimiento.productos || requerimiento.productos.length === 0) {
            requerimientoInternoApi.getById(requerimiento.id).then((res) => {
                if (res.data?.data?.productos) {
                    setProductosLoaded(res.data.data.productos)
                }
            }).catch(() => {})
        } else {
            setProductosLoaded(requerimiento.productos)
        }
    }, [open, requerimiento?.id, requerimiento?.productos])

    // Limpieza al cerrar el modal
    useEffect(() => {
        if (!open) {
            setPdfUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            fetchedKeyRef.current = null
            setProductosLoaded([])
            setEsTicket(false)
        }
    }, [open])

    const whatsappMensajeAuto = (() => {
        if (!requerimiento) return undefined
        const empresaNombre = empresa?.razon_social || ''
        let msg = `Hola!\n\nLe compartimos nuestro Requerimiento Interno desde ${empresaNombre}\n\n`
        msg += `REQUERIMIENTO:\n\t${requerimiento.codigo}\n`
        msg += `TÍTULO:\n\t${requerimiento.titulo}\n`
        msg += `ÁREA:\n\t${requerimiento.cargo}\n`
        return msg
    })()

    // URL pública del PDF (no requiere auth) — incluye el formato actual
    const pdfPublicUrl = requerimiento?.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/pdf/requerimiento-interno/${requerimiento.id}?formato=${esTicket ? 'ticket' : 'a4'}`
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
            esTicket={esTicket}
            setEsTicket={setEsTicket}
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
