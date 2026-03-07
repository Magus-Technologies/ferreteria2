import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

// ============= COMPONENT =============

export default function ModalDocVenta({
  open,
  setOpen,
  ventaId,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  ventaId: string | undefined
}) {
  const [esTicket, setEsTicket] = useState(true)

  // URLs de PDF para cada formato
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string, formato: 'ticket' | 'a4') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/venta/${id}?formato=${formato}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    })
    if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }, [])

  // Pre-cargar ambos PDFs cuando se abre el modal
  useEffect(() => {
    if (open && ventaId && fetchedRef.current !== ventaId) {
      fetchedRef.current = ventaId
      setLoading(true)

      // Cargar ticket primero (es el que se muestra por defecto)
      fetchPdf(ventaId, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })

      // Cargar A4 en paralelo
      fetchPdf(ventaId, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setA4PdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, ventaId, fetchPdf])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc=""
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='venta'
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
    >
      {/* Fallback vacío - todo se renderiza desde el backend */}
      <></>
    </ModalShowDoc>
  )
}
