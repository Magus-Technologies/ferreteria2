import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { proveedorApi, type Proveedor } from '~/lib/api/proveedor'

export default function useGetProveedores({ value }: { value: string }) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES_SEARCH, value],
    queryFn: async () => {
      const result = await proveedorApi.getAll({
        search: value,
        per_page: 50
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data?.data || []
    },
    enabled: !!value,
  })

  return {
    response: data,
    refetch,
    loading: isLoading,
  }
}
