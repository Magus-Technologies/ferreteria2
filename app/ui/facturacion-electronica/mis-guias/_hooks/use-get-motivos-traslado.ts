import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { motivoTrasladoApi, type MotivoTraslado } from '~/lib/api/motivo-traslado'

export default function useGetMotivosTraslado({ value }: { value: string }) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: [QueryKeys.MOTIVOS_TRASLADO, value],
    queryFn: async () => {
      const result = await motivoTrasladoApi.getAll({
        activo: true,
        search: value || undefined,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data?.data || []
    },
    // Siempre ejecutar la query para mostrar motivos inicialmente
    enabled: true,
  })

  return {
    response: data || [],
    refetch,
    loading: isLoading,
  }
}
