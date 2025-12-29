import { getVenta } from '~/app/_actions/venta'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { Prisma } from '@prisma/client'

export default function useGetVentas({
  where,
}: {
  where?: Prisma.VentaWhereInput
}) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS, where],
    queryFn: () => getVenta({ where: where || {} }),
    // Siempre habilitado, si no hay filtros se cargan todas las ventas
  })

  return {
    response: data?.data,
    loading: isLoading,
  }
}
