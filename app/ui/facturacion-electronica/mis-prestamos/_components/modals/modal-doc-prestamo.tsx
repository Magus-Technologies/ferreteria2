import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { documentoEmailApi } from '~/lib/api/documento-email'
import { prestamoApi, type Prestamo, type ProductoAlmacenPrestamo } from '~/lib/api/prestamo'

// ============= CONFIG COLUMNAS =============

const COLUMNAS_PRESTAMO = [
  { label: 'Ubicación', value: 'ubicacion' },
  { label: 'Código', value: 'codigo' },
  { label: 'Cantidad', value: 'cantidad' },
  { label: 'Unidad', value: 'unidad' },
  { label: 'Descripción', value: 'producto' },
  { label: 'Costo Unit.', value: 'costo' },
  { label: 'Importe', value: 'importe' },
]

const EXTRAS_PRESTAMO = [
  { label: 'Monto Total', value: 'monto_total' },
  { label: 'Monto Pagado', value: 'monto_pagado' },
  { label: 'Saldo Pendiente', value: 'saldo_pendiente' },
]

// Construye el bloque de detalle para el mensaje de WhatsApp
function buildDetallePrestamo(
  prestamo: Prestamo | null,
  productos: ProductoAlmacenPrestamo[],
  columnas: string[],
  extras: string[]
): string {
  if (!productos.length || !columnas.length) return ''

  const almacenNombre = prestamo?.almacen?.name || '—'

  const LABELS: Record<string, string> = {
    ubicacion: 'Ubi',
    codigo: 'Cód',
    cantidad: 'Cant',
    unidad: 'Und',
    producto: 'Desc',
    costo: 'Costo',
    importe: 'Importe',
  }

  const lineas: string[] = []
  for (const pa of productos) {
    const prod = pa.productoAlmacen?.producto
    const costo = Number(pa.costo ?? 0)
    const unidades = pa.unidadesDerivadas?.length
      ? pa.unidadesDerivadas
      : [{ name: '—', cantidad: 0, factor: 1 } as any]
    for (const u of unidades) {
      const cantidad = Number(u?.cantidad ?? 0)
      const factor = Number(u?.factor ?? 1)
      const importe = cantidad * factor * costo
      const valores: Record<string, string> = {
        ubicacion: almacenNombre,
        codigo: prod?.cod_producto || '—',
        cantidad: String(cantidad),
        unidad: u?.name || '—',
        producto: prod?.name || '—',
        costo: `S/ ${costo.toFixed(2)}`,
        importe: `S/ ${importe.toFixed(2)}`,
      }
      const partes = columnas
        .filter((c) => valores[c] !== undefined)
        .map((c) => `${LABELS[c]}: ${valores[c]}`)
      lineas.push(`• ${partes.join(' | ')}`)
    }
  }

  let texto = `DETALLE:\n${lineas.join('\n')}`
  if (extras.includes('monto_total')) {
    texto += `\n\nMONTO TOTAL: S/ ${Number(prestamo?.monto_total ?? 0).toFixed(2)}`
  }
  if (extras.includes('monto_pagado')) {
    texto += `\nMONTO PAGADO: S/ ${Number(prestamo?.monto_pagado ?? 0).toFixed(2)}`
  }
  if (extras.includes('saldo_pendiente')) {
    texto += `\nSALDO PENDIENTE: S/ ${Number(prestamo?.monto_pendiente ?? 0).toFixed(2)}`
  }
  return texto
}

// ============= COMPONENT =============

