import { useQuery } from '@tanstack/react-query'
import { clienteApi } from '~/lib/api/cliente'
import { QueryKeys } from '~/app/_lib/queryKeys'

/**
 * Hook para obtener el último cliente registrado
 * Usado por defecto en Boletas y Notas de Venta
 */
export function useUltimoCliente() {
  return useQuery({
    queryKey: [QueryKeys.CLIENTES, 'ultimo'],
    queryFn: async () => {
      const response = await clienteApi.getAll({
        per_page: 1,
        page: 1,
        // Ordenar por fecha de creación descendente para obtener el más reciente
      })

      if (response.error) {
        console.error('Error obteniendo último cliente:', response.error)
        return null
      }

      // Retornar el primer cliente (el más reciente)
      const ultimoCliente = response.data?.data?.[0]

      return ultimoCliente || null
    },
    staleTime: 10000, // 10 segundos
  })
}
