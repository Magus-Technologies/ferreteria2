'use server'

import { Prisma, TipoDocumento } from '@prisma/client'

export async function getUltimoNumeroIngresoSalida({
  db,
  tipo_documento,
}: {
  db: Prisma.TransactionClient
  tipo_documento: TipoDocumento
}) {
  const ultimo_id = await db.ingresoSalida.findFirst({
    where: {
      tipo_documento,
    },
    orderBy: {
      numero: 'desc',
    },
    select: {
      numero: true,
    },
  })
  return ultimo_id?.numero ? ultimo_id.numero + 1 : 1
}
