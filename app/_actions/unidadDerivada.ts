'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'

async function getUnidadesDerivadasWA() {
  try {
    const puede = await can(permissions.UNIDAD_DERIVADA_LISTADO)
    if (!puede)
      throw new Error(
        'No tienes permiso para ver la lista de unidades derivadas'
      )

    const item = await prisma.unidadDerivada.findMany()
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getUnidadesDerivadas = withAuth(getUnidadesDerivadasWA)

async function createUnidadDerivadaWA({ name }: { name: string }) {
  try {
    const puede = await can(permissions.UNIDAD_DERIVADA_CREATE)
    if (!puede)
      throw new Error('No tienes permiso para crear unidades derivadas')

    try {
      const item = await prisma.unidadDerivada.create({ data: { name } })
      return { data: item }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new Error('Ya existe una unidad derivada con ese nombre')
        throw new Error(`${error.code}`)
      }

      throw new Error('Error al crear la unidad derivada')
    }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createUnidadDerivada = withAuth(createUnidadDerivadaWA)
