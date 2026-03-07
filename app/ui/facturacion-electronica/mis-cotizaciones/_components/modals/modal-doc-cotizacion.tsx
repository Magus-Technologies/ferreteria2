import { useState, useEffect, useCallback, useRef } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

// ============= TYPES =============

export interface CotizacionResponse {
  id: string | number
  numero: string
  fecha: string
  fecha_vencimiento: string
  cliente?: {
    numero_documento: string
    razon_social?: string | null
    nombres?: string | null
    apellidos?: string | null
    direccion?: string | null
    telefono?: string | null
    email?: string | null
  } | null
  ruc_dni?: string | null
  productos_por_almacen?: Array<{
    producto_almacen: {
      producto: {
        cod_producto: string | null
        name: string
      }
    }
    unidades_derivadas: Array<{
      cantidad: number | string
      precio: number | string
      factor: number | string
      recargo?: number | string
      descuento?: number | string
      descuento_tipo?: string
      unidad_derivada_inmutable: {
        name: string
      }
    }>
  }>
  user?: {
    name: string
  }
  vendedor?: string | null
}

// ============= COMPONENT =============

export default function ModalDocCotizacion({
  open,
  setOpen,
  cotizacionId,
  data,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  cotizacionId: string | undefined
  data: CotizacionResponse | undefined
  isLoadingData?: boolean
}) {
  const [esTicket, setEsTicket] = useState(true)

  // URLs de PDF para cada formato
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  const fetchPdf = useCallback(async (id: string | number, formato: 'ticket' | 'a4') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/cotizacion/${id}?formato=${formato}`, {
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
    if (open && cotizacionId && fetchedRef.current !== cotizacionId) {
      fetchedRef.current = cotizacionId
      setLoading(true)

      // Cargar ticket primero (es el que se muestra por defecto)
      fetchPdf(cotizacionId, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })

      // Cargar A4 en paralelo
      fetchPdf(cotizacionId, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setA4PdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, cotizacionId, fetchPdf])

  const nro_doc = data ? data.numero : ''
  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nro_doc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='cotizacion'
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
    >
      {/* Fallback vacío - todo se renderiza desde el backend */}
      <></>
    </ModalShowDoc>
  )
}

