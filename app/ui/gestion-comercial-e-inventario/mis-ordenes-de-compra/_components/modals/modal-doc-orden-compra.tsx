'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import type { OrdenCompra } from '~/lib/api/orden-compra'

interface ModalDocOrdenCompraProps {
    open: boolean
    onClose: () => void
    orden: OrdenCompra | undefined
}

export default function ModalDocOrdenCompra({ open, onClose, orden }: ModalDocOrdenCompraProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const fetchedRef = useRef<number | null>(null)
    const { data: empresa } = useEmpresaPublica()

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

    // Cargar PDF cuando se abre el modal
    useEffect(() => {
        if (open && orden?.id && fetchedRef.current !== orden.id) {
            fetchedRef.current = orden.id
            setLoading(true)
            fetchPdf(orden.id)
                .then((url) => {
                    setPdfUrl(url)
                })
                .catch((err) => {
                    console.error('Error cargando PDF de OC:', err)
                })
                .finally(() => {
                    setLoading(false)
                })
        }

        if (!open) {
            setPdfUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            fetchedRef.current = null
        }
    }, [open, orden?.id, fetchPdf])

    // Construir mensaje de WhatsApp con datos de la orden
    const whatsappMensajeAuto = (() => {
        if (!orden) return undefined
        const empresaNombre = empresa?.razon_social || ''
        const proveedor = orden.proveedor?.razon_social || 'Proveedor'
        const ruc = orden.proveedor?.ruc || orden.ruc || ''
        const total = Number(orden.total ?? 0).toFixed(2)

        let msg = `Hola!\n\nLe compartimos nuestra Orden de Compra desde ${empresaNombre}\n\n`
        msg += `ORDEN DE COMPRA:\n\t${orden.codigo}\n\n`
        msg += `PROVEEDOR:\n\t${proveedor}${ruc ? ` (RUC: ${ruc})` : ''}\n\n`
        msg += `TOTAL:\n\tS/ ${total}`
        return msg
    })()

    // Teléfonos del proveedor (si disponibles en el futuro)
    const proveedorTelefonos: string[] | undefined = undefined

    const nroDoc = orden?.codigo ?? 'Orden de Compra'

    return (
        <ModalShowDoc
            open={open}
            setOpen={(val) => !val && onClose()}
            nro_doc={nroDoc}
            tipoDocumento="compra"
            backendPdfUrl={pdfUrl}
            backendPdfLoading={loading && !pdfUrl}
            clienteTelefonos={proveedorTelefonos}
            whatsappMensajeAuto={whatsappMensajeAuto}
        >
            {/* El PDF es renderizado por el backend */}
            <></>
        </ModalShowDoc>
    )
}
