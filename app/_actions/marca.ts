'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

async function getMarcasWA() {
  try {
    const puede = await can(permissions.MARCA_LISTADO)
    if (!puede) throw new Error('No tienes permiso para ver la lista de marcas')

    const item = await prisma.marca.findMany()
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getMarcas = withAuth(getMarcasWA)

async function createMarcaWA({ name }: { name: string }) {
  try {
    const puede = await can(permissions.MARCA_CREATE)
    if (!puede) throw new Error('No tienes permiso para crear marcas')

    const item = await prisma.marca.create({ data: { name } })
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createMarca = withAuth(createMarcaWA)
