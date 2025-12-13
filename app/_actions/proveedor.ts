'use server'

import { Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import {
  ProveedorFindManyArgsSchema,
  ProveedorUncheckedCreateInputSchema,
} from '~/prisma/generated/zod'
import can from '~/utils/server-validate-permission'
const includeGetProveedor = {
  vendedores: true,
  carros: true,
  choferes: true,
} satisfies Prisma.ProveedorInclude
export type getProveedorResponseProps = Prisma.ProveedorGetPayload<{
  include: typeof includeGetProveedor
}>

async function SearchProveedorWA(args: Prisma.ProveedorFindManyArgs) {
  const argsParsed = ProveedorFindManyArgsSchema.parse(args)

  const items = await prisma.proveedor.findMany({
    ...argsParsed,
    orderBy: {
      razon_social: 'asc',
    },
    include: includeGetProveedor,
    take: Math.min(argsParsed.take || 50, 100), // Máximo 100 proveedores
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const SearchProveedor = withAuth(SearchProveedorWA)

async function createProveedorWA({
  data,
}: {
  data: Prisma.ProveedorUncheckedCreateInput
}) {
  const puede = await can(permissions.PROVEEDOR_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear Proveedors')

  const dataParsed = ProveedorUncheckedCreateInputSchema.parse(data)

  try {
    const item = await prisma.proveedor.create({ data: dataParsed })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe una Proveedor con esa Razon Social y/o RucW')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al crear la Proveedor')
  }
}
export const createProveedor = withAuth(createProveedorWA)

async function editarProveedorWA({
  data,
}: {
  data: Prisma.ProveedorUncheckedCreateInput
}) {
  const puede = await can(permissions.PROVEEDOR_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar Proveedors')

  const dataParsed = ProveedorUncheckedCreateInputSchema.parse(data)

  try {
    const proveedor_actual = await prisma.proveedor.findUnique({
      where: {
        id: data.id,
      },
      select: {
        razon_social: true,
        ruc: true,
      },
    })
    const item = await prisma.proveedor.update({
      where: {
        id: data.id,
      },
      data: {
        ...dataParsed,
        razon_social:
          proveedor_actual?.razon_social === dataParsed.razon_social
            ? undefined
            : dataParsed.razon_social,
        ruc:
          proveedor_actual?.ruc === dataParsed.ruc ? undefined : dataParsed.ruc,
        vendedores: {
          deleteMany: {},
          ...dataParsed.vendedores,
        },
        carros: {
          deleteMany: {},
          ...dataParsed.carros,
        },
        choferes: {
          deleteMany: {},
          ...dataParsed.choferes,
        },
      },
    })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe una Proveedor con esa Razon Social y/o RucW')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al editar la Proveedor')
  }
}
export const editarProveedor = withAuth(editarProveedorWA)

async function eliminarProveedorWA({ id }: { id: number }) {
  const puede = await can(permissions.PROVEEDOR_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar Proveedors')
  try {
    await prisma.proveedor.delete({ where: { id } })
    return { data: 'ok' }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003')
        throw new Error(
          'Este Proveedor tiene registros a su nombre en el sistema'
        )
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al eliminar la Proveedor')
  }
}
export const eliminarProveedor = withAuth(eliminarProveedorWA)
