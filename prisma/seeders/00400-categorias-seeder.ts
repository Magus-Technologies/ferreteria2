import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function categoriasSeeder() {
  await prisma.categoria.createMany({
    data: [
      { name: 'Categoria 1' },
      { name: 'Categoria 2' },
      { name: 'Categoria 3' },
    ],
  })
}
