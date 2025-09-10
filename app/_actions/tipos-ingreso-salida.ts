'use server'

import { Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

async function getTiposIngresoSalidaWA() {
  const item = await prisma.tipoIngresoSalida.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return { data: item }
}
export const getTiposIngresoSalida = withAuth(getTiposIngresoSalidaWA)

async function createTipoIngresoSalidaWA({ name }: { name: string }) {
  const puede = await can(permissions.TIPO_INGRESO_SALIDA_CREATE)
  if (!puede)
    throw new Error('No tienes permiso para crear tipos de ingreso/salida')

  try {
    const item = await prisma.tipoIngresoSalida.create({ data: { name } })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe un tipo de ingreso/salida con ese nombre')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al crear el tipo de ingreso/salida')
  }
}
export const createTipoIngresoSalida = withAuth(createTipoIngresoSalidaWA)
