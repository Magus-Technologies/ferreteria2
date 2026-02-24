'use client'

import { useQuery } from '@tanstack/react-query'
import { metodoDePagoApi } from '~/lib/api/metodo-de-pago'

interface UseResumenBancoFilters {
  fecha_inicio?: string
  fecha_fin?: string
  vendedor_id?: string
  sub_caja_id?: string
  despliegue_pago_id?: string
}

export function useResumenBanco(bancoId: string, filters?: UseResumenBancoFilters) {
  return useQuery({
    queryKey: ['resumen-banco', bancoId, filters],
    queryFn: async () => {
      const response = await metodoDePagoApi.getResumenDetallado(bancoId, filters)
      
      console.log('🔍 Response completo:', response)
      console.log('🔍 response.data:', response.data)
      
      // ApiResponse tiene estructura: { data?: T, error?: {...} }
      // El backend devuelve: { success: true, data: {...} }
      // Entonces response.data contiene { success: true, data: {...} }
      if (response.error || !response.data) {
        throw new Error(response.error?.message || 'Error al obtener resumen del banco')
      }

      // response.data = { success: true, data: {...} }
      // Necesitamos response.data.data
      const backendResponse = response.data as { success: boolean; data: any }
      console.log('✅ Datos finales:', backendResponse.data)
      
      return backendResponse.data
    },
    enabled: !!bancoId,
  })
}

