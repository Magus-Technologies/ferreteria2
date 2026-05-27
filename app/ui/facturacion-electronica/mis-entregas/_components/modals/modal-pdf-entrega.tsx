'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

/**
 * Modal de PDF de entrega — usa `ModalShowDoc` (mismo componente que mis-ventas)
 * con toggle Ticket (80mm) / A4. Pre-carga ambos formatos en paralelo al abrir
 * para que el switch sea instantáneo.
 *
 * El backend resuelve el formato via `?formato=ticket|a4` en
 * `/pdf/entrega-producto/{id}`. El blade decide el título según
 * `estado_entrega` (Vale de Recojo, Ticket de Entrega, etc.).
 */
export default function ModalPdfEntrega({
  open,
  setOpen,
  entrega,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  entrega: any
}) {
  const [esTicket, setEsTicket] = useState(true)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<number | null>(null)

  const ventaSerie = entrega?.venta?.serie
  const ventaNumero = entrega?.venta?.numero
  const nroDoc = ventaSerie && ventaNumero
    ? `${ventaSerie}-${ventaNumero}`
    : entrega?.id
      ? `Entrega #${entrega.id}`
      : 'S/N'

  const fetchPdf = useCallback(async (id: number, formato: 'ticket' | 'a4') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(
      `${API_URL}/pdf/entrega/${id}?formato=${formato}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      },
    )
    if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }, [])

  // Pre-cargar ambos formatos en paralelo al abrir (igual que mis-ventas)
  useEffect(() => {
    if (open && entrega?.id && fetchedRef.current !== entrega.id) {
      fetchedRef.current = entrega.id
      setLoading(true)

      // Ticket primero (es el formato por defecto)
      fetchPdf(entrega.id, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF entrega:', err)
          setLoading(false)
        })

      // A4 en paralelo
      fetchPdf(entrega.id, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF entrega:', err))
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
  }, [open, entrega?.id, fetchPdf])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nroDoc}
      esTicket={esTicket}
      setEsTicket={setEsTicket}
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading}
    >
      {/* No hay fallback react-pdf — siempre se usa el PDF del backend */}
      {null}
    </ModalShowDoc>
  )
}
