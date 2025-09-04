'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'

async function getMarcasWA() {
  const puede = await can(permissions.MARCA_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de marcas')

  const item = await prisma.marca.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return { data: item }
}
export const getMarcas = withAuth(getMarcasWA)

async function createMarcaWA({ name }: { name: string }) {
  const puede = await can(permissions.MARCA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear marcas')

  try {
    const item = await prisma.marca.create({ data: { name } })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe una marca con ese nombre')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al crear la marca')
  }
}
export const createMarca = withAuth(createMarcaWA)
