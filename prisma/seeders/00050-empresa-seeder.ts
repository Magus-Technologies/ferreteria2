import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function empresaSeeder() {
  const almacen = await prisma.almacen.findFirstOrThrow({
    where: {
      name: 'Almacén 1',
    },
  })
  await prisma.empresa.create({
    data: {
      almacen_id: almacen.id,
    },
  })
}
