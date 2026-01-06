'use client'

import { useStoreModalPdfCotizacion } from '../../_store/store-modal-pdf-cotizacion'
import { useQuery } from '@tanstack/react-query'
import { cotizacionesApi } from '~/lib/api/cotizaciones'
import { Spin, Modal } from 'antd'
import ModalDocCotizacion from './modal-doc-cotizacion'

export default function ModalPdfCotizacionWrapper() {
  const open = useStoreModalPdfCotizacion((state) => state.open)
  const cotizacionId = useStoreModalPdfCotizacion((state) => state.cotizacionId)
  const closeModal = useStoreModalPdfCotizacion((state) => state.closeModal)

  // Cargar datos de la cotización cuando se abre el modal
  const { data: cotizacionData, isLoading } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: async () => {
      if (!cotizacionId) return null
      const response = await cotizacionesApi.getById(cotizacionId)
      return response.data?.data
    },
    enabled: open && !!cotizacionId,
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
          <span className="ml-3">Cargando cotización...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalDocCotizacion
      open={open}
      setOpen={(open) => !open && closeModal()}
      data={cotizacionData || undefined}
    />
  )
}
