'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import z from 'zod'
import { chunkArray } from '~/utils/chunks'

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
  const chunks = chunkArray(dataParsed, 200)
  for (const lote of chunks) {
    await prisma.$transaction(
      lote.map(item => {
        if (!item.precio_especial) item.precio_especial = item.precio_publico
        if (!item.precio_minimo) item.precio_minimo = item.precio_publico
        if (!item.precio_ultimo) item.precio_ultimo = item.precio_publico

        return prisma.productoAlmacenUnidadDerivada.upsert({
          where: {
            producto_almacen_id_unidad_derivada_id: {
              producto_almacen_id: item.producto_almacen.connect!.id!,
              unidad_derivada_id: item.unidad_derivada.connect!.id!,
            },
          },
          create: item,
          update: item,
        })
      })
    )
  }

  return { data: 'ok' }
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
