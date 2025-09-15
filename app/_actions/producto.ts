'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { FormCreateProductoFormatedProps } from '../ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-producto'
import { Prisma } from '@prisma/client'
import {
  ProductoAlmacenUnidadDerivadaUncheckedCreateInputSchema,
  ProductoCreateInputSchema,
  ProductoFindManyArgsSchema,
  ProductoUncheckedCreateInputSchema,
  ProductoWhereInputSchema,
} from '~/prisma/generated/zod'
import z from 'zod'
import { chunkArray } from '~/utils/chunks'
import { crearProductoEnAlmacen, getUltimoIdProducto } from './utils/producto'
import { createPrimeraCompra } from './utils/compra'
import { auth } from '~/auth/auth'

async function SearchProductosWA(args: Prisma.ProductoFindManyArgs) {
  const argsParsed = ProductoFindManyArgsSchema.parse(args)

  const items = await prisma.producto.findMany({
    ...argsParsed,
    orderBy: {
      name: 'asc',
    },
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const SearchProductos = withAuth(SearchProductosWA)

async function getProductosWA({
  where,
}: {
  where?: Prisma.ProductoWhereInput
}) {
  const puede = await can(permissions.PRODUCTO_LISTADO)
  if (!puede)
    throw new Error('No tienes permiso para ver la lista de productos')

  if (!where) return { data: [] }

  const whereParsed = ProductoWhereInputSchema.parse(where)

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
          ubicacion: true,
        },
      },
      marca: true,
      categoria: true,
      unidad_medida: true,
    },
    orderBy: {
      name: 'asc',
    },
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getProductos = withAuth(getProductosWA)

async function createProductoWA(data: FormCreateProductoFormatedProps) {
  const puede = await can(permissions.PRODUCTO_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear productos')

  const session = await auth()

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

        if (!dataProduct.cod_producto) {
          const ultimo_id = await getUltimoIdProducto({ db })
          dataProduct.cod_producto = ultimo_id
        }

        const dataProductParsed =
          ProductoUncheckedCreateInputSchema.parse(dataProduct)

        const producto = await db.producto.create({ data: dataProductParsed })

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

          const unidad_derivada = unidades_derivadas.find(
            item =>
              item.unidad_derivada_id ===
              productoAlmacenUnidadDerivada.unidad_derivada_id
          )!
          const compraCosto = unidad_derivada.costo

          await createPrimeraCompra(
            {
              user_id: session!.user!.id!,
              almacen_id,
              productos_por_almacen: [
                {
                  producto_almacen_id: productoAlmacen.id,
                  costo: new Prisma.Decimal(compraCosto).div(
                    unidad_derivada.factor
                  ),
                  unidades_derivadas: [
                    {
                      factor: unidad_derivada.factor,
                      cantidad: compraCantidad,
                      lote: compra.lote,
                      vencimiento: compra.vencimiento
                        ? new Date(compra.vencimiento)
                        : null,
                      name: productoAlmacenUnidadDerivada.unidad_derivada.name,
                    },
                  ],
                },
              ],
            },
            db
          )
        }

        return {
          data: JSON.parse(JSON.stringify(producto)) as typeof producto,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error(
          'Ya existe un producto con ese código de producto, código de barra o nombre'
        )
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al crear el producto')
  }
}
export const createProducto = withAuth(createProductoWA)

async function importarProductosWA({ data }: { data: unknown }) {
  const puede = await can(permissions.PRODUCTO_IMPORT)
  if (!puede) throw new Error('No tienes permiso para importar productos')

  const dataParsed = z
    .array(ProductoCreateInputSchema)
    .superRefine((items, ctx) => {
      const seen = new Set<string>()
      items.forEach((it, i) => {
        const key = it.name
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicado: nombre ${key}`,
            path: [i, 'name'],
          })
        } else {
          seen.add(key)
        }
      })

      const seenCodBarra = new Set<string>()
      items.forEach((it, i) => {
        const key = it.cod_barra
        if (!key) return
        if (seenCodBarra.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicado: codigo de barra ${key}`,
            path: [i, 'cod_barra'],
          })
        } else {
          seenCodBarra.add(key)
        }
      })
    })
    .parse(data)
  const chunks = chunkArray(dataParsed, 200)
  for (const lote of chunks) {
    await prisma.$transaction(async tx => {
      await Promise.all(
        lote.map(async item => {
          const { producto_en_almacenes, ...restProducto } = item
          const producto_almacen = producto_en_almacenes!.create! as Omit<
            Prisma.ProductoAlmacenUncheckedCreateInput,
            'producto_id'
          >
          const producto_almacen_costo_formated = {
            ...producto_almacen,
            costo:
              Number(producto_almacen.costo ?? 0) /
              Number(restProducto.unidades_contenidas ?? 1),
          }

          const producto_upsert: Prisma.ProductoUpsertArgs = {
            where: {
              cod_producto: restProducto.cod_producto,
            },
            create: restProducto,
            update: restProducto,
          }
          const productoUpserted = await tx.producto.upsert(producto_upsert)

          await tx.productoAlmacen.upsert({
            where: {
              producto_id_almacen_id: {
                producto_id: productoUpserted.id,
                almacen_id: producto_almacen_costo_formated.almacen_id,
              },
            },
            create: {
              producto_id: productoUpserted.id,
              ...producto_almacen_costo_formated,
            },
            update: producto_almacen_costo_formated,
          })
        })
      )
    })
  }

  return { data: 'ok' }
}
export const importarProductos = withAuth(importarProductosWA)

