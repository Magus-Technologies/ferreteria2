import argon2 from 'argon2'
import { prisma } from '~/db/db'

export const getUserFromDb = async (email: string, pwHash: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return null

  const isPasswordValid = await argon2.verify(user.password, pwHash)

  if (!isPasswordValid) return null

  return user
}
