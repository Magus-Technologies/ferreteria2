'use client'

import { useStoreModalPdfGuia } from '../../_store/store-modal-pdf-guia'
import ModalDocGuia from './modal-doc-guia'

export default function ModalPdfGuiaWrapper() {
  const open = useStoreModalPdfGuia((state) => state.open)
  const guiaId = useStoreModalPdfGuia((state) => state.guiaId)
  const closeModal = useStoreModalPdfGuia((state) => state.closeModal)

  if (!open) return null

  return (
    <ModalDocGuia
      open={open}
      setOpen={(open) => !open && closeModal()}
      guiaId={guiaId}
    />
  )
}
