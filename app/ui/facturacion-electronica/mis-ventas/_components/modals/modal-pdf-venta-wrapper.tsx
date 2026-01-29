'use client'

import { useStoreModalPdfVenta } from '../../_store/store-modal-pdf-venta'
import { useQuery } from '@tanstack/react-query'
import { ventaApi } from '~/lib/api/venta'
import { Spin, Modal } from 'antd'
import ModalDocVenta from './modal-doc-venta'

export default function ModalPdfVentaWrapper() {
  const open = useStoreModalPdfVenta((state) => state.open)
  const ventaId = useStoreModalPdfVenta((state) => state.ventaId)
  const closeModal = useStoreModalPdfVenta((state) => state.closeModal)

  // Cargar datos de la venta cuando se abre el modal
  const { data: ventaData, isLoading } = useQuery({
    queryKey: ['venta', ventaId],
    queryFn: async () => {
      if (!ventaId) return null
      const response = await ventaApi.getById(ventaId)
      return response.data?.data
    },
    enabled: open && !!ventaId,
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
          <span className="ml-3">Cargando venta...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalDocVenta
      open={open}
      setOpen={closeModal}
      data={ventaData}
    />
  )
}
