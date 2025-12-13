'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Compra, EstadoDeCompra, Prisma } from '@prisma/client'
import {
  CompraUncheckedCreateInputSchema,
  CompraUncheckedUpdateInputSchema,
  CompraWhereInputSchema,
} from '~/prisma/generated/zod'
import { includeCompra } from './lib/lib-compra'
import {
  devolverDineroDeCompra,
  procesoPostCompra,
  validarNuevaCompra,
} from './utils/compra'

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
    take: 100, // Límite para evitar consultas masivas
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getCompras = withAuth(getComprasWA)

// Versión paginada optimizada para compras
async function getComprasPaginatedWA({
  where,
  skip = 0,
  take = 50,
}: {
  where?: Prisma.CompraWhereInput
  skip?: number
  take?: number
}) {
  const puede = await can(permissions.COMPRAS_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver las compras')

  if (!where) return { data: { data: [], total: 0, hasMore: false } }

  const whereParsed = CompraWhereInputSchema.parse(where)

  const [items, total] = await Promise.all([
    prisma.compra.findMany({
      include: includeCompra,
      orderBy: {
        fecha: 'desc',
      },
      where: whereParsed,
      skip,
      take,
    }),
    prisma.compra.count({ where: whereParsed }),
  ])

  return {
    data: {
      data: JSON.parse(JSON.stringify(items)) as typeof items,
      total,
      hasMore: skip + take < total,
    },
  }
}
export const getComprasPaginated = withAuth(getComprasPaginatedWA)

async function createCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      await validarNuevaCompra({ compra: parsedData, db })

      const compra = await db.compra.create({
        data: parsedData,
      })

      await procesoPostCompra({ compra: { ...parsedData, id: compra.id }, db })

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

  return await prisma.$transaction(
    async (db) => {
      const compra = await db.compra.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              recepciones_almacen: { where: { estado: true } },
              pagos_de_compras: { where: { estado: true } },
            },
          },
          productos_por_almacen: {
            include: {
              unidades_derivadas: true,
            },
          },
        },
      })

      if (!compra) throw new Error('Compra no encontrada')

      if (
        compra.estado_de_compra === EstadoDeCompra.Procesado ||
        compra.estado_de_compra === EstadoDeCompra.Anulado
      )
        throw new Error('La compra no se puede anular')

      if (compra._count.recepciones_almacen > 0)
        throw new Error(
          'La compra no se puede anular porque tiene Recepciones de Almacén activas'
        )

      if (compra._count.pagos_de_compras > 0)
        throw new Error(
          'La compra no se puede anular porque tiene Pagos de Compra activos'
        )

      await devolverDineroDeCompra({ compra, db })

      if (compra.egreso_dinero_id)
        await db.egresoDinero.update({
          where: { id: compra.egreso_dinero_id },
          data: { estado: false },
        })

      await db.compra.update({
        where: { id },
        data: {
          estado_de_compra: EstadoDeCompra.Anulado,
          egreso_dinero_id: null,
        },
      })

      return { data: 'ok' }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
export const eliminarCompra = withAuth(eliminarCompraWA)

async function editarCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      await validarNuevaCompra({ compra: parsedData, db })

      const compra = await db.compra.findUniqueOrThrow({
        where: { id: parsedData.id },
        include: {
          productos_por_almacen: {
            include: {
              unidades_derivadas: true,
            },
          },
        },
      })

      await devolverDineroDeCompra({ compra, db })

      const nueva_compra = await db.compra.update({
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

      await procesoPostCompra({ compra: parsedData, db })

      return {
        data: JSON.parse(JSON.stringify(nueva_compra)) as typeof nueva_compra,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const editarCompra = withAuth(editarCompraWA)

async function updateCompraWA({
  data,
  id,
}: {
  data: Prisma.CompraUncheckedUpdateInput
  id: Compra['id']
}) {
  const puede = await can(permissions.COMPRAS_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar una compra')

  const parsedData = CompraUncheckedUpdateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      const compra = await db.compra.update({
        where: {
          id,
        },
        data: parsedData,
      })

      return { data: JSON.parse(JSON.stringify(compra)) as typeof compra }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const updateCompra = withAuth(updateCompraWA)