export default function ModalDocPrestamo({
  open,
  setOpen,
  prestamoId,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  prestamoId: string | undefined
}) {
  const [esTicket, setEsTicket] = useState(true)

  // URLs de PDF para cada formato
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)
  const [prestamoData, setPrestamoData] = useState<Prestamo | null>(null)

  const fetchPdf = useCallback(async (id: string, formato: 'ticket' | 'a4') => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/prestamo/${id}?formato=${formato}`, {
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
    if (open && prestamoId && fetchedRef.current !== prestamoId) {
      fetchedRef.current = prestamoId
      setLoading(true)

      fetchPdf(prestamoId, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })

      fetchPdf(prestamoId, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))

      // Cargar datos completos del préstamo (productos, cliente/proveedor)
      prestamoApi.getById(prestamoId)
        .then((res) => { setPrestamoData(res.data?.data ?? null) })
        .catch((err) => console.error('Error datos préstamo:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setA4PdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
      setPrestamoData(null)
    }
  }, [open, prestamoId, fetchPdf])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  const pdfPublicUrl = useMemo(() => {
    if (!prestamoId) return undefined
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    return `${API_URL}/pdf/prestamo/${prestamoId}?formato=a4`
  }, [prestamoId])

  // Nombre de la entidad (cliente o proveedor) y nro de documento
  const entidadNombre =
    prestamoData?.cliente
      ? `${prestamoData.cliente.nombres ?? ''} ${prestamoData.cliente.apellidos ?? ''}`.trim() ||
        prestamoData.cliente.razon_social ||
        'Cliente'
      : prestamoData?.proveedor?.razon_social || 'Proveedor'
  const entidadDoc = prestamoData?.cliente?.numero_documento || prestamoData?.proveedor?.numero_documento || ''
  const entidadEmail = prestamoData?.cliente?.email || prestamoData?.proveedor?.email || ''
  const entidadTelefono = prestamoData?.cliente?.telefono || prestamoData?.proveedor?.telefono || prestamoData?.telefono || ''
  const nroDoc = prestamoData?.numero ?? 'Préstamo'
  const productosPrestamo = prestamoData?.productosPorAlmacen ?? []

  const whatsappMensajeAuto = prestamoData
    ? `Hola!\n\nLe compartimos el detalle de su Préstamo\n\nPRÉSTAMO:\n\t${nroDoc}\n\n${prestamoData.cliente ? 'CLIENTE' : 'PROVEEDOR'}:\n\t${entidadNombre}${entidadDoc ? ` (Doc: ${entidadDoc})` : ''}`
    : undefined

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={nroDoc}
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='prestamo'
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
      pdfPublicUrl={pdfPublicUrl}
      clienteTelefonos={entidadTelefono ? [entidadTelefono] : undefined}
      whatsappMensajeAuto={whatsappMensajeAuto}
      whatsappConfig={{
        pdfPublicUrl,
        columnas: COLUMNAS_PRESTAMO,
        defaultColumnas: ['ubicacion', 'codigo', 'cantidad', 'unidad', 'producto', 'costo', 'importe'],
        extras: EXTRAS_PRESTAMO,
        defaultExtras: ['monto_total', 'monto_pagado', 'saldo_pendiente'],
        buildDetalle: (columnas, extras) =>
          buildDetallePrestamo(prestamoData, productosPrestamo, columnas, extras),
      }}
      emailConfig={{
        emailDefault: entidadEmail,
        columnas: [...COLUMNAS_PRESTAMO, ...EXTRAS_PRESTAMO],
        defaultColumnas: ['ubicacion', 'codigo', 'cantidad', 'unidad', 'producto', 'costo', 'importe'],
        onSend: async (email, columnas, mensaje) => {
          if (!prestamoId) throw new Error('No hay préstamo seleccionado')
          const res = await documentoEmailApi.enviarEmail({
            tipo: 'prestamo',
            id: prestamoId,
            email,
            mensaje,
            formato: esTicket ? 'ticket' : 'a4',
            columnas,
          })
          if (res.error) throw new Error(res.error.message)
        },
      }}
      descargaConfig={{
        columnas: COLUMNAS_PRESTAMO,
        defaultColumnas: ['ubicacion', 'codigo', 'cantidad', 'unidad', 'producto', 'costo', 'importe'],
        extras: EXTRAS_PRESTAMO,
        defaultExtras: ['monto_total', 'monto_pagado', 'saldo_pendiente'],
        fetchBlob: async (columnas, extras) => {
          if (!prestamoId) throw new Error('No hay préstamo seleccionado')
          const token = getAuthToken()
          const API_URL = process.env.NEXT_PUBLIC_API_URL
          const fmt = esTicket ? 'ticket' : 'a4'
          const params = new URLSearchParams({ formato: fmt })
          ;[...columnas, ...extras].forEach((c) => params.append('columnas[]', c))
          const res = await fetch(`${API_URL}/pdf/prestamo/${prestamoId}?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
          })
          if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
          return await res.blob()
        },
      }}
    >
      <></>
    </ModalShowDoc>
  )
}
