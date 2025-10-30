'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma, TipoDocumento } from '@prisma/client'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import z from 'zod'
import { chunkArray } from '~/utils/chunks'
import { auth } from '~/auth/auth'
import { getUltimoNumeroIngresoSalida } from './utils/ingreso-salida'
import { TIPOS_INGRESOS_SALIDAS } from '../_lib/tipos-ingresos-salidas'

async function getUnidadesDerivadasWA() {
  const puede = await can(permissions.UNIDAD_DERIVADA_LISTADO)
  if (!puede)
    throw new Error('No tienes permiso para ver la lista de unidades derivadas')

  const item = await prisma.unidadDerivada.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return { data: item }
}
export const getUnidadesDerivadas = withAuth(getUnidadesDerivadasWA)

async function createUnidadDerivadaWA({ name }: { name: string }) {
  const puede = await can(permissions.UNIDAD_DERIVADA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear unidades derivadas')

  try {
    const item = await prisma.unidadDerivada.create({ data: { name } })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe una unidad derivada con ese nombre')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al crear la unidad derivada')
  }
}
export const createUnidadDerivada = withAuth(createUnidadDerivadaWA)

async function importarDetallesDePreciosWA({ data }: { data: unknown }) {
  const puede = await can(permissions.DETALLES_DE_PRECIOS_IMPORT)
  if (!puede)
    throw new Error('No tienes permiso para importar DetallesDePrecios')

  const dataParsed = z
    .array(ProductoAlmacenUnidadDerivadaCreateInputSchema)
    .superRefine((items, ctx) => {
      const seen = new Set<string>()
      items.forEach((it, i) => {
        const key = `${it.producto_almacen!.connect!.id}|${it.factor}`
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicado: id ${
              it.producto_almacen!.connect!.id
            } con factor ${it.factor}`,
            path: [i, 'factor'],
          })
        } else {
          seen.add(key)
        }
      })
    })
    .parse(data)

  const session = await auth()

  const chunks = chunkArray(dataParsed, 200)
  const duplicados: Prisma.ProductoAlmacenUnidadDerivadaCreateInput[] = []

  const tipo_ingreso = await prisma.tipoIngresoSalida.findFirstOrThrow({
    where: { name: TIPOS_INGRESOS_SALIDAS.AJUSTE },
    select: { id: true },
  })

  for (const lote of chunks) {
    await prisma.$transaction(async tx => {
      const productoAlmacenIds = [
        ...new Set(
          lote.map(item => item.producto_almacen!.connect!.id!).filter(Boolean)
        ),
      ]

      const productoAlmacenes = await tx.productoAlmacen.findMany({
        where: { id: { in: productoAlmacenIds } },
        select: {
          id: true,
          almacen_id: true,
          costo: true,
          stock_fraccion: true,
          producto: {
            select: {
              id: true,
              unidades_contenidas: true,
            },
          },
        },
      })

      const productoAlmacenMap = new Map(
        productoAlmacenes.map(pa => [pa.id, pa])
      )

      const unidadesDerivadasIds = [
        ...new Set(
          lote.map(item => item.unidad_derivada!.connect!.id!).filter(Boolean)
        ),
      ]

      const unidadesDerivadas = await tx.unidadDerivada.findMany({
        where: { id: { in: unidadesDerivadasIds } },
        select: {
          id: true,
          name: true,
        },
      })

      const unidadesDerivadasMap = new Map(
        unidadesDerivadas.map(pa => [pa.id, pa])
      )

      for (const item of lote) {
        try {
          if (!item.precio_especial) item.precio_especial = item.precio_publico
          if (!item.precio_minimo) item.precio_minimo = item.precio_publico
          if (!item.precio_ultimo) item.precio_ultimo = item.precio_publico

          const producto_almacen_unidad_derivada =
            await tx.productoAlmacenUnidadDerivada.create({
              data: item,
            })

          const productoAlmacenId = item.producto_almacen!.connect!.id!
          const producto_almacen = productoAlmacenMap.get(productoAlmacenId)
          if (!producto_almacen)
            throw new Error('El Producto no se encontró en el Almacén')

          const unidadDerivadaId =
            producto_almacen_unidad_derivada.unidad_derivada_id!
          const unidadDerivada = unidadesDerivadasMap.get(unidadDerivadaId)
          if (!unidadDerivada)
            throw new Error('La Unidad Derivada no se encontró')

          const es_la_unidad_derivada_por_defecto =
            item.factor === producto_almacen.producto.unidades_contenidas

          if (es_la_unidad_derivada_por_defecto) {
            const numero = await getUltimoNumeroIngresoSalida({
              db: tx,
              tipo_documento: TipoDocumento.Ingreso,
            })

            await tx.ingresoSalida.create({
              data: {
                tipo_ingreso_id: tipo_ingreso.id,
                descripcion: `Ingreso por Importación de Producto`,
                almacen_id: producto_almacen.almacen_id,
                user_id: session!.user!.id!,
                tipo_documento: TipoDocumento.Ingreso,
                serie: session!.user!.empresa.serie_ingreso,
                fecha: new Date(),
                numero,
                productos_por_almacen: {
                  create: {
                    costo: producto_almacen.costo,
                    producto_almacen_id: producto_almacen.id,
                    unidades_derivadas: {
                      create: [
                        {
                          factor: producto_almacen_unidad_derivada.factor,
                          cantidad: producto_almacen.stock_fraccion.div(
                            producto_almacen_unidad_derivada.factor
                          ),
                          cantidad_restante:
                            producto_almacen.stock_fraccion.div(
                              producto_almacen_unidad_derivada.factor
                            ),
                          historial: {
                            create: {
                              stock_anterior: 0,
                              stock_nuevo: producto_almacen.stock_fraccion,
                            },
                          },
                          unidad_derivada_inmutable: {
                            connectOrCreate: {
                              where: {
                                name: unidadDerivada.name,
                              },
                              create: {
                                name: unidadDerivada.name,
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            })
          }
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            duplicados.push(item)
            continue
          }

          throw error
        }
      }

      const productos_ids = productoAlmacenes.map(pa => pa.producto.id)
      await tx.producto.updateMany({
        where: {
          id: {
            in: productos_ids,
          },
        },
        data: {
          permitido: true,
        },
      })
    })
  }

  return { data: duplicados }
}
export const importarDetallesDePrecios = withAuth(importarDetallesDePreciosWA)

async function getProductoAlmacenByCodProductoAndAlmacenNameWA(
  data: {
    cod_producto: string
    almacen_id: number
  }[]
) {
  const results = await Promise.all(
    data.map(async ({ cod_producto, almacen_id }) => {
      const producto = await prisma.producto.findUnique({
        where: { cod_producto },
      })
      if (!producto) throw new Error(`Producto no encontrado: ${cod_producto}`)

      const ubicacion = await prisma.ubicacion.findFirst({
        where: {
          almacen_id,
        },
      })

      if (!ubicacion)
        throw new Error(`Este Almacén debe tener al menos una Ubicación`)

      const item = await prisma.productoAlmacen.upsert({
        where: {
          producto_id_almacen_id: {
            producto_id: producto.id,
            almacen_id: almacen_id,
          },
        },
        create: {
          ubicacion_id: ubicacion.id,
          almacen_id: almacen_id,
          producto_id: producto.id,
        },
        update: {},
      })

      if (!item)
        throw new Error(`Producto no encontrado en almacén: ${cod_producto}`)

      return {
        cod_producto,
        producto_almacen_id: item.id,
      }
    })
  )

  return { data: results }
}
export const getProductoAlmacenByCodProductoAndAlmacenName = withAuth(
  getProductoAlmacenByCodProductoAndAlmacenNameWA
)

async function importarUnidadesDerivadasWA(data: { name: string }[]) {
  const uniqueData = Array.from(
    new Map(data.map(item => [`${item.name}`, item])).values()
  )

  const items = await Promise.all(
    uniqueData.map(item =>
      prisma.unidadDerivada.upsert({
        where: {
          name: item.name,
        },
        update: {},
        create: {
          name: item.name,
        },
      })
    )
  )
  return { data: items }
}
export const importarUnidadesDerivadas = withAuth(importarUnidadesDerivadasWA)
