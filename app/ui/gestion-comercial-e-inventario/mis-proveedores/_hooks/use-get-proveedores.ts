import { QueryKeys } from '~/app/_lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { proveedorApi, type Proveedor } from '~/lib/api/proveedor'

export default function useGetProveedores({ value }: { value: string }) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES_SEARCH, value],
    queryFn: async () => {
      const result = await proveedorApi.getAll({
        search: value || undefined,
        estado: '1', // Enviar como string '1' para que coincida con la DB
        per_page: 50
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data?.data || []
    },
    // Siempre ejecutar la query para mostrar proveedores inicialmente
    enabled: true,
  })

  return {
    response: data || [],
    refetch,
    loading: isLoading,
  }
}
