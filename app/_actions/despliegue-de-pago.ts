'use server'

import { Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import { DespliegueDePagoWhereInputSchema } from '~/prisma/generated/zod'
import can from '~/utils/server-validate-permission'

async function getDespliegueDePagoWA({
  where,
}: {
  where?: Prisma.DespliegueDePagoWhereInput
}) {
  const puede = await can(permissions.DESPLIEGUE_DE_PAGO_LISTADO)
  if (!puede)
    throw new Error('No tienes permiso para ver la lista de despliegue de pago')

  if (!where) return { data: [] }

  const whereParsed = DespliegueDePagoWhereInputSchema.parse(where)

  const items = await prisma.despliegueDePago.findMany({
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getDespliegueDePago = withAuth(getDespliegueDePagoWA)
