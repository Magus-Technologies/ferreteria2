'use server'

import { Cliente, Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import {
  ClienteFindManyArgsSchema,
  ClienteUncheckedCreateInputSchema,
} from '~/prisma/generated/zod'
import can from '~/utils/server-validate-permission'

export type getClienteResponseProps = Cliente

async function SearchClienteWA(args: Prisma.ClienteFindManyArgs) {
  const argsParsed = ClienteFindManyArgsSchema.parse(args)

  const items = await prisma.cliente.findMany({
    ...argsParsed,
    orderBy: {
      razon_social: 'asc',
    },
  })

  return { data: JSON.parse(JSON.stringify(items)) as typeof items }
}
export const SearchCliente = withAuth(SearchClienteWA)

async function createClienteWA({
  data,
}: {
  data: Prisma.ClienteUncheckedCreateInput
}) {
  const puede = await can(permissions.CLIENTE_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear Clientes')

  const dataParsed = ClienteUncheckedCreateInputSchema.parse(data)

  try {
    const item = await prisma.cliente.create({ data: dataParsed })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe una Cliente con ese Numero de Documento')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al crear la Cliente')
  }
}
export const createCliente = withAuth(createClienteWA)
