'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { ExtendedTransactionClient, prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import { errorFormated } from '~/utils/error-formated'
import can from '~/utils/server-validate-permission'
import {
  FormCreateProductoFormatedProps,
  UnidadDerivadaCreateProducto,
} from '../ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-producto'
import { Prisma, Producto } from '@prisma/client'
import { ProductoCreateInputSchema } from '~/prisma/generated/zod'
import z from 'zod'

async function getProductosWA() {
  try {
    const puede = await can(permissions.PRODUCTO_LISTADO)
    if (!puede)
      throw new Error('No tienes permiso para ver la lista de productos')

    const items = await prisma.producto.findMany({
      include: {
        producto_en_almacenes: {
          include: {
            unidades_derivadas: {
              include: {
                unidad_derivada: true,
              },
            },
            almacen: true,
          },
        },
        marca: true,
        categoria: true,
        unidad_medida: true,
      },
    })

    return { data: JSON.parse(JSON.stringify(items)) as typeof items }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getProductos = withAuth(getProductosWA)

async function createProductoWA(data: FormCreateProductoFormatedProps) {
  try {
    const puede = await can(permissions.PRODUCTO_CREATE)
    if (!puede) throw new Error('No tienes permiso para crear productos')

    try {
      return await prisma.$transaction(
        async db => {
          const {
            almacen_id,
            compra,
            unidades_derivadas,
            producto_almacen,
            ...dataProduct
          } = data

          const producto = await db.producto.create({ data: dataProduct })

          // Crear el producto en el almacen
          const { productoAlmacenUnidadDerivada, productoAlmacen } =
            await crearProductoEnAlmacen({
              producto,
              unidades_derivadas,
              producto_almacen,
              almacen_id,
              db,
            })

          // Generar primera compra
          if (compra.stock_entero || compra.stock_fraccion) {
            const compraCantidad = new Prisma.Decimal(compra.stock_entero || 0)
              .mul(producto.unidades_contenidas)
              .add(compra.stock_fraccion || 0)

            const compraCosto =
              unidades_derivadas.find(
                item =>
                  item.unidad_derivada_id ===
                  productoAlmacenUnidadDerivada.unidad_derivada_id
              )?.costo || 0

            await prisma.compra.createPrimeraCompra(
              {
                almacen_id,
                productos_por_unidad_derivada: [
                  {
                    cantidad: compraCantidad,
                    lote: compra.lote,
                    vencimiento: compra.vencimiento
                      ? new Date(compra.vencimiento)
                      : null,
                    producto_almacen_unidad_derivada_id:
                      productoAlmacenUnidadDerivada.id,
                  },
                ],
                productos_por_almacen: [
                  {
                    producto_almacen_id: productoAlmacen.id,
                    costo: new Prisma.Decimal(compraCosto),
                  },
                ],
              },
              db as unknown as Prisma.TransactionClient
            )
          }

          return { data: producto }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new Error(
            'Ya existe un producto con ese código de producto y/o barra'
          )
        throw new Error(`${error.code}`)
      }

      throw new Error('Error al crear el producto')
    }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createProducto = withAuth(createProductoWA)

async function crearProductoEnAlmacen({
  producto,
  unidades_derivadas,
  producto_almacen,
  almacen_id,
  db,
}: {
  producto: Producto
  unidades_derivadas: UnidadDerivadaCreateProducto[]
  producto_almacen: FormCreateProductoFormatedProps['producto_almacen']
  almacen_id: number
  db: ExtendedTransactionClient
}) {
  const productoAlmacen = await db.productoAlmacen.create({
    data: {
      producto_id: producto.id,
      almacen_id,
      costo: unidades_derivadas.length
        ? unidades_derivadas[0].costo / Number(unidades_derivadas[0].factor)
        : 0,
      ubicacion_id: producto_almacen.ubicacion_id,
    },
  })

  await db.productoAlmacenUnidadDerivada.createMany({
    data: unidades_derivadas.map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { costo, ...rest } = item
      return {
        producto_almacen_id: productoAlmacen.id,
        ...rest,
      }
    }),
  })

  const productoAlmacenUnidadDerivada =
    await db.productoAlmacenUnidadDerivada.findFirst({
      where: {
        producto_almacen_id: productoAlmacen.id,
        factor: producto.unidades_contenidas,
      },
    })

  if (!productoAlmacenUnidadDerivada)
    return {
      productoAlmacenUnidadDerivada:
        await db.productoAlmacenUnidadDerivada.findFirstOrThrow({
          where: {
            producto_almacen_id: productoAlmacen.id,
          },
        }),
      productoAlmacen,
    }
  return { productoAlmacenUnidadDerivada, productoAlmacen }
}

async function importarProductosWA({ data }: { data: unknown }) {
  try {
    const puede = await can(permissions.PRODUCTO_IMPORT)
    if (!puede) throw new Error('No tienes permiso para importar productos')

    const dataParsed = await z
      .array(ProductoCreateInputSchema)
      .superRefine(async (items, ctx) => {
        const cods = items.map(item => item.cod_producto)

        const existentes = await prisma.producto.findMany({
          where: { cod_producto: { in: cods } },
          select: { cod_producto: true },
        })

        const codsExistentes = new Set(existentes.map(e => e.cod_producto))

        items.forEach((item, index) => {
          if (codsExistentes.has(item.cod_producto)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `cod_producto duplicado: ${item.cod_producto}`,
              path: [index, 'cod_producto'],
            })
          }
        })
      })
      .parseAsync(data)
    for (const item of dataParsed) {
      await prisma.producto.create({ data: item })
    }
    return { data: 'ok' }
  } catch (error) {
    return errorFormated(error)
  }
}
export const importarProductos = withAuth(importarProductosWA)
