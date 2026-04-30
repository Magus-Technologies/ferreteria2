'use client'

import { useStoreModalPdfEntrega } from '../../_store/store-modal-pdf-entrega'
import ModalPdfEntrega from './modal-pdf-entrega'

/**
 * Wrapper del modal de PDF de entrega — se renderiza UNA sola vez a nivel
 * de página (mis-entregas/page.tsx). Cualquier componente puede abrirlo
 * llamando `useStoreModalPdfEntrega.getState().openModal(entrega)`.
 * Mismo patrón que `ModalPdfVentaWrapper` en mis-ventas.
 */
export default function ModalPdfEntregaWrapper() {
  const open = useStoreModalPdfEntrega((state) => state.open)
  const entrega = useStoreModalPdfEntrega((state) => state.entrega)
  const closeModal = useStoreModalPdfEntrega((state) => state.closeModal)

  if (!open || !entrega) return null

  return (
    <ModalPdfEntrega
      open={open}
      setOpen={(open) => !open && closeModal()}
      entrega={entrega}
    />
  )
}
