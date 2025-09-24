'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'
import { CompraWhereInputSchema } from '~/prisma/generated/zod'

async function getComprasWA({ where }: { where?: Prisma.CompraWhereInput }) {
  const puede = await can(permissions.COMPRAS_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de compras')

  if (!where) return { data: [] }

  const whereParsed = CompraWhereInputSchema.parse(where)

  const items = await prisma.compra.findMany({
    include: {
      proveedor: true,
      productos_por_almacen: {
        include: {
          producto_almacen: {
            include: {
              producto: {
                include: {
                  marca: true,
                  unidad_medida: true,
                },
              },
            },
          },
          unidades_derivadas: true,
        },
      },
      user: true,
    },
    orderBy: {
      created_at: 'asc',
    },
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getCompras = withAuth(getComprasWA)
