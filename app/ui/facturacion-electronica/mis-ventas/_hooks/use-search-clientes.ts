import { useQuery } from '@tanstack/react-query'
import { clienteApi } from '~/lib/api/cliente'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useSearchClientes({
  value,
  profesionId,
}: {
  value: string
  profesionId?: number
}) {
  const searchText = value.trim()

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.CLIENTES_SEARCH, value, profesionId],
    queryFn: async () => {
      const res = await clienteApi.getAll({
        search: searchText.length >= 2 ? searchText : undefined,
        profesion_id: profesionId || undefined,
        per_page: 20,
      })

      if (res.error) {
        console.error('Error buscando clientes:', res.error)
        return []
      }

      return res.data?.data || []
    },
    enabled: searchText.length >= 2 || !!profesionId,
    staleTime: 30_000,
  })

  return {
    response: data || [],
    loading: isLoading,
  }
}
