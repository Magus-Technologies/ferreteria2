'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Compra, EstadoDeCompra, FormaDePago, Prisma } from '@prisma/client'
import {
  CompraUncheckedCreateInputSchema,
  CompraUncheckedUpdateInputSchema,
  CompraWhereInputSchema,
} from '~/prisma/generated/zod'
import { includeCompra } from './lib/lib-compra'
import { getTotalCompra } from './utils/compra'

export type getComprasResponseProps = Prisma.CompraGetPayload<{
  include: typeof includeCompra
}>

async function getComprasWA({ where }: { where?: Prisma.CompraWhereInput }) {
  const puede = await can(permissions.COMPRAS_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de compras')

  if (!where) return { data: [] }

  const whereParsed = CompraWhereInputSchema.parse(where)

  const items = await prisma.compra.findMany({
    include: includeCompra,
    orderBy: {
      fecha: 'asc',
    },
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getCompras = withAuth(getComprasWA)

async function createCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      if (
        parsedData.forma_de_pago === FormaDePago.Contado &&
        !parsedData.egreso_dinero_id &&
        !parsedData.despliegue_de_pago_id
      )
        throw new Error(
          'En compras al contado debes seleccionar Egreso asociado o Despliegue de Pago'
        )

      if (
        parsedData.forma_de_pago === FormaDePago.Crédito &&
        (parsedData.egreso_dinero_id || parsedData.despliegue_de_pago_id)
      )
        throw new Error(
          'En compras a crédito no debes seleccionar Egreso asociado ni Despliegue de Pago'
        )

      if (parsedData.egreso_dinero_id && parsedData.despliegue_de_pago_id)
        throw new Error(
          'No puedes seleccionar Egreso asociado y Despliegue de Pago al mismo tiempo'
        )

      if (
        parsedData.estado_de_compra === EstadoDeCompra.Creado ||
        (parsedData.estado_de_compra === EstadoDeCompra.EnEspera &&
          parsedData.serie &&
          parsedData.numero &&
          parsedData.proveedor_id)
      ) {
        const proveedor_serie_numero = await db.compra.findFirst({
          where: {
            proveedor_id: parsedData.proveedor_id,
            serie: parsedData.serie,
            numero: parsedData.numero,
          },
          select: {
            id: true,
          },
        })

        if (proveedor_serie_numero)
          throw new Error(
            'Ya existe una compra con el mismo proveedor, serie y número'
          )
      }

      await db.compra.create({
        data: parsedData,
      })

      const compra = await db.compra.findUniqueOrThrow({
        where: { id: parsedData.id },
        include: {
          _count: {
            select: {
              recepciones_almacen: { where: { estado: true } },
              pagos_de_compras: { where: { estado: true } },
            },
          },
          productos_por_almacen: {
            include: {
              unidades_derivadas: true,
            },
          },
        },
      })

      const totalSoles = getTotalCompra({ compra })

      if (parsedData.egreso_dinero_id) {
        const egreso = await db.egresoDinero.findUnique({
          where: { id: parsedData.egreso_dinero_id },
          select: { monto: true, vuelto: true },
        })
        if (!egreso) throw new Error('Egreso asociado no encontrado')

        const montoMenosVuelto =
          Number(egreso.monto ?? 0) - Number(egreso.vuelto ?? 0)
        const a = Number(montoMenosVuelto.toFixed(2))
        const b = Number(Number(totalSoles).toFixed(2))
        if (a !== b)
          throw new Error(
            'El monto menos el vuelto del egreso debe ser igual al total de la compra'
          )
      }

      if (
        compra.forma_de_pago === FormaDePago.Contado &&
        compra.despliegue_de_pago_id
      ) {
        const despliegue = await db.despliegueDePago.findUnique({
          where: { id: compra.despliegue_de_pago_id },
          select: { metodo_de_pago_id: true },
        })
        if (!despliegue)
          throw new Error(
            'Despliegue de pago no encontrado para la compra creada'
          )

        await db.metodoDePago.update({
          where: { id: despliegue.metodo_de_pago_id },
          data: {
            monto: {
              decrement: totalSoles,
            },
          },
        })
      }

      return { data: JSON.parse(JSON.stringify(compra)) as typeof compra }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const createCompra = withAuth(createCompraWA)

async function eliminarCompraWA({ id }: { id: Compra['id'] }) {
  const puede = await can(permissions.COMPRAS_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar una compra')

  return await prisma.$transaction(
    async (db) => {
      const compra = await db.compra.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              recepciones_almacen: { where: { estado: true } },
              pagos_de_compras: { where: { estado: true } },
            },
          },
          productos_por_almacen: {
            include: {
              unidades_derivadas: true,
            },
          },
        },
      })

      if (!compra) throw new Error('Compra no encontrada')

      if (
        compra.estado_de_compra === EstadoDeCompra.Procesado ||
        compra.estado_de_compra === EstadoDeCompra.Anulado
      )
        throw new Error('La compra no se puede anular')

      if (compra._count.recepciones_almacen > 0)
        throw new Error(
          'La compra no se puede anular porque tiene Recepciones de Almacén activas'
        )

      if (compra._count.pagos_de_compras > 0)
        throw new Error(
          'La compra no se puede anular porque tiene Pagos de Compra activos'
        )

      const totalSoles = getTotalCompra({ compra })

      if (compra.despliegue_de_pago_id) {
        const despliegue = await db.despliegueDePago.findUniqueOrThrow({
          where: { id: compra.despliegue_de_pago_id },
          select: { metodo_de_pago_id: true },
        })

        await db.metodoDePago.update({
          where: { id: despliegue.metodo_de_pago_id },
          data: { monto: { increment: totalSoles } },
        })
      }

      if (compra.egreso_dinero_id) {
        const egreso = await db.egresoDinero.findUniqueOrThrow({
          where: { id: compra.egreso_dinero_id },
          select: {
            monto: true,
            vuelto: true,
            despliegue_de_pago_id: true,
          },
        })

        await db.egresoDinero.update({
          where: { id: compra.egreso_dinero_id },
          data: { estado: false },
        })

        const despliegue = await db.despliegueDePago.findUniqueOrThrow({
          where: { id: egreso.despliegue_de_pago_id },
          select: { metodo_de_pago_id: true },
        })
        const reintegro = Number(egreso.monto ?? 0) - Number(egreso.vuelto ?? 0)
        if (reintegro > 0)
          await db.metodoDePago.update({
            where: { id: despliegue.metodo_de_pago_id },
            data: { monto: { increment: reintegro } },
          })
      }

      await db.compra.update({
        where: { id },
        data: { estado_de_compra: EstadoDeCompra.Anulado },
      })

      return { data: 'ok' }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
export const eliminarCompra = withAuth(eliminarCompraWA)

async function editarCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      if (
        parsedData.estado_de_compra === EstadoDeCompra.Creado ||
        (parsedData.estado_de_compra === EstadoDeCompra.EnEspera &&
          parsedData.serie &&
          parsedData.numero &&
          parsedData.proveedor_id)
      ) {
        const proveedor_serie_numero = await db.compra.findFirst({
          where: {
            proveedor_id: parsedData.proveedor_id,
            serie: parsedData.serie,
            numero: parsedData.numero,
            id: {
              not: parsedData.id,
            },
          },
          select: {
            id: true,
          },
        })

        if (proveedor_serie_numero)
          throw new Error(
            'Ya existe una compra con el mismo proveedor, serie y número (edición)'
          )
      }

      const compra = await db.compra.update({
        where: {
          id: parsedData.id,
        },
        data: {
          ...parsedData,
          productos_por_almacen: {
            deleteMany: {},
            ...parsedData.productos_por_almacen,
          },
        },
      })

      return { data: JSON.parse(JSON.stringify(compra)) as typeof compra }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const editarCompra = withAuth(editarCompraWA)

async function updateCompraWA({
  data,
  id,
}: {
  data: Prisma.CompraUncheckedUpdateInput
  id: Compra['id']
}) {
  const puede = await can(permissions.COMPRAS_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar una compra')

  const parsedData = CompraUncheckedUpdateInputSchema.parse(data)

  return await prisma.$transaction(
    async (db) => {
      const compra = await db.compra.update({
        where: {
          id,
        },
        data: parsedData,
      })

      return { data: JSON.parse(JSON.stringify(compra)) as typeof compra }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
export const updateCompra = withAuth(updateCompraWA)
