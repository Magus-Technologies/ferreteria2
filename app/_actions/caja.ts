'use server'

import { Session } from 'next-auth'
import { auth } from '~/auth/auth'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'

async function consultaAperturaCajaWA() {
  const session = await auth()
  if (!session) throw new Error('No tienes sesión activa')

  const existe_apertura = await prisma.aperturaYCierreCaja.findFirst({
    where: {
      user_id: session.user.id,
      fecha_cierre: null,
    },
    select: {
      id: true,
    },
  })
  if (existe_apertura)
    throw new Error('Ya existe una apertura de caja para este usuario')

  return { data: 'ok' }
}
export const consultaAperturaCaja = withAuth(consultaAperturaCajaWA)

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
    select: {
      id: true,
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
