'use server'

import { Session } from 'next-auth'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

async function createAperturarCajaWA(
  { monto_apertura }: { monto_apertura: number },
  session: Session
) {
  const puede = await can(permissions.CAJA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear aperturas de caja')

  const existe_apertura = await prisma.aperturaYCierreCaja.findFirst({
    where: {
      user_id: session.user.id,
      fecha_cierre: null,
    },
  })
  if (existe_apertura)
    throw new Error('Ya existe una apertura de caja para este usuario')

  const item = await prisma.aperturaYCierreCaja.create({
    data: {
      user_id: session.user.id,
      monto_apertura,
    },
  })
  return { data: item }
}
export const createAperturarCaja = withAuth(createAperturarCajaWA)
