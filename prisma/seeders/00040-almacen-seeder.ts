import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function almacenSeeder() {
  const data = [
    {
      name: 'Almacén 1',
      ubicaciones: {
        create: [{ name: 'Ubicación 1-1' }, { name: 'Ubicación 1-2' }],
      },
    },
    {
      name: 'Almacén 2',
      ubicaciones: {
        create: [{ name: 'Ubicación 2-1' }, { name: 'Ubicación 2-2' }],
      },
    },
    {
      name: 'Almacén 3',
      ubicaciones: {
        create: [{ name: 'Ubicación 3-1' }, { name: 'Ubicación 3-2' }],
      },
    },
  ]
  await Promise.all(data.map(item => prisma.almacen.create({ data: item })))
}
