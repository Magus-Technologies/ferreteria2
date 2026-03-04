'use client'

import { useStoreModalPdfGuia } from '../../_store/store-modal-pdf-guia'
import { useQuery } from '@tanstack/react-query'
import { guiaRemisionApi } from '~/lib/api/guia-remision'
import { Spin, Modal } from 'antd'
import ModalDocGuia from './modal-doc-guia'

export default function ModalPdfGuiaWrapper() {
  const open = useStoreModalPdfGuia((state) => state.open)
  const guiaId = useStoreModalPdfGuia((state) => state.guiaId)
  const closeModal = useStoreModalPdfGuia((state) => state.closeModal)

  const { data: guiaData, isLoading } = useQuery({
    queryKey: ['guia-remision-pdf', guiaId],
    queryFn: async () => {
      if (!guiaId) return undefined
      const response = await guiaRemisionApi.getById(guiaId)
      return response.data?.data
    },
    enabled: open && !!guiaId,
  })

  if (!open) return null

  if (isLoading) {
    return (
      <Modal open={open} onCancel={closeModal} footer={null} centered>
        <div className='flex items-center justify-center py-8'>
          <Spin size='large' />
          <span className='ml-3'>Cargando guia...</span>
        </div>
      </Modal>
    )
  }

  return (
    <ModalDocGuia
      open={open}
      setOpen={closeModal}
      data={guiaData}
    />
  )
}
