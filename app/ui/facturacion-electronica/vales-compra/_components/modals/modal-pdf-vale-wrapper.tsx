'use client'

import { useStoreModalPdfVale } from '../../_store/store-modal-pdf-vale'
import { useQuery } from '@tanstack/react-query'
import { getValeCompra } from '~/lib/api/vales-compra'
import { Spin, Modal } from 'antd'
import ModalDocVale from './modal-doc-vale'

export default function ModalPdfValeWrapper() {
  const open = useStoreModalPdfVale((state) => state.open)
  const valeId = useStoreModalPdfVale((state) => state.valeId)
  const closeModal = useStoreModalPdfVale((state) => state.closeModal)

  // Cargar datos del vale cuando se abre el modal
  const { data: valeData, isLoading } = useQuery({
    queryKey: ['vale-compra', valeId],
    queryFn: async () => {
      if (!valeId) return null
      const response = await getValeCompra(valeId)
      return response.data
    },
    enabled: open && !!valeId,
  })

  if (!open) return null

  if (isLoading) {
    return (
      <Modal
        open={open}
        onCancel={closeModal}
        footer={null}
        centered
      >
        <div className="flex items-center justify-center py-8">
          <Spin size="large" />
          <span className="ml-3">Cargando vale...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalDocVale
      open={open}
      setOpen={closeModal}
      data={valeData}
    />
  )
}
