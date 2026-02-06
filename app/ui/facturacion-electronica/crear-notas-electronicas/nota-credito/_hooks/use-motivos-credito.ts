import { useQuery } from '@tanstack/react-query'
import { facturacionElectronicaApi } from '~/lib/api/facturacion-electronica'

export default function useMotivosCredito() {
  return useQuery({
    queryKey: ['motivos-credito'],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getMotivosCredito()
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}
