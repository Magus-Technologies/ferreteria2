'use server'

import { Prisma } from '@prisma/client'

export async function getUltimoIdIngresoSalida({
  db,
}: {
  db: Prisma.TransactionClient
}) {
  const ultimo_id = await db.ingresoSalida.findFirst({
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
    },
  })
  return ultimo_id?.id ? ultimo_id.id + 1 : 1
}
