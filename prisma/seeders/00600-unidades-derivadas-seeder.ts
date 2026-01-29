import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function unidadesDerivadasSeeder() {
  await prisma.unidadDerivada.createMany({
    data: [{ name: 'UNIDAD' }, { name: 'DOCENA' }, { name: 'CIENTO' }],
  })
}
