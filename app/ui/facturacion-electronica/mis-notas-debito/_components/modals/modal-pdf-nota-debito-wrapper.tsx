import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { useStoreModalPdfNotaDebito } from '../../_store/store-modal-pdf-nota-debito'
import { getAuthToken } from '~/lib/api'
import { documentoEmailApi } from '~/lib/api/documento-email'

// ============= COMPONENT =============

export default function ModalPdfNotaDebitoWrapper() {
  const open = useStoreModalPdfNotaDebito((state) => state.open)
  const notaDebitoId = useStoreModalPdfNotaDebito((state) => state.notaDebitoId)
  const closeModal = useStoreModalPdfNotaDebito((state) => state.closeModal)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [esTicket, setEsTicket] = useState(false)
  const fetchedKeyRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string, formato: 'a4' | 'ticket') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/nota-debito/${id}?formato=${formato}`, {
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
    if (!open || !notaDebitoId) return
    const formato: 'a4' | 'ticket' = esTicket ? 'ticket' : 'a4'
    const key = `${notaDebitoId}::${formato}`
    if (fetchedKeyRef.current === key) return

    fetchedKeyRef.current = key
    setLoading(true)
    setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })

    fetchPdf(notaDebitoId, formato)
      .then((url) => {
        setPdfUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error nota débito PDF:', err)
        setLoading(false)
      })
  }, [open, notaDebitoId, esTicket, fetchPdf])

  useEffect(() => {
    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedKeyRef.current = null
      setEsTicket(false)
    }
  }, [open])

  const pdfPublicUrl = useMemo(() => {
    if (!notaDebitoId) return undefined
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const formato = esTicket ? 'ticket' : 'a4'
    return `${API_URL}/pdf/nota-debito/${notaDebitoId}?formato=${formato}`
  }, [notaDebitoId, esTicket])

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
          if (!notaDebitoId) throw new Error('No hay nota de débito seleccionada')
          const res = await documentoEmailApi.enviarEmail({ tipo: 'nota-debito', id: notaDebitoId, email, mensaje })
          if (res.error) throw new Error(res.error.message)
        },
      }}
    >
      <></>
    </ModalShowDoc>
  )
}
