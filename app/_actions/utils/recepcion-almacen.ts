'use server'

import { Prisma } from '@prisma/client'

export async function getUltimoNumeroRecepcionAlmacen({
  db,
}: {
  db: Prisma.TransactionClient
}) {
  const ultimo_id = await db.recepcionAlmacen.findFirst({
    orderBy: {
      numero: 'desc',
    },
    select: {
      numero: true,
    },
  })
  return ultimo_id?.numero ? ultimo_id.numero + 1 : 1
}
