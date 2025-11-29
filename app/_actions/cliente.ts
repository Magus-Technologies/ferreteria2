'use server'

import { Cliente, Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import {
  ClienteFindManyArgsSchema,
  ClienteUncheckedCreateInputSchema,
  ClienteUncheckedUpdateInputSchema,
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

async function editarClienteWA({
  data,
}: {
  data: Prisma.ClienteUncheckedUpdateInput & { id: number }
}) {
  const puede = await can(permissions.CLIENTE_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar Clientes')

  const { id, ...rest } = data
  const dataParsed = ClienteUncheckedUpdateInputSchema.parse(rest)

  try {
    const item = await prisma.cliente.update({
      where: { id },
      data: dataParsed,
    })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error('Ya existe un Cliente con ese Numero de Documento')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al editar el Cliente')
  }
}
export const editarCliente = withAuth(editarClienteWA)

async function eliminarClienteWA({ id }: { id: number }) {
  const puede = await can(permissions.CLIENTE_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar Clientes')

  try {
    const item = await prisma.cliente.delete({ where: { id } })
    return { data: item }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003')
        throw new Error('No se puede eliminar el Cliente porque está en uso')
      throw new Error(`${error.code}`)
    }

    throw new Error('Error al eliminar el Cliente')
  }
}
export const eliminarCliente = withAuth(eliminarClienteWA)
