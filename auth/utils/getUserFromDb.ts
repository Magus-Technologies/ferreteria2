import argon2 from 'argon2'
import { prisma } from '~/db/db'

export const getUserFromDb = async (email: string, pwHash: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
      permissions: true,
      empresa: true,
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
    // ...user,
    id: user.id,
    efectivo: user.efectivo.toNumber(),
    empresa: user.empresa,
    all_permissions,
  }

  return userWithAllPermissions
}
