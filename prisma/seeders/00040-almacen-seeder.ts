import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function almacenSeeder() {
  const data = [
    {
      name: 'ALMACÉN 1',
      ubicaciones: {
        create: [{ name: 'UBICACIÓN 1-1' }, { name: 'UBICACIÓN 1-2' }],
      },
    },
    {
      name: 'ALMACÉN 2',
      ubicaciones: {
        create: [{ name: 'UBICACIÓN 2-1' }, { name: 'UBICACIÓN 2-2' }],
      },
    },
    {
      name: 'ALMACÉN 3',
      ubicaciones: {
        create: [{ name: 'UBICACIÓN 3-1' }, { name: 'UBICACIÓN 3-2' }],
      },
    },
  ]
  await Promise.all(data.map(item => prisma.almacen.create({ data: item })))
}
