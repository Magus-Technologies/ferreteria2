'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

/**
 * Visor del comprobante PDF de UNA devolución de préstamo, con toggle
 * Ticket (80mm) / A4 — igual que ModalDocPrestamo. Pre-carga ambos formatos
 * desde /pdf/prestamo/{id}/devolucion/{numeroDevolucion}.
 */
export default function ModalDocDevolucion({
  open,
  setOpen,
  prestamoId,
  numeroDevolucion,
  nroDoc,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  prestamoId?: string
  numeroDevolucion?: string
  nroDoc?: string
}) {
  const [esTicket, setEsTicket] = useState(true)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  const fetchPdf = useCallback(
    async (formato: 'ticket' | 'a4') => {
      const token = getAuthToken()
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(
        `${API_URL}/pdf/prestamo/${prestamoId}/devolucion/${numeroDevolucion}?formato=${formato}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' } },
      )
      if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    },
    [prestamoId, numeroDevolucion],
  )

  useEffect(() => {
    const key = `${prestamoId}|${numeroDevolucion}`
    if (open && prestamoId && numeroDevolucion && fetchedRef.current !== key) {
      fetchedRef.current = key
      setLoading(true)
      fetchPdf('ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })
      fetchPdf('a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setA4PdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      fetchedRef.current = null
    }
  }, [open, prestamoId, numeroDevolucion, fetchPdf])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nroDoc || 'Devolución'}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento="prestamo"
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
    >
      <></>
    </ModalShowDoc>
  )
}
