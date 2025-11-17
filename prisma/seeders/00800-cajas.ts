import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function cajasSeeder() {
  await prisma.subCaja.create({
    data: {
      name: 'Caja Chica',
      metodos_de_pago: {
        create: {
          name: 'Efectivo',
          despliegue_de_pagos: {
            create: {
              name: 'CCH / Efectivo',
            },
          },
        },
      },
    },
  })
}
