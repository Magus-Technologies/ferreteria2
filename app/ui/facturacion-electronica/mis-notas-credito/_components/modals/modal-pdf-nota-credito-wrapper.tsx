import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { useStoreModalPdfNotaCredito } from '../../_store/store-modal-pdf-nota-credito'
import { getAuthToken } from '~/lib/api'
import { documentoEmailApi } from '~/lib/api/documento-email'

// ============= COMPONENT =============

export default function ModalPdfNotaCreditoWrapper() {
  const open = useStoreModalPdfNotaCredito((state) => state.open)
  const notaCreditoId = useStoreModalPdfNotaCredito((state) => state.notaCreditoId)
  const closeModal = useStoreModalPdfNotaCredito((state) => state.closeModal)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [esTicket, setEsTicket] = useState(false)
  const fetchedKeyRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string, formato: 'a4' | 'ticket') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/nota-credito/${id}?formato=${formato}`, {
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
    if (!open || !notaCreditoId) return
    const formato: 'a4' | 'ticket' = esTicket ? 'ticket' : 'a4'
    const key = `${notaCreditoId}::${formato}`
    if (fetchedKeyRef.current === key) return

    fetchedKeyRef.current = key
    setLoading(true)
    setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })

    fetchPdf(notaCreditoId, formato)
      .then((url) => {
        setPdfUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error nota crédito PDF:', err)
        setLoading(false)
      })
  }, [open, notaCreditoId, esTicket, fetchPdf])

  useEffect(() => {
    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedKeyRef.current = null
      setEsTicket(false)
    }
  }, [open])

  const pdfPublicUrl = useMemo(() => {
    if (!notaCreditoId) return undefined
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const formato = esTicket ? 'ticket' : 'a4'
    return `${API_URL}/pdf/nota-credito/${notaCreditoId}?formato=${formato}`
  }, [notaCreditoId, esTicket])

  return (
    <ModalShowDoc
      open={open}
      setOpen={closeModal}
      nro_doc=""
      backendPdfUrl={pdfUrl}
      backendPdfLoading={loading && !pdfUrl}
      pdfPublicUrl={pdfPublicUrl}
      esTicket={esTicket}
      setEsTicket={setEsTicket}
      emailConfig={{
        onSend: async (email, _columnas, mensaje) => {
          if (!notaCreditoId) throw new Error('No hay nota de crédito seleccionada')
          const res = await documentoEmailApi.enviarEmail({ tipo: 'nota-credito', id: notaCreditoId, email, mensaje })
          if (res.error) throw new Error(res.error.message)
        },
      }}
    >
      <></>
    </ModalShowDoc>
  )
}
