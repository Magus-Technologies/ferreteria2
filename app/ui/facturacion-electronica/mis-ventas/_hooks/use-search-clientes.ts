import { useQuery } from '@tanstack/react-query'
import { clienteApi } from '~/lib/api/cliente'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useSearchClientes({ value }: { value: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.CLIENTES_SEARCH, value],
    queryFn: async () => {
      const res = await clienteApi.getAll({
        search: value || undefined,
        per_page: 20,
      })

      if (res.error) {
        console.error('Error buscando clientes:', res.error)
        return []
      }

      return res.data?.data || []
    },
    // Solo ejecutar la query si hay al menos 2 caracteres
    enabled: value.length >= 2,
  })

  // Si no hay suficientes caracteres, devolver array vacío
  return { 
    response: value.length >= 2 ? (data || []) : [], 
    loading: isLoading 
  }
}
