import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function categoriasSeeder() {
  await prisma.categoria.createMany({
    data: [
      { name: 'CATEGORÍA 1' },
      { name: 'CATEGORÍA 2' },
      { name: 'CATEGORÍA 3' },
    ],
  })
}
