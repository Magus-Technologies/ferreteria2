import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'

export interface Cargo {
  codigo: string
  descripcion: string
}

/**
 * Catálogo de cargos para el selector de "pedido externo".
 * Es global y rara vez cambia → cache estándar de React Query.
 */
export function useCargos() {
  return useQuery({
    queryKey: ['catalogos', 'cargos'],
    queryFn: async () => {
      const result = await apiRequest<{ data: Cargo[] }>('/catalogos/cargos')
      return result.data?.data || []
    },
  })
}
