'use server'

import { EstadoDeCompra, Prisma, RecepcionAlmacen } from '@prisma/client'
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
  compra: {
    include: {
      proveedor: true,
      almacen: true,
    },
  },
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
          historial: true,
        },
      },
    },
  },
  user: true,
} satisfies Prisma.RecepcionAlmacenInclude
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

async function manejo_de_recepcion({
  db,
  recepcionAlmacen,
  agregar,
}: {
  db: Prisma.TransactionClient
  recepcionAlmacen: RecepcionAlmacen
  agregar: boolean
}) {
  const productos_recepcion = await db.productoAlmacenRecepcion.findMany({
    where: {
      recepcion_id: recepcionAlmacen.id,
    },
    select: {
      costo: true,
      producto_almacen_id: true,
      unidades_derivadas: {
        select: {
          id: true,
          cantidad: true,
          bonificacion: true,
          factor: true,
          unidad_derivada_inmutable_id: true,
          producto_almacen_recepcion_id: true,
        },
      },
    },
  })

  const productos_compra = await db.productoAlmacenCompra.findMany({
    where: { compra_id: recepcionAlmacen.compra_id },
    select: {
      id: true,
      producto_almacen_id: true,
      producto_almacen: { select: { stock_fraccion: true } },
    },
  })

  const productosCompraMap = new Map(
    productos_compra.map(p => [p.producto_almacen_id, p])
  )

  await Promise.all(
    productos_recepcion.map(async producto_recepcion => {
      const { costo, producto_almacen_id, unidades_derivadas } =
        producto_recepcion

      const producto_almacen_compra =
        productosCompraMap.get(producto_almacen_id)
      if (!producto_almacen_compra)
        throw new Error('No se encontro el producto de la compra')

      const cantidad_total = unidades_derivadas.reduce(
        (acc, u) => acc.add(u.cantidad.mul(u.factor)),
        new Prisma.Decimal(0)
      )
      if (
        !agregar &&
        producto_almacen_compra.producto_almacen.stock_fraccion
          .sub(cantidad_total)
          .toNumber() < 0
      )
        throw new Error('El producto no tiene suficiente stock para quitar')

      const stock_base = producto_almacen_compra.producto_almacen.stock_fraccion

      const acumulados: Prisma.Decimal[] = []
      let suma = new Prisma.Decimal(0)
      for (const unidad of unidades_derivadas) {
        acumulados.push(suma)
        suma = suma.add(unidad.cantidad.mul(unidad.factor))
      }

      await Promise.all(
        unidades_derivadas.map(async (unidad_derivada, index) => {
          await db.unidadDerivadaInmutableCompra.update({
            where: {
              producto_almacen_compra_id_unidad_derivada_inmutable_id_bonificacion:
                {
                  unidad_derivada_inmutable_id:
                    unidad_derivada.unidad_derivada_inmutable_id,
                  producto_almacen_compra_id: producto_almacen_compra.id,
                  bonificacion: unidad_derivada.bonificacion,
                },
            },
            data: {
              cantidad_pendiente: {
                [agregar ? 'decrement' : 'increment']:
                  unidad_derivada.cantidad.toNumber(),
              },
            },
          })

          const stock_inicial = agregar
            ? stock_base.add(acumulados[index])
            : stock_base.sub(acumulados[index])

          await db.historialUnidadDerivadaInmutableRecepcion.create({
            data: {
              unidad_derivada_inmutable_recepcion_id: unidad_derivada.id,
              stock_anterior: stock_inicial,
              stock_nuevo: agregar
                ? stock_inicial.add(
                    unidad_derivada.cantidad.mul(unidad_derivada.factor)
                  )
                : stock_inicial.sub(
                    unidad_derivada.cantidad.mul(unidad_derivada.factor)
                  ),
            },
          })
        })
      )

      let nuevo_costo: Prisma.Decimal | undefined = undefined
      if (
        producto_almacen_compra.producto_almacen.stock_fraccion.toNumber() === 0
      ) {
        if (agregar)
          nuevo_costo =
            unidades_derivadas.length === 1 &&
            unidades_derivadas[0].bonificacion
              ? Prisma.Decimal(0)
              : costo
        else
          throw new Error(
            'No se puede quitar stock a un producto que no tiene stock'
          )
      } else if (
        producto_almacen_compra.producto_almacen.stock_fraccion.toNumber() > 0
      ) {
        if (agregar) nuevo_costo = undefined
        else nuevo_costo = undefined
      } else throw new Error('El producto tiene stock negativo')

      if (
        !agregar &&
        producto_almacen_compra.producto_almacen.stock_fraccion
          .sub(cantidad_total)
          .toNumber() === 0
      )
        nuevo_costo = Prisma.Decimal(0)

      await db.productoAlmacen.update({
        where: {
          id: producto_almacen_id,
        },
        data: {
          stock_fraccion: {
            [agregar ? 'increment' : 'decrement']: cantidad_total,
          },
          costo: nuevo_costo,
        },
      })
    })
  )
}

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

      await manejo_de_recepcion({
        db,
        recepcionAlmacen,
        agregar: true,
      })

      const existePendiente = await db.unidadDerivadaInmutableCompra.findFirst({
        where: {
          producto_almacen_compra: {
            compra_id: recepcionAlmacen.compra_id,
          },
          cantidad_pendiente: {
            gt: 0,
          },
        },
        select: { id: true },
      })
      const tienePendientes = !!existePendiente

      if (!tienePendientes)
        await db.compra.update({
          where: {
            id: recepcionAlmacen.compra_id,
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

async function eliminarRecepcionAlmacenWA({
  id,
}: {
  id: RecepcionAlmacen['id']
}) {
  const puede = await can(permissions.RECEPCION_ALMACEN_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar una recepción')

  return await prisma.$transaction(
    async db => {
      const usados = await db.unidadDerivadaInmutableRecepcion.findMany({
        where: {
          producto_almacen_recepcion: { recepcion_id: id },
        },
        select: { cantidad: true, cantidad_restante: true },
      })

      const tieneUsados = usados.some(
        r => !r.cantidad_restante.equals(r.cantidad)
      )

      if (tieneUsados)
        throw new Error(
          'No se puede eliminar una recepción que ya fue usada en ventas'
        )

      const recepcionAlmacen = await db.recepcionAlmacen.update({
        where: {
          id,
        },
        data: {
          estado: false,
        },
      })

      await manejo_de_recepcion({
        db,
        recepcionAlmacen,
        agregar: false,
      })

      await db.compra.update({
        where: {
          id: recepcionAlmacen.compra_id,
        },
        data: {
          estado_de_compra: EstadoDeCompra.Creado,
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
export const eliminarRecepcionAlmacen = withAuth(eliminarRecepcionAlmacenWA)
