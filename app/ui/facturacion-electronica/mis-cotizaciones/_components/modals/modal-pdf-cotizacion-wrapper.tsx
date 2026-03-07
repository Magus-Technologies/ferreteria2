'use client'

import { useStoreModalPdfCotizacion } from '../../_store/store-modal-pdf-cotizacion'
import { useQuery } from '@tanstack/react-query'
import { cotizacionesApi } from '~/lib/api/cotizaciones'
import ModalDocCotizacion from './modal-doc-cotizacion'

export default function ModalPdfCotizacionWrapper() {
  const open = useStoreModalPdfCotizacion((state) => state.open)
  const cotizacionId = useStoreModalPdfCotizacion((state) => state.cotizacionId)
  const closeModal = useStoreModalPdfCotizacion((state) => state.closeModal)

  // Cargar datos de la cotización (necesario para modo ticket)
  const { data: cotizacionData, isLoading: isLoadingData } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: async () => {
      if (!cotizacionId) return null
      const response = await cotizacionesApi.getById(cotizacionId)
      return response.data?.data
    },
    enabled: open && !!cotizacionId,
  })

  if (!open) return null

  // Renderizar modal inmediatamente — el PDF del backend se carga en paralelo dentro del modal
  return (
    <ModalDocCotizacion
      open={open}
      setOpen={(open) => !open && closeModal()}
      cotizacionId={cotizacionId}
      data={cotizacionData || undefined}
      isLoadingData={isLoadingData}
    />
  )
}
