'use client'

import { useState, useEffect } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import { getAuthToken } from '~/lib/api'
import { type Compra } from '~/lib/api/compra'

interface ModalDocCompraProps {
  open: boolean
  setOpen: (open: boolean) => void
  compra: Compra | undefined
}

export default function ModalDocCompra({
  open,
  setOpen,
  compra,
}: ModalDocCompraProps) {
  const [backendPdfUrl, setBackendPdfUrl] = useState<string | null>(null)
  const [backendPdfLoading, setBackendPdfLoading] = useState(false)

  useEffect(() => {
    if (open && compra) {
      setBackendPdfLoading(true)
      const token = getAuthToken()
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdf/compra/${compra.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Error al generar PDF')
          return res.blob()
        })
        .then(blob => setBackendPdfUrl(URL.createObjectURL(blob)))
        .catch(() => setBackendPdfUrl(null))
        .finally(() => setBackendPdfLoading(false))
    }
    if (!open && backendPdfUrl) {
      URL.revokeObjectURL(backendPdfUrl)
      setBackendPdfUrl(null)
    }
  }, [open, compra?.id])

  if (!compra) return null

  const numeroComprobante = `${compra.serie || '001'}-${String(compra.numero || 0).padStart(6, '0')}`

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={numeroComprobante}
      backendPdfUrl={backendPdfUrl}
      backendPdfLoading={backendPdfLoading}
    >
      {null as any}
    </ModalShowDoc>
  )
}
