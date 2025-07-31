import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import { getAllPermissions } from '~/lib/permissions'

const prisma = new PrismaClient()

export default async function userSeeder() {
  const password = await argon2.hash('12345')
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@aplication.com',
      password,
      empresa_id: 1,
      roles: {
        create: [
          {
            name: 'admin_global',
            descripcion: 'Administrador Global',
            permissions: {
              create: getAllPermissions(),
            },
          },
        ],
      },
    },
  })
}
