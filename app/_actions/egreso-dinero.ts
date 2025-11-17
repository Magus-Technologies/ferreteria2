'use server'

import { Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import { EgresoDineroWhereInputSchema } from '~/prisma/generated/zod'
import can from '~/utils/server-validate-permission'

async function getEgresosDineroWA({
  where,
}: {
  where?: Prisma.EgresoDineroWhereInput
}) {
  const puede = await can(permissions.EGRESO_DINERO_LISTADO)
  if (!puede) throw new Error('No tienes permiso para ver la lista de egresos')

  if (!where) return { data: [] }

  const whereParsed = EgresoDineroWhereInputSchema.parse(where)

  const items = await prisma.egresoDinero.findMany({
    where: whereParsed,
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const getEgresosDinero = withAuth(getEgresosDineroWA)
