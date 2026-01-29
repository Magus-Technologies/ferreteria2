import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import { choferApi } from '~/lib/api/chofer'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useSearchChoferes({ value }: { value: string }) {
  const [valueDebounce] = useDebounce(value, 500)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.CHOFERES, valueDebounce],
    queryFn: async () => {
      const res = await choferApi.getAll({
        search: valueDebounce || undefined,
        per_page: 20,
      })

      if (res.error) {
        console.error('Error buscando choferes:', res.error)
        return []
      }

      return res.data?.data || []
    },
    // Mantener datos previos mientras se hace una nueva búsqueda
    placeholderData: (previousData) => previousData,
  })

  return { response: data, loading: isLoading }
}
