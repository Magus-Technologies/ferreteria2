import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function almacenSeeder() {
  await prisma.almacen.createMany({
    data: [{ name: 'Almacén 1' }, { name: 'Almacén 2' }, { name: 'Almacén 3' }],
  })
}
