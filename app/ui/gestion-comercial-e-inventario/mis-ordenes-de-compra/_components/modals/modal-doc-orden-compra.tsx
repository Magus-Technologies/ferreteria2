'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { ordenCompraApi, type OrdenCompra } from '~/lib/api/orden-compra'

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

    useEffect(() => {
        if (open && orden?.id && fetchedRef.current !== orden.id) {
            fetchedRef.current = orden.id
            setLoading(true)
            fetchPdf(orden.id)
                .then((url) => { setPdfUrl(url) })
                .catch((err) => { console.error('Error cargando PDF de OC:', err) })
                .finally(() => { setLoading(false) })
        }

        if (!open) {
            setPdfUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            fetchedRef.current = null
        }
    }, [open, orden?.id, fetchPdf])

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

    // URL pública del PDF (no requiere autenticación)
    const pdfPublicUrl = orden?.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/pdf/orden-compra/${orden.id}`
        : undefined

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
