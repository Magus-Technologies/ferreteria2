'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

// ============= TYPES =============

export interface CajaActivaResponse {
  id: number
  fecha_apertura: string
  fecha_cierre?: string
  estado: string
  caja_principal: {
    name: string
  }
  user: {
    name: string
  }
  supervisor?: {
    name: string
  }
  resumen: {
    efectivo_inicial: number
    detalle_metodos_pago: Array<{
      label: string
      cantidad_transacciones: number
      total: number
    }>
    total_ventas: number
    total_ingresos: number
    total_egresos: number
    total_prestamos_recibidos: number
    total_prestamos_dados: number
    monto_esperado: number
    prestamos_recibidos?: any[]
    prestamos_dados?: any[]
    movimientos_internos?: any[]
  }
  monto_cierre_efectivo?: number
  total_cuentas?: number
  comentarios?: string
}

// ============= COMPONENT =============

export default function ModalTicketCierre({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: CajaActivaResponse | undefined
}) {
  const [esTicket, setEsTicket] = useState(true)

  // URLs de PDF para cada formato
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<number | null>(null)

  const fetchPdf = useCallback(async (id: number, formato: 'ticket' | 'a4') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/cierre-caja/${id}?formato=${formato}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    })
    if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }, [])

  useEffect(() => {
    if (open && data?.id && fetchedRef.current !== data.id) {
      fetchedRef.current = data.id
      setLoading(true)

      // Cargar ticket primero (es el que se muestra por defecto)
      fetchPdf(data.id, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })

      // Cargar A4 en paralelo
      fetchPdf(data.id, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setA4PdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, data?.id, fetchPdf])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc=""
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='cierre_caja'
      cierreId={data?.id}
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
    >
      <></>
    </ModalShowDoc>
  )
}
