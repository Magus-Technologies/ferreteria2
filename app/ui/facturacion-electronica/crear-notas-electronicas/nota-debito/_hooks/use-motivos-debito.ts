import { useQuery } from '@tanstack/react-query'
import { facturacionElectronicaApi } from '~/lib/api/facturacion-electronica'

export default function useMotivosDebito() {
  return useQuery({
    queryKey: ['motivos-debito'],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getMotivosDebito()
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}
