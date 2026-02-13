'use client'

import { useState, useEffect } from 'react'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import PDFCompraDocument from '~/lib/pdf/pdf-compra-document'
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
  const [logoDataURI, setLogoDataURI] = useState<string>('')

  useEffect(() => {
    // Cargar el logo cuando se abre el modal
    if (open) {
      fetch('/logo.png')
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onloadend = () => {
            setLogoDataURI(reader.result as string)
          }
          reader.readAsDataURL(blob)
        })
        .catch(err => {
          console.error('Error loading logo:', err)
        })
    }
  }, [open])

  if (!compra) return null

  const numeroComprobante = `${compra.serie || '001'}-${String(compra.numero || 0).padStart(6, '0')}`

  return (
    <ModalShowDoc
      open={open}
      setOpen={setOpen}
      nro_doc={numeroComprobante}
    >
      <PDFCompraDocument compra={compra as any} logoDataURI={logoDataURI} />
    </ModalShowDoc>
  )
}
