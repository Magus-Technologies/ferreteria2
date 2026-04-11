'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cajaApi } from '~/lib/api/caja'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'

export function useCheckAperturaDiaria() {
  const queryClient = useQueryClient()

  const { data: cajaActiva, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA],
    queryFn: async () => {
      const response = await cajaApi.cajaActiva()
      return response.data?.data || null
    },
    staleTime: 30000,
    gcTime: 60000,
  })

  const esAperturaDeHoy = useCallback(() => {
    if (!cajaActiva) return false
    return dayjs(cajaActiva.fecha_apertura).isSame(dayjs(), 'day')
  }, [cajaActiva])

  const refetchApertura = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
    const result = await refetch()
    return result
  }, [queryClient, refetch])

  const tieneAperturaHoy = esAperturaDeHoy()

  return {
    isLoading,
    hasApertura: tieneAperturaHoy,
    cajaActiva,
    refetchApertura,
    distribucionCompletada: tieneAperturaHoy,
  }
}
