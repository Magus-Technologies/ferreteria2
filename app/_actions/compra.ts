'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Compra, EstadoDeCompra, FormaDePago, Prisma, TipoMoneda } from '@prisma/client'
import {
  CompraUncheckedCreateInputSchema,
  CompraUncheckedUpdateInputSchema,
  CompraWhereInputSchema,
} from '~/prisma/generated/zod'
import { includeCompra } from './lib/lib-compra'

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
    async db => {
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

      const compra = await db.compra.create({
        data: parsedData,
      })

      if (
        compra.forma_de_pago === FormaDePago.Contado &&
        compra.despliegue_de_pago_id
      ) {
        const productosCreate = Array.isArray(
          parsedData.productos_por_almacen?.create
        )
          ? (parsedData.productos_por_almacen!.create)
          : []

        let total = 0
        for (const item of productosCreate) {
          const costo = Number(item.costo ?? 0)
          const unidades = Array.isArray(item.unidades_derivadas?.create)
            ? (item.unidades_derivadas!.create)
            : []
          for (const u of unidades) {
            const cantidad = Number(u.cantidad ?? 0)
            const factor = Number(u.factor ?? 0)
            const flete = Number(u.flete ?? 0)
            const bonificacion = Boolean(u.bonificacion)
            const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
            total += montoLinea
          }
        }

        const totalConPercepcion =
          total + Number((parsedData).percepcion ?? 0)

        const totalSoles =
          parsedData.tipo_moneda === TipoMoneda.Soles
            ? totalConPercepcion
            : totalConPercepcion * Number(parsedData.tipo_de_cambio ?? 1)

        const despliegue = await db.despliegueDePago.findUnique({
          where: { id: compra.despliegue_de_pago_id },
          select: { metodo_de_pago_id: true },
        })
        if (!despliegue)
          throw new Error('Despliegue de pago no encontrado para la compra creada')

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

  const compra = await prisma.compra.findUnique({
    where: {
      id,
    },
    select: {
      _count: {
        select: {
          recepciones_almacen: {
            where: {
              estado: true,
            },
          },
        },
      },
      estado_de_compra: true,
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

  await prisma.compra.update({
    where: {
      id,
    },
    data: {
      estado_de_compra: EstadoDeCompra.Anulado,
    },
  })

  return { data: 'ok' }
}
export const eliminarCompra = withAuth(eliminarCompraWA)

async function editarCompraWA(data: Prisma.CompraUncheckedCreateInput) {
  const puede = await can(permissions.COMPRAS_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar una compra')

  const parsedData = CompraUncheckedCreateInputSchema.parse(data)

  return await prisma.$transaction(
    async db => {
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
    async db => {
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
