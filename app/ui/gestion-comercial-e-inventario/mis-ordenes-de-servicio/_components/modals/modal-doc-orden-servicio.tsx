'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { requerimientoInternoApi, type RequerimientoInterno, type RequerimientoInternoServicio } from '~/lib/api/requerimiento-interno'

interface ModalDocOrdenServicioProps {
    open: boolean
    onClose: () => void
    requerimiento: RequerimientoInterno | null | undefined
}

const COLUMNAS_OS = [
    { label: 'Tipo', value: 'tipo' },
    { label: 'Descripción', value: 'descripcion' },
    { label: 'Lugar', value: 'lugar' },
    { label: 'Duración', value: 'duracion' },
    { label: 'Presupuesto', value: 'presupuesto' },
]

function buildDetalleOS(
    servicios: RequerimientoInternoServicio[],
    columnas: string[]
): string {
    if (!servicios.length || !columnas.length) return ''

    const extractores: Record<string, (s: RequerimientoInternoServicio) => string> = {
        tipo: (s) => s.tipo_servicio || '—',
        descripcion: (s) => s.descripcion_servicio || '—',
        lugar: (s) => s.lugar_ejecucion || '—',
        duracion: (s) =>
            s.duracion_cantidad
                ? `${s.duracion_cantidad} ${s.duracion_unidad || ''}`.trim()
                : '—',
        presupuesto: (s) =>
            s.presupuesto_referencial
                ? `S/ ${Number(s.presupuesto_referencial).toFixed(2)}`
                : '—',
    }

    const LABELS: Record<string, string> = {
        tipo: 'Tipo',
        descripcion: 'Desc',
        lugar: 'Lugar',
        duracion: 'Dur',
        presupuesto: 'Pres',
    }

    const colsActivas = columnas.filter((c) => extractores[c])

    const lineas = servicios.map((s) => {
        const partes = colsActivas.map((c) => `${LABELS[c]}: ${extractores[c](s)}`)
        return `• ${partes.join(' | ')}`
    })

    return `DETALLE:\n${lineas.join('\n')}`
}

export default function ModalDocOrdenServicio({ open, onClose, requerimiento }: ModalDocOrdenServicioProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [esTicket, setEsTicket] = useState(false)
    const fetchedKeyRef = useRef<string | null>(null)
    const { data: empresa } = useEmpresaPublica()

    const [serviciosLoaded, setServiciosLoaded] = useState<RequerimientoInternoServicio[]>([])

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
            .catch((err) => { console.error('Error cargando PDF de OS:', err) })
            .finally(() => { setLoading(false) })
    }, [open, requerimiento?.id, esTicket, fetchPdf])

    useEffect(() => {
        if (!open || !requerimiento?.id) return
        if (!requerimiento.servicios || requerimiento.servicios.length === 0) {
            requerimientoInternoApi.getById(requerimiento.id).then((res) => {
                if (res.data?.data?.servicios) {
                    setServiciosLoaded(res.data.data.servicios)
                }
            }).catch(() => {})
        } else {
            setServiciosLoaded(requerimiento.servicios)
        }
    }, [open, requerimiento?.id, requerimiento?.servicios])

    useEffect(() => {
        if (!open) {
            setPdfUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            fetchedKeyRef.current = null
            setServiciosLoaded([])
            setEsTicket(false)
        }
    }, [open])

    const whatsappMensajeAuto = (() => {
        if (!requerimiento) return undefined
        const empresaNombre = empresa?.razon_social || ''
        let msg = `Hola!\n\nLe compartimos nuestra Orden de Servicio desde ${empresaNombre}\n\n`
        msg += `REQUERIMIENTO:\n\t${requerimiento.codigo}\n`
        msg += `TÍTULO:\n\t${requerimiento.titulo}\n`
        msg += `ÁREA:\n\t${requerimiento.cargo}\n`
        return msg
    })()

    const pdfPublicUrl = requerimiento?.id
        ? `${process.env.NEXT_PUBLIC_API_URL}/pdf/requerimiento-interno/${requerimiento.id}?formato=${esTicket ? 'ticket' : 'a4'}`
        : undefined

    const nroDoc = requerimiento?.codigo ?? 'Orden de Servicio'

    return (
        <ModalShowDoc
            open={open}
            setOpen={(val) => !val && onClose()}
            nro_doc={nroDoc}
            tipoDocumento="venta"
            backendPdfUrl={pdfUrl}
            backendPdfLoading={loading && !pdfUrl}
            esTicket={esTicket}
            setEsTicket={setEsTicket}
            whatsappMensajeAuto={whatsappMensajeAuto}
            whatsappConfig={{
                pdfPublicUrl,
                columnas: COLUMNAS_OS,
                defaultColumnas: ['tipo', 'descripcion', 'duracion', 'presupuesto'],
                buildDetalle: (columnas) => buildDetalleOS(serviciosLoaded, columnas),
            }}
            emailConfig={{
                emailDefault: '',
                columnas: COLUMNAS_OS,
                defaultColumnas: ['tipo', 'descripcion', 'lugar', 'duracion', 'presupuesto'],
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
