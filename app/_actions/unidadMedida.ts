'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'

async function getUnidadesMedidaWA() {
  try {
    const puede = await can(permissions.UNIDAD_MEDIDA_LISTADO)
    if (!puede)
      throw new Error(
        'No tienes permiso para ver la lista de unidades de medida'
      )

    const item = await prisma.unidadMedida.findMany()
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getUnidadesMedida = withAuth(getUnidadesMedidaWA)

async function createUnidadMedidaWA({ name }: { name: string }) {
  try {
    const puede = await can(permissions.UNIDAD_MEDIDA_CREATE)
    if (!puede)
      throw new Error('No tienes permiso para crear unidades de medida')

    try {
      const item = await prisma.unidadMedida.create({ data: { name } })
      return { data: item }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new Error('Ya existe una unidad de medida con ese nombre')
        throw new Error(`${error.code}`)
      }

      throw new Error('Error al crear la unidad de medida')
    }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createUnidadMedida = withAuth(createUnidadMedidaWA)
