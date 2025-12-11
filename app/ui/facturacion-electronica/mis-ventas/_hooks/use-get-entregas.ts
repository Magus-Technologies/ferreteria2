import { getEntregasProducto } from '~/app/_actions/entrega-producto'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { Prisma } from '@prisma/client'

export default function useGetEntregas({
  where,
}: {
  where?: Prisma.EntregaProductoWhereInput
}) {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, where],
    queryFn: () => getEntregasProducto({ where }),
    enabled: !!where,
  })

  return {
    response: data?.data,
    loading: isLoading,
  }
}
