'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

async function getUbicacionesWA({ almacen_id }: { almacen_id: number }) {
  try {
    const puede = await can(permissions.UBICACION_LISTADO)
    if (!puede)
      throw new Error('No tienes permiso para ver la lista de ubicaciones')

    const item = await prisma.ubicacion.findMany({
      where: {
        almacen_id,
      },
    })
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getUbicaciones = withAuth(getUbicacionesWA)

async function createUbicacionWA({
  name,
  almacen_id,
}: {
  name: string
  almacen_id: number
}) {
  try {
    const puede = await can(permissions.UBICACION_CREATE)
    if (!puede) throw new Error('No tienes permiso para crear ubicaciones')

    const item = await prisma.ubicacion.create({ data: { name, almacen_id } })
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createUbicacion = withAuth(createUbicacionWA)
