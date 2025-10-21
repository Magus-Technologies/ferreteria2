'use server'

import { EstadoDeCompra, Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import {
  RecepcionAlmacenUncheckedCreateInputSchema,
  RecepcionAlmacenWhereInputSchema,
} from '~/prisma/generated/zod'
import can from '~/utils/server-validate-permission'
import { getUltimoNumeroRecepcionAlmacen } from './utils/recepcion-almacen'

const includeRecepcionAlmacen = {
  compra: true,
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
}
export type getRecepcionesAlmacenResponseProps =
  Prisma.RecepcionAlmacenGetPayload<{
    include: typeof includeRecepcionAlmacen
  }>

async function getRecepcionesAlmacenWA({
  where,
}: {
  where?: Prisma.RecepcionAlmacenWhereInput
}) {
  const puede = await can(permissions.RECEPCION_ALMACEN_LISTADO)
  if (!puede)
    throw new Error('No tienes permiso para ver la lista de recepciones')

  if (!where) return { data: [] }

  const whereParsed = RecepcionAlmacenWhereInputSchema.parse(where)

  const items = await prisma.recepcionAlmacen.findMany({
    include: includeRecepcionAlmacen,
    orderBy: {
      fecha: 'asc',
    },
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getRecepcionesAlmacen = withAuth(getRecepcionesAlmacenWA)

async function createRecepcionAlmacenWA(
  data: Omit<Prisma.RecepcionAlmacenUncheckedCreateInput, 'numero'>
) {
  const puede = await can(permissions.RECEPCION_ALMACEN_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear una compra')

  return await prisma.$transaction(
    async db => {
      const numero = await getUltimoNumeroRecepcionAlmacen({
        db,
      })

      const parsedData = RecepcionAlmacenUncheckedCreateInputSchema.parse({
        ...data,
        numero,
      })

      const recepcionAlmacen = await db.recepcionAlmacen.create({
        data: parsedData,
      })

      const productos_recepcion = await db.productoAlmacenRecepcion.findMany({
        where: {
          recepcion_id: recepcionAlmacen.id,
        },
        select: {
          costo: true,
          producto_almacen_id: true,
          unidades_derivadas: {
            select: {
              cantidad: true,
              bonificacion: true,
              factor: true,
            },
          },
        },
      })

      await Promise.all(
        productos_recepcion.map(producto_recepcion => {
          const { costo, producto_almacen_id, unidades_derivadas } =
            producto_recepcion
          return db.productoAlmacen.update({
            where: {
              id: producto_almacen_id,
            },
            data: {
              stock_fraccion: {
                increment: unidades_derivadas.reduce(
                  (acc, unidad_derivada) =>
                    acc +
                    unidad_derivada.cantidad
                      .mul(unidad_derivada.factor)
                      .toNumber(),
                  0
                ),
              },
              costo:
                unidades_derivadas.length === 1 &&
                unidades_derivadas[0].bonificacion
                  ? 0
                  : costo,
            },
          })
        })
      )

      await db.compra.update({
        where: {
          id: data.compra_id,
        },
        data: {
          estado_de_compra: EstadoDeCompra.Procesado,
        },
      })

      return {
        data: JSON.parse(
          JSON.stringify(recepcionAlmacen)
        ) as typeof recepcionAlmacen,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const createRecepcionAlmacen = withAuth(createRecepcionAlmacenWA)
