import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { useStoreModalPdfNotaDebito } from '../../_store/store-modal-pdf-nota-debito'
import { getAuthToken } from '~/lib/api'

// ============= COMPONENT =============

export default function ModalPdfNotaDebitoWrapper() {
  const open = useStoreModalPdfNotaDebito((state) => state.open)
  const notaDebitoId = useStoreModalPdfNotaDebito((state) => state.notaDebitoId)
  const closeModal = useStoreModalPdfNotaDebito((state) => state.closeModal)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string) => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/nota-debito/${id}`, {
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
    if (open && notaDebitoId && fetchedRef.current !== notaDebitoId) {
      fetchedRef.current = notaDebitoId
      setLoading(true)

      fetchPdf(notaDebitoId)
        .then((url) => {
          setPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error nota débito PDF:', err)
          setLoading(false)
        })
    }

    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, notaDebitoId, fetchPdf])

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
