'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma, EstadoDeVenta } from '@prisma/client'
import {
  VentaCreateInputSchema,
  VentaWhereInputSchema,
} from '~/prisma/generated/zod'
// import { DespliegueDePago } from './lib/lib-caja'

const includeVenta = {
  productos_por_almacen: {
    include: {
      producto_almacen: {
        include: {
          producto: {
            select: {
              id: true,
              name: true,
              cod_producto: true,
              marca: { select: { id: true, name: true } },
              unidad_medida: { select: { id: true, name: true } },
            },
          },
        },
      },
      unidades_derivadas: {
        select: {
          id: true,
          cantidad: true,
          unidad_derivada_inmutable: {
            select: { id: true, name: true }
          },
        },
      },
    },
  },
  user: true,
  cliente: true,
  recomendado_por: true,
} satisfies Prisma.VentaInclude

export type getVentaResponseProps = Prisma.VentaGetPayload<{
  include: typeof includeVenta
}>

async function getVentaWA({ where }: { where?: Prisma.VentaWhereInput }) {
  const puede = await can(permissions.VENTA_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de ventas')

  if (!where) return { data: [] }

  const whereParsed = VentaWhereInputSchema.parse(where)

  const items = await prisma.venta.findMany({
    include: includeVenta,
    orderBy: {
      fecha: 'desc',
    },
    where: whereParsed,
    take: 200, // Límite para mejor performance
  })

  // Serializar para convertir Decimal a number
  const serialized = JSON.parse(
    JSON.stringify(items, (_key, value) => {
      if (typeof value === 'object' && value !== null && value.constructor?.name === 'Decimal') {
        return Number(value)
      }
      return value
    })
  )

  return { data: serialized as typeof items }
}
export const getVenta = withAuth(getVentaWA)

async function createVentaWA(data: Prisma.VentaCreateInput) { //VentaUncheckedCreateInput
  const puede = await can(permissions.VENTA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear una venta')

  const parsedData = VentaCreateInputSchema.parse(data)

  // Extraer almacen_id de la estructura anidada
  const almacen_id = parsedData.almacen && typeof parsedData.almacen === 'object' && 'connect' in parsedData.almacen
    ? (parsedData.almacen.connect as { id: number }).id
    : undefined

  return await prisma.$transaction(
    async (db) => {
      // Generar serie y número automáticamente si no se proporcionan
      // TODO: Verificar schema de serie documento
      /*
      if (!parsedData.serie || !parsedData.numero) {
        const serieDoc = await db.serieDocumento.findFirst({
          where: {
            tipo_documento: parsedData.tipo_documento,
            almacen_id: almacen_id,
            activo: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        })

        if (serieDoc) {
          const nuevoCorrelativo = serieDoc.correlativo + 1
          
          await db.serieDocumento.update({
            where: { id: serieDoc.id },
            data: { correlativo: nuevoCorrelativo },
          })

          parsedData.serie = serieDoc.serie
          parsedData.numero = nuevoCorrelativo
        }
      }
      */
      // if (
      //   parsedData.estado_de_venta === EstadoDeVenta.Creado &&
      //   parsedData.forma_de_pago === FormaDePago.Contado &&
      //   !parsedData.
      // )
      //   throw new Error(
      //     'En ventas al contado debes seleccionar un Despliegue de Pago'
      //   )

      // if (
      //   parsedData.estado_de_venta === EstadoDeVenta.Creado &&
      //   parsedData.forma_de_pago === FormaDePago.Crédito &&
      //   parsedData.despliegue_de_pago_id
      // )
      //   throw new Error(
      //     'En ventas a crédito no debes seleccionar Ingreso asociado ni Despliegue de Pago'
      //   )

      // if (
      //   parsedData.estado_de_venta === EstadoDeVenta.Creado &&
      //   parsedData.despliegue_de_pago_id
      // )
      //   throw new Error(
      //     'No puedes seleccionar Ingreso asociado y Despliegue de Pago al mismo tiempo'
      //   )

      const venta = await db.venta.create({ data: parsedData })

      if (parsedData.estado_de_venta === EstadoDeVenta.Creado) {
        // const total =
        //   (Array.isArray(parsedData.productos_por_almacen?.create)
        //     ? parsedData.productos_por_almacen!.create
        //     : []
        //   ).reduce((acc, p) => {
        //     const unidades = Array.isArray(p.unidades_derivadas?.create)
        //       ? p.unidades_derivadas!.create
        //       : []
        //     const subtotal = unidades.reduce((s, u) => {
        //       const precio = Number(u.precio ?? 0)
        //       const recargo = Number(u.recargo ?? 0)
        //       const cantidad = Number(u.cantidad ?? 0)
        //       const factor = Number(u.factor ?? 0)
        //       return s + cantidad * factor * (precio + recargo)
        //     }, 0)
        //     return acc + subtotal
        //   }, 0) ?? 0
        // const totalSoles =
        //   parsedData.tipo_moneda === TipoMoneda.Soles
        //     ? total
        //     : total * Number(parsedData.tipo_de_cambio ?? 1)
        // if (parsedData.despliegue_de_pago_id) {
        //   const despliegue_de_pago =
        //     await db.despliegueDePago.findUniqueOrThrow({
        //       where: { id: parsedData.despliegue_de_pago_id },
        //       select: { name: true },
        //     })
        //   if (despliegue_de_pago.name === DespliegueDePago.CCH_Efectivo)
        //     await db.user.update({
        //       where: { id: parsedData.user_id },
        //       data: { efectivo: { increment: totalSoles } },
        //     })
        //   else
        //     await db.metodoDePago.update({
        //       where: {
        //         id: (
        //           await db.despliegueDePago.findUniqueOrThrow({
        //             where: { id: parsedData.despliegue_de_pago_id },
        //             select: { metodo_de_pago_id: true },
        //           })
        //         ).metodo_de_pago_id,
        //       },
        //       data: { monto: { increment: totalSoles } },
        //     })
        // }
      }

      return { data: JSON.parse(JSON.stringify(venta)) as typeof venta }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
export const createVenta = withAuth(createVentaWA)
