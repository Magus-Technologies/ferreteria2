'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Compra, EstadoDeCompra, Prisma } from '@prisma/client'
import {
  CompraUncheckedCreateInputSchema,
  CompraWhereInputSchema,
} from '~/prisma/generated/zod'
import { includeCompra } from './lib/lib-compra'

export type getComprasResponseProps = Prisma.CompraGetPayload<{
  include: typeof includeCompra
}>

async function getComprasWA({ where }: { where?: Prisma.CompraWhereInput }) {
  const puede = await can(permissions.COMPRAS_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de compras')

  if (!where) return { data: [] }

  const whereParsed = CompraWhereInputSchema.parse(where)

  const items = await prisma.compra.findMany({
    include: includeCompra,
    orderBy: {
      fecha: 'asc',
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

async function eliminarCompraWA({ id }: { id: Compra['id'] }) {
  const puede = await can(permissions.COMPRAS_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar una compra')

  const compra = await prisma.compra.findUnique({
    where: {
      id,
    },
    select: {
      _count: {
        select: {
          recepciones_almacen: {
            where: {
              estado: true,
            },
          },
        },
      },
      estado_de_compra: true,
    },
  })

  if (!compra) throw new Error('Compra no encontrada')

  if (
    compra.estado_de_compra === EstadoDeCompra.Procesado ||
    compra.estado_de_compra === EstadoDeCompra.Anulado
  )
    throw new Error('La compra no se puede eliminar')

  if (compra._count.recepciones_almacen > 0)
    throw new Error(
      'La compra no se puede eliminar porque tiene Recepciones de Almacén activas'
    )

  await prisma.compra.update({
    where: {
      id,
    },
    data: {
      estado_de_compra: EstadoDeCompra.Anulado,
    },
  })

  return { data: 'ok' }
}
export const eliminarCompra = withAuth(eliminarCompraWA)

async function editarCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async db => {
      const proveedor_serie_numero = await db.compra.findFirst({
        where: {
          proveedor_id: parsedData.proveedor_id,
          serie: parsedData.serie,
          numero: parsedData.numero,
          id: {
            not: parsedData.id,
          },
        },
        select: {
          id: true,
        },
      })

      if (proveedor_serie_numero)
        throw new Error(
          'Ya existe una compra con el mismo proveedor, serie y número (edición)'
        )

      const compra = await db.compra.update({
        where: {
          id: parsedData.id,
        },
        data: {
          ...parsedData,
          productos_por_almacen: {
            deleteMany: {},
            ...parsedData.productos_por_almacen,
          },
        },
      })

      return { data: JSON.parse(JSON.stringify(compra)) as typeof compra }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const editarCompra = withAuth(editarCompraWA)
