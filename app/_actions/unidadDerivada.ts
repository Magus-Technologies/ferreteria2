'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import z from 'zod'

async function getUnidadesDerivadasWA() {
  try {
    const puede = await can(permissions.UNIDAD_DERIVADA_LISTADO)
    if (!puede)
      throw new Error(
        'No tienes permiso para ver la lista de unidades derivadas'
      )

    const item = await prisma.unidadDerivada.findMany()
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getUnidadesDerivadas = withAuth(getUnidadesDerivadasWA)

async function createUnidadDerivadaWA({ name }: { name: string }) {
  try {
    const puede = await can(permissions.UNIDAD_DERIVADA_CREATE)
    if (!puede)
      throw new Error('No tienes permiso para crear unidades derivadas')

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
  } catch (error) {
    return errorFormated(error)
  }
}
export const createUnidadDerivada = withAuth(createUnidadDerivadaWA)

async function importarDetallesDePreciosWA({ data }: { data: unknown }) {
  try {
    const puede = await can(permissions.DETALLES_DE_PRECIOS_IMPORT)
    if (!puede)
      throw new Error('No tienes permiso para importar DetallesDePrecios')

    const dataParsed = z
      .array(ProductoAlmacenUnidadDerivadaCreateInputSchema)
      .parse(data)
    for (const item of dataParsed) {
      if (!item.precio_especial) item.precio_especial = item.precio_publico
      if (!item.precio_minimo) item.precio_minimo = item.precio_publico
      if (!item.precio_ultimo) item.precio_ultimo = item.precio_publico

      await prisma.productoAlmacenUnidadDerivada.upsert({
        where: {
          producto_almacen_id_unidad_derivada_id: {
            producto_almacen_id: item.producto_almacen.connect!.id!,
            unidad_derivada_id: item.unidad_derivada.connect!.id!,
          },
        },
        create: item,
        update: item,
      })
    }
    return { data: 'ok' }
  } catch (error) {
    return errorFormated(error)
  }
}
export const importarDetallesDePrecios = withAuth(importarDetallesDePreciosWA)

async function getProductoAlmacenByCodProductoAndAlmacenNameWA(
  data: {
    cod_producto: string
    almacen_id: number
  }[]
) {
  try {
    const results = await Promise.all(
      data.map(async ({ cod_producto, almacen_id }) => {
        const producto = await prisma.producto.findUnique({
          where: { cod_producto },
        })
        if (!producto)
          throw new Error(`Producto no encontrado: ${cod_producto}`)

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
  } catch (error) {
    return errorFormated(error)
  }
}
export const getProductoAlmacenByCodProductoAndAlmacenName = withAuth(
  getProductoAlmacenByCodProductoAndAlmacenNameWA
)

async function importarUnidadesDerivadasWA(data: { name: string }[]) {
  try {
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
  } catch (error) {
    return errorFormated(error)
  }
}
export const importarUnidadesDerivadas = withAuth(importarUnidadesDerivadasWA)
