'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

async function getAlmacenesWA() {
  try {
    const puede = await can(permissions.ALMACEN_LISTADO)
    if (!puede)
      throw new Error('No tienes permiso para ver la lista de almacenes')

    const item = await prisma.almacen.findMany()
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getAlmacenes = withAuth(getAlmacenesWA)

async function createAlmacenWA({ name }: { name: string }) {
  try {
    const puede = await can(permissions.ALMACEN_CREATE)
    if (!puede) throw new Error('No tienes permiso para crear almacenes')

    const item = await prisma.almacen.create({ data: { name } })
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createAlmacen = withAuth(createAlmacenWA)
