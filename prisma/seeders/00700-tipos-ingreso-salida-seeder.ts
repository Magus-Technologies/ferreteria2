import { PrismaClient } from '@prisma/client'
import { TIPOS_INGRESOS_SALIDAS } from '~/app/_lib/tipos-ingresos-salidas'

const prisma = new PrismaClient()

export default async function tiposIngresoSalidaSeeder() {
  await prisma.tipoIngresoSalida.createMany({
    data: Object.values(TIPOS_INGRESOS_SALIDAS).map(value => ({
      name: value,
    })),
  })
}
