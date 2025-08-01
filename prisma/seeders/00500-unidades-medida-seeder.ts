import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function unidadesMedidaSeeder() {
  await prisma.unidadMedida.createMany({
    data: [{ name: 'UNIDAD 1' }, { name: 'UNIDAD 2' }, { name: 'UNIDAD 3' }],
  })
}
