'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma, TipoMoneda, FormaDePago, EstadoDeVenta } from '@prisma/client'
import {
  VentaUncheckedCreateInputSchema,
  VentaWhereInputSchema,
} from '~/prisma/generated/zod'
import { DespliegueDePago } from './lib/lib-caja'

const includeVenta = {
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
      fecha: 'asc',
    },
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getVenta = withAuth(getVentaWA)

async function createVentaWA(data: Prisma.VentaUncheckedCreateInput) {
  const puede = await can(permissions.VENTA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear una venta')

  const parsedData = VentaUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      if (
        parsedData.estado_de_venta === EstadoDeVenta.Creado &&
        parsedData.forma_de_pago === FormaDePago.Contado &&
        !parsedData.despliegue_de_pago_id
      )
        throw new Error(
          'En ventas al contado debes seleccionar un Despliegue de Pago'
        )

      if (
        parsedData.estado_de_venta === EstadoDeVenta.Creado &&
        parsedData.forma_de_pago === FormaDePago.Crédito &&
        parsedData.despliegue_de_pago_id
      )
        throw new Error(
          'En ventas a crédito no debes seleccionar Ingreso asociado ni Despliegue de Pago'
        )

      if (
        parsedData.estado_de_venta === EstadoDeVenta.Creado &&
        parsedData.despliegue_de_pago_id
      )
        throw new Error(
          'No puedes seleccionar Ingreso asociado y Despliegue de Pago al mismo tiempo'
        )

      const venta = await db.venta.create({ data: parsedData })

      if (parsedData.estado_de_venta === EstadoDeVenta.Creado) {
        const total =
          (Array.isArray(parsedData.productos_por_almacen?.create)
            ? parsedData.productos_por_almacen!.create
            : []
          ).reduce((acc, p) => {
            const precio = Number(p.precio ?? 0)
            const unidades = Array.isArray(p.unidades_derivadas?.create)
              ? p.unidades_derivadas!.create
              : []
            const subtotal = unidades.reduce((s, u) => {
              const cantidad = Number(u.cantidad ?? 0)
              const factor = Number(u.factor ?? 0)
              return s + cantidad * factor * precio
            }, 0)
            return acc + subtotal
          }, 0) ?? 0

        const totalSoles =
          parsedData.tipo_moneda === TipoMoneda.Soles
            ? total
            : total * Number(parsedData.tipo_de_cambio ?? 1)

        if (parsedData.despliegue_de_pago_id) {
          const despliegue_de_pago =
            await db.despliegueDePago.findUniqueOrThrow({
              where: { id: parsedData.despliegue_de_pago_id },
              select: { name: true },
            })
          if (despliegue_de_pago.name === DespliegueDePago.CCH_Efectivo)
            await db.user.update({
              where: { id: parsedData.user_id },
              data: { efectivo: { increment: totalSoles } },
            })
          else
            await db.metodoDePago.update({
              where: {
                id: (
                  await db.despliegueDePago.findUniqueOrThrow({
                    where: { id: parsedData.despliegue_de_pago_id },
                    select: { metodo_de_pago_id: true },
                  })
                ).metodo_de_pago_id,
              },
              data: { monto: { increment: totalSoles } },
            })
        }
      }

      return { data: JSON.parse(JSON.stringify(venta)) as typeof venta }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
export const createVenta = withAuth(createVentaWA)
