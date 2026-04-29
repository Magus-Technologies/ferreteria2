'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'
import { FaTruck, FaClock, FaBoxOpen, FaPlusCircle, FaExchangeAlt } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import SelectVehiculos from '~/app/_components/form/selects/select-vehiculos'

interface ModalDespachoEntregaProps {
  open: boolean
  onClose: () => void
  onDespachar: (vehiculoId?: number) => Promise<void>
  onDespacharMasTarde?: () => Promise<void>
  onDespacharParcial?: () => void
  onDespacharRestante?: () => void
  onCambiarTipoEntrega?: () => void
  tieneRestante?: boolean
  loadingRestante?: boolean
  entrega?: any
  loading?: boolean
}

export default function ModalDespachoEntrega({
  open,
  onClose,
  onDespachar,
  onDespacharMasTarde,
  onDespacharParcial,
  onDespacharRestante,
  onCambiarTipoEntrega,
  tieneRestante,
  loadingRestante,
  entrega,
  loading = false,
}: ModalDespachoEntregaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [despachando, setDespachando] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [vehiculoId, setVehiculoId] = useState<number | undefined>(undefined)
  const fetchedRef = useRef<number | null>(null)

  const nroVenta = entrega?.venta?.serie && entrega?.venta?.numero
    ? `${entrega.venta.serie}-${entrega.venta.numero}`
    : 'S/N'

  const fetchPdf = useCallback(async (id: number) => {
    const token = getAuthToken()
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const res = await fetch(`${API_URL}/pdf/entrega-producto/${id}`, {
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
    if (open && entrega?.id && fetchedRef.current !== entrega.id) {
      fetchedRef.current = entrega.id
      setPdfLoading(true)
      fetchPdf(entrega.id)
        .then((url) => {
          setPdfUrl(url)
          setPdfLoading(false)
        })
        .catch((err) => {
          console.error('Error entrega PDF:', err)
          setPdfLoading(false)
        })
    }

    if (!open) {
      setPdfUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      fetchedRef.current = null
      setVehiculoId(undefined)
    }
  }, [open, entrega?.id, fetchPdf])

  const handleDespachar = async () => {
    setDespachando(true)
    try {
      await onDespachar(vehiculoId)
    } finally {
      setDespachando(false)
    }
  }

  const handleDespacharMasTarde = async () => {
    if (onDespacharMasTarde) {
      setLiberando(true)
      try {
        await onDespacharMasTarde()
      } finally {
        setLiberando(false)
      }
    } else {
      onClose()
    }
  }

  const setOpen = (value: boolean) => {
    if (!value) onClose()
  }

  return (
    <>
      <ModalShowDoc
        open={open}
        setOpen={setOpen}
        nro_doc={`Entrega - Venta ${nroVenta}`}
        esTicket={true}
        backendPdfUrl={pdfUrl}
        backendPdfLoading={pdfLoading}
      >
        <></>
      </ModalShowDoc>

      {/* Barra de despacho flotante - portal para estar encima del modal */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          style={{ zIndex: 2100, position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
          className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-orange-200 px-5 py-3"
        >
          <div style={{ minWidth: 220 }}>
            <SelectVehiculos
              placeholder="Vehículo (opcional)"
              variant="outlined"
              size="middle"
              value={vehiculoId}
              onChange={(val) => setVehiculoId(val as number)}
              classNameIcon="text-orange-500 mx-1"
              sizeIcon={14}
            />
          </div>
          <Button
            onClick={handleDespacharMasTarde}
            loading={liberando}
            icon={<FaClock className="text-slate-400" />}
            className="!rounded-xl !h-10 !px-5 !font-semibold !text-slate-600 hover:!border-slate-400"
          >
            Despachar más tarde
          </Button>
          {onCambiarTipoEntrega && (
            <Button
              icon={<FaExchangeAlt className="text-slate-500" />}
              onClick={onCambiarTipoEntrega}
              className="!rounded-xl !h-10 !px-5 !font-semibold !border-slate-400 !text-slate-600 hover:!bg-slate-50"
            >
              Cambiar tipo entrega
            </Button>
          )}
          {onDespacharRestante && tieneRestante && (
            <Button
              icon={<FaPlusCircle className="text-purple-600" />}
              onClick={onDespacharRestante}
              loading={loadingRestante}
              className="!rounded-xl !h-10 !px-5 !font-semibold !border-purple-500 !text-purple-700 hover:!bg-purple-50"
            >
              Despachar restante
            </Button>
          )}
          {onDespacharParcial && (entrega?.productos_entregados?.length || 0) > 0 && (
            <Button
              icon={<FaBoxOpen className="text-amber-600" />}
              onClick={onDespacharParcial}
              className="!rounded-xl !h-10 !px-5 !font-semibold !border-amber-500 !text-amber-700 hover:!bg-amber-50"
            >
              Despachar parcial
            </Button>
          )}
          <Button
            type="primary"
            icon={<FaTruck />}
            loading={despachando || loading}
            onClick={handleDespachar}
            className="!rounded-xl !h-10 !px-6 !font-bold !bg-orange-600 hover:!bg-orange-700 !border-none !shadow-lg !shadow-orange-600/30"
          >
            Despachar ahora
          </Button>
        </div>,
        document.body
      )}
    </>
  )
}
