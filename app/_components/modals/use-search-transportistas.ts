import { useDebounce } from 'use-debounce'
import { useQuery } from '@tanstack/react-query'
import { transportistaApi } from '~/lib/api/transportista'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useSearchTransportistas({ value }: { value: string }) {
  const [valueDebounce] = useDebounce(value, 500)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.TRANSPORTISTAS, valueDebounce],
    queryFn: async () => {
      const res = await transportistaApi.list({
        search: valueDebounce || undefined,
        per_page: 20,
      })

      if (res.error) {
        console.error('Error buscando transportistas:', res.error)
        return []
      }

      return res.data?.data || []
    },
    // Mantener datos previos mientras se hace una nueva búsqueda
    placeholderData: previousData => previousData,
  })

  return { response: data, loading: isLoading }
}
