'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma, EstadoEntrega } from '@prisma/client'
import {
  EntregaProductoCreateInputSchema,
  EntregaProductoWhereInputSchema,
} from '~/prisma/generated/zod'

const includeEntregaProducto = {
  venta: {
    include: {
      cliente: true,
    },
  },
  almacen_salida: true,
  chofer: true,
  user: true,
  productos_entregados: {
    include: {
      unidad_derivada_venta: {
        include: {
          unidad_derivada_inmutable: true,
          producto_almacen_venta: {
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
            },
          },
        },
      },
    },
  },
} satisfies Prisma.EntregaProductoInclude

export type getEntregaProductoResponseProps = Prisma.EntregaProductoGetPayload<{
  include: typeof includeEntregaProducto
}>

async function getEntregasProductoWA({
  where,
}: {
  where?: Prisma.EntregaProductoWhereInput
}) {
  const puede = await can(permissions.VENTA_LISTADO)
  if (!puede)
    throw new Error('No tienes permiso para ver las entregas de productos')

  if (!where) return { data: [] }

  const whereParsed = EntregaProductoWhereInputSchema.parse(where)

  const items = await prisma.entregaProducto.findMany({
    include: includeEntregaProducto,
    orderBy: {
      fecha_entrega: 'desc',
    },
    where: whereParsed,
    take: 100, // Límite para evitar consultas masivas
  })

  const serialized = JSON.parse(
    JSON.stringify(items, (_key, value) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        value.constructor?.name === 'Decimal'
      ) {
        return Number(value)
      }
      return value
    })
  )

  return { data: serialized as typeof items }
}
export const getEntregasProducto = withAuth(getEntregasProductoWA)

async function createEntregaProductoWA(
  data: Prisma.EntregaProductoCreateInput
) {
  const puede = await can(permissions.VENTA_CREATE)
  if (!puede)
    throw new Error('No tienes permiso para crear entregas de productos')

  const parsedData = EntregaProductoCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      // Crear la entrega
      const entrega = await db.entregaProducto.create({
        data: parsedData,
        include: includeEntregaProducto,
      })

      // Actualizar cantidad_pendiente de cada producto usando los datos creados
      for (const detalleEntrega of entrega.productos_entregados) {
        await db.unidadDerivadaInmutableVenta.update({
          where: { id: detalleEntrega.unidad_derivada_venta_id },
          data: {
            cantidad_pendiente: {
              decrement: detalleEntrega.cantidad_entregada,
            },
          },
        })
      }

      const serialized = JSON.parse(
        JSON.stringify(entrega, (_key, value) => {
          if (
            typeof value === 'object' &&
            value !== null &&
            value.constructor?.name === 'Decimal'
          ) {
            return Number(value)
          }
          return value
        })
      )

      return { data: serialized as typeof entrega }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
export const createEntregaProducto = withAuth(createEntregaProductoWA)

async function updateEstadoEntregaWA({
  id,
  estado_entrega,
}: {
  id: number
  estado_entrega: EstadoEntrega
}) {
  const puede = await can(permissions.VENTA_UPDATE)
  if (!puede)
    throw new Error('No tienes permiso para actualizar entregas de productos')

  const entrega = await prisma.entregaProducto.update({
    where: { id },
    data: { estado_entrega },
    include: includeEntregaProducto,
  })

  const serialized = JSON.parse(
    JSON.stringify(entrega, (_key, value) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        value.constructor?.name === 'Decimal'
      ) {
        return Number(value)
      }
      return value
    })
  )

  return { data: serialized as typeof entrega }
}
export const updateEstadoEntrega = withAuth(updateEstadoEntregaWA)
