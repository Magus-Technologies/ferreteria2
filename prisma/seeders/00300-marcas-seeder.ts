import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function marcasSeeder() {
  await prisma.marca.createMany({
    data: [{ name: 'Marca 1' }, { name: 'Marca 2' }, { name: 'Marca 3' }],
  })
}
