'use client'

import { useStoreModalPdfVenta } from '../../_store/store-modal-pdf-venta'
import ModalDocVenta from './modal-doc-venta'

export default function ModalPdfVentaWrapper() {
  const open = useStoreModalPdfVenta((state) => state.open)
  const ventaId = useStoreModalPdfVenta((state) => state.ventaId)
  const closeModal = useStoreModalPdfVenta((state) => state.closeModal)

  if (!open) return null

  return (
    <ModalDocVenta
      open={open}
      setOpen={(open) => !open && closeModal()}
      ventaId={ventaId}
    />
  )
}
