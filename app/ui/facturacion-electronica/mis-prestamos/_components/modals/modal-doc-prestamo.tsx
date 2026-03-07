import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

// ============= COMPONENT =============

export default function ModalDocPrestamo({
  open,
  setOpen,
  prestamoId,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  prestamoId: string | undefined
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
    const res = await fetch(`${API_URL}/pdf/prestamo/${id}?formato=${formato}`, {
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
    if (open && prestamoId && fetchedRef.current !== prestamoId) {
      fetchedRef.current = prestamoId
      setLoading(true)

      fetchPdf(prestamoId, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })

      fetchPdf(prestamoId, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setA4PdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, prestamoId, fetchPdf])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc=""
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='prestamo'
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
    >
      <></>
    </ModalShowDoc>
  )
}
