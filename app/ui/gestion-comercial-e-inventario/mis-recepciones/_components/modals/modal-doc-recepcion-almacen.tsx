import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getNroDoc } from '~/app/_utils/get-nro-doc'
import { useAuth } from '~/lib/auth-context'
import { useState, useEffect } from 'react'
import type { RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'
import { getAuthToken } from '~/lib/api'

export default function ModalDocRecepcionAlmacen({
  open,
  setOpen,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  data: RecepcionAlmacenResponse | undefined
}) {
  const { user } = useAuth()
  const empresa = user?.empresa

  const nro_doc = getNroDoc({
    tipo_documento: 'RecepcionAlmacen' as any,
    serie: empresa?.serie_recepcion_almacen ?? 0,
    numero: data?.numero ?? 0,
  })

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
          `${API_URL}/pdf/recepcion-almacen/${data.id}?formato=${formato}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
            },
          }
        )
        if (!res.ok) throw new Error(`Error: ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBackendPdfUrl(prev => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
      } catch (err) {
        console.error('Error al cargar PDF de recepción:', err)
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
      nro_doc={nro_doc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='recepcion_almacen'
      backendPdfUrl={backendPdfUrl}
      backendPdfLoading={backendPdfLoading}
    >
      {null as any}
    </ModalShowDoc>
  )
}
