'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cajaApi } from '~/lib/api/caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCheckAperturaDiaria() {
  const [shouldOpenModal, setShouldOpenModal] = useState(false)
  const queryClient = useQueryClient()

  // Obtener la caja activa del usuario
  const { data: cajaActiva, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA],
    queryFn: async () => {
      const response = await cajaApi.cajaActiva()
      return response.data?.data || null
    },
    staleTime: 0, // No cachear, siempre refetchar
    gcTime: 0, // No guardar en caché
    refetchInterval: 5000, // Refetchar cada 5 segundos para detectar cambios
  })

  // Verificar si hay apertura del día
  useEffect(() => {
    if (!isLoading && cajaActiva) {
      // Si hay caja activa, no abrir modal
      setShouldOpenModal(false)
    } else if (!isLoading && !cajaActiva) {
      // Si no hay caja activa, abrir modal
      setShouldOpenModal(true)
    }
  }, [cajaActiva, isLoading])

  // Función para refetchar después de una apertura exitosa
  const refetchApertura = async () => {
    await queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
    await refetch()
  }

  return {
    shouldOpenModal,
    isLoading,
    hasApertura: !!cajaActiva,
    cajaActiva,
    refetchApertura,
  }
}
