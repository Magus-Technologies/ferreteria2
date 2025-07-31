import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function unidadesMedidaSeeder() {
  await prisma.unidadMedida.createMany({
    data: [{ name: 'Unidad 1' }, { name: 'Unidad 2' }, { name: 'Unidad 3' }],
  })
}
