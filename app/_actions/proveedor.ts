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

async function SearchProveedorWA(args: Prisma.ProveedorFindManyArgs) {
  const argsParsed = ProveedorFindManyArgsSchema.parse(args)

  const items = await prisma.proveedor.findMany({
    ...argsParsed,
    orderBy: {
      razon_social: 'asc',
    },
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
