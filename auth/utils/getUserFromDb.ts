import argon2 from 'argon2'
import { prisma } from '~/db/db'

export const getUserFromDb = async (email: string, pwHash: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      efectivo: true,
      roles: {
        select: {
          permissions: {
            select: {
              name: true,
            },
          },
        },
      },
      permissions: {
        select: {
          name: true,
        },
      },
      empresa: {
        select: {
          id: true,
          ruc: true,
          razon_social: true,
          direccion: true,
          telefono: true,
          email: true,
          serie_ingreso: true,
          serie_salida: true,
          serie_recepcion_almacen: true,
          almacen_id: true,
          marca_id: true,
          logo: true,
        },
      },
    },
  })

  if (!user) return null

  const isPasswordValid = await argon2.verify(user.password, pwHash)

  if (!isPasswordValid) return null

  const all_permissions = Array.from(
    new Set([
      ...user.permissions.map((p) => p.name),
      ...user.roles.flatMap((role) => role.permissions.map((p) => p.name)),
    ])
  )

  const userWithAllPermissions = {
    id: user.id,
    efectivo: user.efectivo.toNumber(),
    empresa: user.empresa,
    all_permissions,
  }

  return userWithAllPermissions
}
