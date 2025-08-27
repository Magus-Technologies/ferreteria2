'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'

async function getUbicacionesWA({ almacen_id }: { almacen_id: number }) {
  try {
    const puede = await can(permissions.UBICACION_LISTADO)
    if (!puede)
      throw new Error('No tienes permiso para ver la lista de ubicaciones')

    const item = await prisma.ubicacion.findMany({
      where: {
        almacen_id,
      },
      orderBy: {
        name: 'asc',
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

    try {
      const item = await prisma.ubicacion.create({ data: { name, almacen_id } })
      return { data: item }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new Error(
            'Ya existe una ubicación con ese nombre en ese Almacén'
          )
        throw new Error(`${error.code}`)
      }

      throw new Error('Error al crear la ubicación')
    }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createUbicacion = withAuth(createUbicacionWA)

async function importarUbicacionesWA(
  data: { name: string; almacen_id: number }[]
) {
  try {
    const uniqueData = Array.from(
      new Map(
        data.map(item => [`${item.almacen_id}-${item.name}`, item])
      ).values()
    )

    const items = await Promise.all(
      uniqueData.map(item =>
        prisma.ubicacion.upsert({
          where: {
            almacen_id_name: { almacen_id: item.almacen_id, name: item.name },
          },
          update: {},
          create: {
            name: item.name,
            almacen_id: item.almacen_id,
          },
        })
      )
    )
    return { data: items }
  } catch (error) {
    return errorFormated(error)
  }
}
export const importarUbicaciones = withAuth(importarUbicacionesWA)
