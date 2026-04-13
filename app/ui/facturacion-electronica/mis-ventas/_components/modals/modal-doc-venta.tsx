import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken, apiRequest } from '~/lib/api'
import { useQzPrintMultiple } from '~/hooks/use-qz-print-multiple'
import { message } from 'antd'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { documentoEmailApi } from '~/lib/api/documento-email'

// ============= COMPONENT =============

export default function ModalDocVenta({
  open,
  setOpen,
  ventaId,
  ventaData,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  ventaId: string | undefined
  /** Datos de la venta (del response de creación). Si tiene vales, se imprimen por separado. */
  ventaData?: any
}) {
  const [esTicket, setEsTicket] = useState(true)

  // URLs de PDF para cada formato (preview = combinado con vales)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [a4PdfUrl, setA4PdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef<string | null>(null)

  // Datos de la venta (props o fetched)
  const [fetchedVentaData, setFetchedVentaData] = useState<any>(null)
  const ventaInfo = ventaData || fetchedVentaData

  const { imprimirMultiple } = useQzPrintMultiple('ticket')
  const { data: empresa } = useEmpresaPublica()

  // Construir mensaje de WhatsApp con datos de la venta
  const whatsappMensajeAuto = useMemo(() => {
    if (!ventaInfo) return undefined
    const tipoDoc = ventaInfo.tipo_documento === '01' ? 'FACTURA'
      : ventaInfo.tipo_documento === '03' ? 'BOLETA'
      : 'NOTA DE VENTA'
    const serie = ventaInfo.serie || ''
    const numero = String(ventaInfo.numero || '').padStart(8, '0')
    const nroDoc = `${serie}-${numero}`

    const cliente = ventaInfo.cliente
    const clienteNombre = cliente?.razon_social
      || [cliente?.nombres, cliente?.apellidos].filter(Boolean).join(' ')
      || 'Cliente'
    const clienteDoc = cliente?.numero_documento || ''

    // Productos y calcular total
    const productosLineas: string[] = []
    let subtotalGeneral = 0
    const productosAlmacen = ventaInfo.productos_por_almacen ?? []
    for (const pa of productosAlmacen) {
      const productoName = pa.producto_almacen?.producto?.name || 'Producto'
      const unidades = pa.unidades_derivadas ?? []
      for (const ud of unidades) {
        const cant = Number(ud.cantidad || 0)
        const precio = Number(ud.precio || 0)
        const recargo = Number(ud.recargo || 0)
        const descuento = Number(ud.descuento || 0)
        const subtotal = cant * (precio + recargo)
        subtotalGeneral += subtotal - descuento
        productosLineas.push(`  - ${cant} ${productoName}  S/ ${subtotal.toFixed(2)}`)
      }
    }

    // Total con IGV
    const igv = subtotalGeneral * 0.18
    const totalConIgv = subtotalGeneral + igv
    // Si hay comprobante electrónico, usar ese total (es más preciso)
    const totalFinal = ventaInfo.comprobante_electronico?.importe_total
      ? Number(ventaInfo.comprobante_electronico.importe_total)
      : totalConIgv
    const empresaNombre = empresa?.razon_social || ''

    let msg = `Hola!\n\nHemos generado tu ${tipoDoc} desde ${empresaNombre}\n\n`
    msg += `DOCUMENTO:\n\t${nroDoc}\n\n`
    msg += `CLIENTE:\n\t${clienteNombre}${clienteDoc ? ` (${clienteDoc})` : ''}\n\n`
    if (productosLineas.length > 0) {
      msg += `PRODUCTOS:\n${productosLineas.join('\n')}\n\n`
    }
    msg += `TOTAL:\n\tS/ ${totalFinal.toFixed(2)}`

    return msg
  }, [ventaInfo, empresa])

  // URL pública del PDF para WhatsApp
  const pdfPublicUrl = useMemo(() => {
    if (!ventaId) return undefined
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    return `${API_URL}/pdf/venta/${ventaId}?formato=a4`
  }, [ventaId])

  // Email del cliente
  const clienteEmail = ventaInfo?.cliente?.email || undefined

  // Teléfonos del cliente
  const clienteTelefonos = useMemo(() => {
    const cliente = ventaInfo?.cliente
    if (!cliente) return undefined
    const tels: string[] = []
    if (cliente.telefono) tels.push(cliente.telefono)
    if (cliente.celular) tels.push(cliente.celular)
    return tels.length > 0 ? tels : undefined
  }, [ventaInfo])

  // Contar vales generados (los que se imprimen como tickets separados)
  const valesGenerados = (ventaInfo?.vales_aplicados ?? []).filter(
    (v: any) => v.genera_vale_futuro && v.codigo_vale_generado
  )
  const tieneVales = valesGenerados.length > 0

  const fetchPdfBlob = useCallback(async (url: string): Promise<Blob> => {
    const token = getAuthToken()
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    })
    if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
    return res.blob()
  }, [])

  const fetchPdf = useCallback(async (id: string, formato: 'ticket' | 'a4') => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const blob = await fetchPdfBlob(`${API_URL}/pdf/venta/${id}?formato=${formato}`)
    return URL.createObjectURL(blob)
  }, [fetchPdfBlob])

  // Fetch venta data si no se proporcionó (para saber si tiene vales)
  useEffect(() => {
    if (open && ventaId && !ventaData) {
      apiRequest<any>(`/ventas/${ventaId}`)
        .then((res) => {
          if (res.data?.data) setFetchedVentaData(res.data.data)
        })
        .catch(() => {}) // No es crítico, simplemente no separará vales
    }
    if (!open) setFetchedVentaData(null)
  }, [open, ventaId, ventaData])

  // Pre-cargar ambos PDFs cuando se abre el modal
  useEffect(() => {
    if (open && ventaId && fetchedRef.current !== ventaId) {
      fetchedRef.current = ventaId
      setLoading(true)

      // Cargar ticket primero (es el que se muestra por defecto)
      fetchPdf(ventaId, 'ticket')
        .then((url) => {
          setTicketPdfUrl(url)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error ticket PDF:', err)
          setLoading(false)
        })

      // Cargar A4 en paralelo
      fetchPdf(ventaId, 'a4')
        .then((url) => setA4PdfUrl(url))
        .catch((err) => console.error('Error A4 PDF:', err))
    }

    if (!open) {
      setTicketPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      setA4PdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
    }
  }, [open, ventaId, fetchPdf])

  /**
   * Impresión custom: si es ticket y hay vales, imprime boleta y cada vale
   * como print jobs separados → la ticketera corta entre cada uno.
   */
  const handleCustomPrint = useCallback(async () => {
    if (!ventaId) return
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    // Si es A4 o no hay vales, no usar impresión custom (deja que ModalShowDoc use el flujo normal)
    if (!esTicket || !tieneVales) return

    try {
      // 1. Fetch boleta SIN vales
      const boletaBlob = await fetchPdfBlob(
        `${API_URL}/pdf/venta/${ventaId}?formato=ticket&sin_vales=1`
      )

      // 2. Fetch cada vale generado individualmente
      const valeBlobs: Blob[] = []
      for (let i = 0; i < valesGenerados.length; i++) {
        const valeBlob = await fetchPdfBlob(
          `${API_URL}/pdf/venta/${ventaId}/vale-generado/${i}`
        )
        valeBlobs.push(valeBlob)
      }

      // 3. Imprimir todos como jobs separados: boleta → vale1 → vale2 → ...
      const allBlobs = [boletaBlob, ...valeBlobs]
      await imprimirMultiple(allBlobs)
    } catch (err) {
      console.error('Error en impresión separada:', err)
      message.error('Error al imprimir. Reintente.')
    }
  }, [ventaId, esTicket, tieneVales, valesGenerados.length, fetchPdfBlob, imprimirMultiple])

  const currentPdfUrl = esTicket ? ticketPdfUrl : a4PdfUrl
  const currentLoading = esTicket ? loading : !a4PdfUrl

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc=""
      setEsTicket={setEsTicket}
      esTicket={esTicket}
      tipoDocumento='venta'
      backendPdfUrl={currentPdfUrl}
      backendPdfLoading={currentLoading && !currentPdfUrl}
      onCustomPrint={esTicket && tieneVales ? handleCustomPrint : undefined}
      clienteTelefonos={clienteTelefonos}
      whatsappMensajeAuto={whatsappMensajeAuto}
      pdfPublicUrl={pdfPublicUrl}
      emailConfig={{
        emailDefault: clienteEmail,
        onSend: async (email) => {
          if (!ventaId) throw new Error('No hay venta seleccionada')
          const res = await documentoEmailApi.enviarEmail({ tipo: 'venta', id: ventaId, email })
          if (res.error) throw new Error(res.error.message)
        },
      }}
    >
      {/* Fallback vacío - todo se renderiza desde el backend */}
      <></>
    </ModalShowDoc>
  )
}
