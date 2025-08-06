import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function empresaSeeder() {
  const almacen = await prisma.almacen.findFirstOrThrow({
    where: {
      name: 'ALMACÉN 1',
    },
  })
  const marca = await prisma.marca.findFirstOrThrow({
    where: {
      name: 'MARCA 1',
    },
  })
  await prisma.empresa.create({
    data: {
      almacen_id: almacen.id,
      marca_id: marca.id,
    },
  })
}
