'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'
import { FaTruck, FaClock } from 'react-icons/fa'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'

interface ModalDespachoEntregaProps {
  open: boolean
  onClose: () => void
  onDespachar: () => Promise<void>
  onDespacharMasTarde?: () => Promise<void>
  entrega?: any
  loading?: boolean
}

export default function ModalDespachoEntrega({
  open,
  onClose,
  onDespachar,
  onDespacharMasTarde,
  entrega,
  loading = false,
}: ModalDespachoEntregaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [despachando, setDespachando] = useState(false)
  const [liberando, setLiberando] = useState(false)
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
    }
  }, [open, entrega?.id, fetchPdf])

  const handleDespachar = async () => {
    setDespachando(true)
    try {
      await onDespachar()
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
          <Button
            onClick={handleDespacharMasTarde}
            loading={liberando}
            icon={<FaClock className="text-slate-400" />}
            className="!rounded-xl !h-10 !px-5 !font-semibold !text-slate-600 hover:!border-slate-400"
          >
            Despachar más tarde
          </Button>
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
