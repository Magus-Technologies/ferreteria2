'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'
import {
  CompraUncheckedCreateInputSchema,
  CompraWhereInputSchema,
} from '~/prisma/generated/zod'

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
          unidades_derivadas: {
            include: {
              unidad_derivada_inmutable: true,
            },
          },
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

async function createCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async db => {
      const proveedor_serie_numero = await db.compra.findFirst({
        where: {
          proveedor_id: parsedData.proveedor_id,
          serie: parsedData.serie,
          numero: parsedData.numero,
        },
        select: {
          id: true,
        },
      })

      if (proveedor_serie_numero)
        throw new Error(
          'Ya existe una compra con el mismo proveedor, serie y número'
        )

      const compra = await db.compra.create({
        data: parsedData,
      })

      return { data: JSON.parse(JSON.stringify(compra)) as typeof compra }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const createCompra = withAuth(createCompraWA)
