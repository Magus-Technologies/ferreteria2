'use client'

import { Modal, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { FaDownload, FaPrint } from 'react-icons/fa6'
import { getAuthToken } from '~/lib/api'
import ButtonBase from '~/components/buttons/button-base'

interface ModalPdfEntregaProps {
  open: boolean
  onClose: () => void
  entrega?: any
}

/**
 * Modal para visualizar el PDF de una entrega.
 *
 * Estilo y comportamiento similar al modal de mis-ventas (modal-doc-venta /
 * modal-show-doc): muestra el PDF embebido + acciones de imprimir y descargar.
 *
 * El título del PDF cambia según el estado de la entrega (lo decide el blade
 * en el backend): VALE DE RECOJO si está pendiente, TICKET DE ENTREGA si ya
 * se entregó, etc.
 */
export default function ModalPdfEntrega({
  open,
  onClose,
  entrega,
}: ModalPdfEntregaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const tituloModal = (() => {
    switch (entrega?.estado_entrega) {
      case 'pe':
        return 'Vale de Recojo'
      case 'ec':
        return 'Entrega en Camino'
      case 'ca':
        return 'Entrega Cancelada'
      default:
        return 'Ticket de Entrega'
    }
  })()

  const ventaNumero =
    entrega?.venta?.serie && entrega?.venta?.numero
      ? `${entrega.venta.serie}-${entrega.venta.numero}`
      : 'S/N'

  useEffect(() => {
    if (!open || !entrega?.id) {
      // Limpiar la URL anterior al cerrar para liberar memoria
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }

    let cancelled = false
    setLoading(true)
    const fetchPdf = async () => {
      try {
        const token = getAuthToken()
        const API_URL = process.env.NEXT_PUBLIC_API_URL
        const res = await fetch(
          `${API_URL}/pdf/entrega-producto/${entrega.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
            },
          },
        )
        if (!res.ok) throw new Error(`Error PDF: ${res.status}`)
        const blob = await res.blob()
        if (cancelled) return
        setPdfUrl(URL.createObjectURL(blob))
      } catch (err) {
        console.error('Error cargando PDF entrega:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPdf()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entrega?.id])

  const handleDescargar = () => {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = `${tituloModal.replace(/\s+/g, '-')}-${ventaNumero}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleImprimir = () => {
    if (!pdfUrl) return
    const win = window.open(pdfUrl, '_blank')
    win?.addEventListener('load', () => win.print())
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={520}
      centered
      destroyOnHidden
      title={
        <div>
          <div className="text-base font-bold text-slate-800">{tituloModal}</div>
          <div className="text-xs font-normal text-slate-500 mt-0.5">
            Venta {ventaNumero}
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <ButtonBase
            color="default"
            onClick={handleDescargar}
            disabled={!pdfUrl}
            className="flex items-center gap-2"
          >
            <FaDownload /> Descargar
          </ButtonBase>
          <ButtonBase
            color="info"
            onClick={handleImprimir}
            disabled={!pdfUrl}
            className="flex items-center gap-2"
          >
            <FaPrint /> Imprimir
          </ButtonBase>
        </div>
      }
    >
      <div
        style={{ height: '70vh' }}
        className="bg-slate-100 rounded-lg flex items-center justify-center"
      >
        {loading && <Spin size="large" tip="Cargando PDF..." />}
        {!loading && pdfUrl && (
          <iframe
            src={pdfUrl}
            title={tituloModal}
            className="w-full h-full rounded-lg border-0"
          />
        )}
        {!loading && !pdfUrl && (
          <div className="text-slate-500 text-sm">No se pudo cargar el PDF</div>
        )}
      </div>
    </Modal>
  )
}
