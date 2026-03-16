import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { useState, useEffect } from 'react'
import { getAuthToken } from '~/lib/api'
import type { TransferenciaStock } from '~/lib/api/transferencia-stock'

export default function ModalDocTransferenciaStock({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: TransferenciaStock | undefined
}) {
  const nroDoc = data
    ? `TS${String(data.serie).padStart(4, '0')}-${String(data.numero).padStart(8, '0')}`
    : ''

  const [esTicket, setEsTicket] = useState(true)
  const [backendPdfUrl, setBackendPdfUrl] = useState<string | null>(null)
  const [backendPdfLoading, setBackendPdfLoading] = useState(false)

  useEffect(() => {
    if (!open || !data?.id) {
      if (backendPdfUrl) {
        URL.revokeObjectURL(backendPdfUrl)
        setBackendPdfUrl(null)
      }
      return
    }

    const fetchPdf = async () => {
      setBackendPdfLoading(true)
      try {
        const token = getAuthToken()
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const formato = esTicket ? 'ticket' : 'a4'
        const res = await fetch(
          `${API_URL}/pdf/transferencia-stock/${data.id}?formato=${formato}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
            },
          },
        )
        if (!res.ok) throw new Error(`Error: ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBackendPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      } catch (err) {
        console.error('Error al cargar PDF de transferencia:', err)
      } finally {
        setBackendPdfLoading(false)
      }
    }

    fetchPdf()
  }, [open, data?.id, esTicket])

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nroDoc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento="transferencia_stock"
      backendPdfUrl={backendPdfUrl}
      backendPdfLoading={backendPdfLoading}
    >
      {null as any}
    </ModalShowDoc>
  )
}
