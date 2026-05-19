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
    const res = await fetch(`${API_URL}/pdf/apertura-caja/${id}?formato=ticket`, {
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

  return (
    <ModalShowDoc
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      nro_doc=""
      tipoDocumento='apertura_caja'
      esTicket={true}
      aperturaId={apertura?.id}
      backendPdfUrl={pdfUrl}
      backendPdfLoading={loading && !pdfUrl}
    >
      <></>
    </ModalShowDoc>
  )
}
