'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { AperturaYCierreCaja } from '~/lib/api/caja'
import { getAuthToken } from '~/lib/api'

// ============= COMPONENT =============

export default function ModalTicketApertura({
  open,
  onClose,
  apertura,
  vendedorSeleccionado,
}: {
  open: boolean
  onClose: () => void
  apertura: AperturaYCierreCaja | null
  vendedorSeleccionado?: any
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string) => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    // Los ULID se guardan en MAYÚSCULAS; en producción la búsqueda puede ser
    // case-sensitive y un id en minúsculas da 404.
    const res = await fetch(`${API_URL}/pdf/apertura-caja/${id.toUpperCase()}?formato=ticket`, {
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
    if (open && apertura?.id && fetchedRef.current !== apertura.id) {
      fetchedRef.current = apertura.id
      setLoading(true)

      fetchPdf(apertura.id)
        .then((url) => {
          setPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error apertura PDF:', err)
          setLoading(false)
        })
    }

    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, apertura?.id, fetchPdf])

  // Los ULID se guardan en MAYÚSCULAS; normalizar para las URLs y el nro de doc.
  const idUpper = apertura?.id ? String(apertura.id).toUpperCase() : undefined

  // La ruta /pdf/apertura-caja/{id} es pública en el backend, por eso el
  // enlace puede enviarse por WhatsApp.
  const pdfPublicUrl = idUpper
    ? `${process.env.NEXT_PUBLIC_API_URL}/pdf/apertura-caja/${idUpper}?formato=ticket`
    : undefined

  return (
    <ModalShowDoc
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      nro_doc={idUpper ? `APERTURA-${idUpper}` : ''}
      tipoDocumento='apertura_caja'
      esTicket={true}
      aperturaId={idUpper}
      backendPdfUrl={pdfUrl}
      backendPdfLoading={loading && !pdfUrl}
      pdfPublicUrl={pdfPublicUrl}
      whatsappMensajeAuto={`Hola, le comparto el ticket de apertura de caja APERTURA-${idUpper ?? ''}.`}
    >
      <></>
    </ModalShowDoc>
  )
}