async function eliminarProductoWA({ id }: { id: number }) {
  const puede = await can(permissions.PRODUCTO_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar productos')

  const compras = await prisma.compra.findMany({
    where: {
      productos_por_almacen: {
        some: {
          producto_almacen: {
            producto_id: id,
          },
        },
      },
    },
    select: {
      id: true,
      descripcion: true,
    },
    orderBy: {
      created_at: 'asc',
    },
    take: 2,
  })

  if (compras.length > 1)
    throw new Error('El producto tiene compras realizadas')

  if (compras.length == 1) {
    const compra = compras[0]
    if (compra.descripcion != 'Stock inicial por creación de producto')
      throw new Error('El producto tiene compras realizadas')

    await prisma.compra.delete({ where: { id: compra.id } })
  }

  await prisma.producto.delete({ where: { id } })
  return { data: 'ok' }
}
export const eliminarProducto = withAuth(eliminarProductoWA)

async function editarProductoWA(data: FormCreateProductoFormatedProps) {
  const puede = await can(permissions.PRODUCTO_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear productos')

  try {
    return await prisma.$transaction(
      async db => {
        const {
          almacen_id,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          compra,
          unidades_derivadas,
          producto_almacen: ubicacion,
          ...dataProduct
        } = data

        if (!dataProduct.cod_producto) {
          const ultimo_id = await getUltimoIdProducto({ db })
          dataProduct.cod_producto = ultimo_id
        }

        const dataProductParsed =
          ProductoUncheckedCreateInputSchema.parse(dataProduct)

        const { id, ...restProducto } = dataProductParsed

        if (!id) throw new Error('No se especificó el id del producto')

        const producto_actual = await db.producto.findUnique({
          where: {
            id,
          },
          select: {
            cod_producto: true,
            cod_barra: true,
            name: true,
          },
        })

        if (!producto_actual) throw new Error('No se encontró el producto')

        const producto = await db.producto.update({
          where: {
            id,
          },
          data: {
            ...restProducto,
            cod_producto:
              producto_actual.cod_producto === restProducto.cod_producto
                ? undefined
                : restProducto.cod_producto,
            cod_barra:
              producto_actual.cod_barra === restProducto.cod_barra
                ? undefined
                : restProducto.cod_barra,
            name:
              producto_actual.name === restProducto.name
                ? undefined
                : restProducto.name,
          },
        })

        const producto_almacen = await db.productoAlmacen.update({
          where: {
            producto_id_almacen_id: {
              producto_id: id,
              almacen_id,
            },
          },
          data: {
            costo: unidades_derivadas.length
              ? unidades_derivadas[0].costo /
                Number(unidades_derivadas[0].factor)
              : 0,
            ubicacion_id: ubicacion.ubicacion_id,
          },
        })

        await db.productoAlmacenUnidadDerivada.deleteMany({
          where: {
            producto_almacen_id: producto_almacen.id,
          },
        })

        await db.productoAlmacenUnidadDerivada.createMany({
          data: unidades_derivadas.map(item => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { costo, p_venta, ganancia, ...rest } = item
            const data = {
              producto_almacen_id: producto_almacen.id,
              ...rest,
            }
            const dataParsed =
              ProductoAlmacenUnidadDerivadaUncheckedCreateInputSchema.parse(
                data
              )
            return dataParsed
          }),
        })

        return {
          data: JSON.parse(JSON.stringify(producto)) as typeof producto,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError)
      throw new Error(`${error.code}`)

    throw new Error('Error al editar el producto')
  }
}
export const editarProducto = withAuth(editarProductoWA)

async function validarCodigoProductoWA({
  cod_producto,
}: {
  cod_producto: string
}) {
  const producto = await prisma.producto.findUnique({
    where: {
      cod_producto: cod_producto ?? '',
    },
    select: {
      cod_producto: true,
    },
  })

  return { data: producto?.cod_producto }
}
export const validarCodigoProducto = withAuth(validarCodigoProductoWA)
