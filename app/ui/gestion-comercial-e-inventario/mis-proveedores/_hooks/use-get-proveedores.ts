import { Prisma } from '@prisma/client'
import { SearchProveedor } from '~/app/_actions/proveedor'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useServerQuery } from '~/hooks/use-server-query'

export default function useGetProveedores({ value }: { value: string }) {
  const { response, refetch, loading } = useServerQuery({
    action: SearchProveedor,
    propsQuery: {
      queryKey: [QueryKeys.PROVEEDORES_SEARCH],
      enabled: !!value,
    },
    params: {
      where: {
        OR: [
          {
            razon_social: {
              contains: value,
              mode: 'insensitive',
            },
          },
          {
            ruc: {
              contains: value,
              mode: 'insensitive',
            },
          },
        ],
      },
    } satisfies Prisma.ProveedorFindManyArgs,
  })

  return {
    response,
    refetch,
    loading,
  }
}
