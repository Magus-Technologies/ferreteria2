import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import { clienteApi } from '~/lib/api/cliente'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useSearchClientes({ value }: { value: string }) {
  const [valueDebounce] = useDebounce(value, 500)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.CLIENTES_SEARCH, valueDebounce],
    queryFn: async () => {
      const res = await clienteApi.getAll({
        search: valueDebounce || undefined,
        per_page: 20,
      })

      if (res.error) {
        console.error('Error buscando clientes:', res.error)
        return []
      }

      return res.data?.data || []
    },
    // Mantener datos previos mientras se hace una nueva búsqueda
    placeholderData: (previousData) => previousData,
  })

  return { response: data, loading: isLoading }
}
