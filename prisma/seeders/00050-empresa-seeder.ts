import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function empresaSeeder() {
  const almacen = await prisma.almacen.findFirstOrThrow({
    where: {
      name: 'ALMACÉN PRINCIPAL',
    },
  })
  const marca = await prisma.marca.findFirstOrThrow({
    where: {
      name: 'ACEROS AREQUIPA',
    },
  })
  await prisma.empresa.create({
    data: {
      almacen_id: almacen.id,
      marca_id: marca.id,
      ruc: '20611539160',
      razon_social: 'GRUPO MI REDENTOR S.A.C.',
      direccion: 'CAL.SINCHI ROCA MZA. 6 LOTE. 15 P.J. EL MILAGRO (SECTOR III)',
      telefono: '908846540 / 952686345',
      email: 'grupomiredentorsac@gmail.com',
    },
  })
}
