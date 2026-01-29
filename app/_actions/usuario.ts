'use server'

import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

export async function getUsuarios() {
  const puede = await can(permissions.USUARIO_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de usuarios')

  const item = await prisma.user.findMany({
    orderBy: {
      name: 'asc',
    },
    take: 50, // Límite para mejor performance
  })
  return { data: item }
}
