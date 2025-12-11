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
    queryFn: () => getVenta({ where }),
    enabled: !!where,
  })

  return {
    response: data?.data,
    loading: isLoading,
  }
}
