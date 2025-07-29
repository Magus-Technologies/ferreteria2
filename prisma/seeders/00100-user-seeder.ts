import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

export default async function userSeeder() {
  const password = await argon2.hash('12345')
  await prisma.user.createMany({
    data: [
      {
        name: 'Admin',
        email: 'admin@aplication.com',
        password,
      },
    ],
  })
}
