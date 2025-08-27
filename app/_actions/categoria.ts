'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { errorFormated } from '~/utils/error-formated'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma } from '@prisma/client'

async function getCategoriasWA() {
  try {
    const puede = await can(permissions.CATEGORIA_LISTADO)
    if (!puede)
      throw new Error('No tienes permiso para ver la lista de categorías')

    const item = await prisma.categoria.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return { data: item }
  } catch (error) {
    return errorFormated(error)
  }
}
export const getCategorias = withAuth(getCategoriasWA)

async function createCategoriaWA({ name }: { name: string }) {
  try {
    const puede = await can(permissions.CATEGORIA_CREATE)
    if (!puede) throw new Error('No tienes permiso para crear categorías')

    try {
      const item = await prisma.categoria.create({ data: { name } })
      return { data: item }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new Error('Ya existe una categoría con ese nombre')
        throw new Error(`${error.code}`)
      }

      throw new Error('Error al crear la categoría')
    }
  } catch (error) {
    return errorFormated(error)
  }
}
export const createCategoria = withAuth(createCategoriaWA)
