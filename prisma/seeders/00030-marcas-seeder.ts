import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function marcasSeeder() {
  await prisma.marca.createMany({
    data: [{ name: 'MARCA 1' }, { name: 'MARCA 2' }, { name: 'MARCA 3' }],
  })
}
