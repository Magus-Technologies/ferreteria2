'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cajaApi } from '~/lib/api/caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'

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
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  })

  // Verificar si la apertura es de hoy
  const esAperturaDeHoy = useCallback(() => {
    if (!cajaActiva) return false
    
    const fechaApertura = dayjs(cajaActiva.fecha_apertura)
    const hoy = dayjs()
    
    return fechaApertura.isSame(hoy, 'day')
  }, [cajaActiva])

  // Verificar si hay apertura del día
  useEffect(() => {
    if (!isLoading) {
      const tieneAperturaHoy = esAperturaDeHoy()
      setShouldOpenModal(!tieneAperturaHoy)
    }
  }, [cajaActiva, isLoading, esAperturaDeHoy])

  // Función para refetchar después de una apertura exitosa
  const refetchApertura = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
    const result = await refetch()
    return result
  }, [queryClient, refetch])

  const tieneAperturaHoy = esAperturaDeHoy()

  return {
    shouldOpenModal,
    isLoading,
    hasApertura: tieneAperturaHoy,
    cajaActiva,
    refetchApertura,
    distribucionCompletada: tieneAperturaHoy,
  }
}

export default useCheckAperturaDiaria

