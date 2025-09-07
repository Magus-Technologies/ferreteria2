'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'

async function getTiposIngresoSalidaWA() {
  const item = await prisma.tipoIngresoSalida.findMany({
    orderBy: {
      name: 'asc',
    },
  })
  return { data: item }
}
export const getTiposIngresoSalida = withAuth(getTiposIngresoSalidaWA)
