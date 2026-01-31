import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { guiaRemisionApi, type GuiaRemisionFilters } from '~/lib/api/guia-remision'
import { useStoreFiltrosMisGuias } from '../_store/store-filtros-mis-guias'

export default function useGetGuias() {
  const { filtros } = useStoreFiltrosMisGuias()

  const filters: GuiaRemisionFilters = {
    fecha_emision_desde: filtros.fecha_desde?.format('YYYY-MM-DD'),
    fecha_emision_hasta: filtros.fecha_hasta?.format('YYYY-MM-DD'),
    estado: filtros.estado as any,
    tipo_guia: filtros.tipo_guia as any,
    search: filtros.search,
    per_page: -1, // Traer todas (limitado a 100 en backend)
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QueryKeys.GUIAS_REMISION, filters],
    queryFn: async () => {
      console.log('🔍 Buscando guías con filtros:', filters)
      
      const response = await guiaRemisionApi.list(filters)

      if (response.error) {
        throw new Error(response.error.message)
      }

      console.log('✅ Guías encontradas:', response.data?.data?.length || 0)
      
      return response.data?.data || []
    },
  })

  return {
    guias: (data || []) as any[],
    loading: isLoading,
    error,
    refetch,
  }
}
