import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { useStoreModalPdfNotaCredito } from '../../_store/store-modal-pdf-nota-credito'
import { getAuthToken } from '~/lib/api'

// ============= COMPONENT =============

export default function ModalPdfNotaCreditoWrapper() {
  const open = useStoreModalPdfNotaCredito((state) => state.open)
  const notaCreditoId = useStoreModalPdfNotaCredito((state) => state.notaCreditoId)
  const closeModal = useStoreModalPdfNotaCredito((state) => state.closeModal)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string) => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/nota-credito/${id}`, {
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
    if (open && notaCreditoId && fetchedRef.current !== notaCreditoId) {
      fetchedRef.current = notaCreditoId
      setLoading(true)

      fetchPdf(notaCreditoId)
        .then((url) => {
          setPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error nota crédito PDF:', err)
          setLoading(false)
        })
    }

    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, notaCreditoId, fetchPdf])

  return (
    <ModalShowDoc
      open={open}
      setOpen={closeModal}
      nro_doc=""
      backendPdfUrl={pdfUrl}
      backendPdfLoading={loading && !pdfUrl}
    >
      <></>
    </ModalShowDoc>
  )
}
