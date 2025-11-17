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

  await prisma.subCaja.create({
    data: {
      name: 'Caja Bancaria',
      metodos_de_pago: {
        create: [
          {
            name: 'BCP',
            despliegue_de_pagos: {
              create: [
                { name: 'CB / BCP / QR' },
                { name: 'CB / BCP / TRANSFERENCIA' },
              ],
            },
          },
          {
            name: 'SCOTIABANK',
            despliegue_de_pagos: {
              create: [{ name: 'CB / SCOTIABANK / TRANSFERENCIA' }],
            },
          },
          {
            name: 'BBVA',
            despliegue_de_pagos: {
              create: [
                { name: 'CB / BBVA / QR' },
                { name: 'CB / BBVA / TRANSFERENCIA' },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.subCaja.create({
    data: {
      name: 'Caja Ahorros',
      metodos_de_pago: {
        create: [
          {
            name: 'BCP',
            despliegue_de_pagos: {
              create: [{ name: 'TRANSFERENCIA', mostrar: false }],
            },
          },
          {
            name: 'SCOTIABANK',
            despliegue_de_pagos: {
              create: [{ name: 'TRANSFERENCIA', mostrar: false }],
            },
          },
          {
            name: 'BBVA',
            despliegue_de_pagos: {
              create: [{ name: 'TRANSFERENCIA', mostrar: false }],
            },
          },
        ],
      },
    },
  })

  await prisma.subCaja.create({
    data: {
      name: 'Caja Negra',
      metodos_de_pago: {
        create: [
          {
            name: 'Efectivo',
            despliegue_de_pagos: {
              create: [{ name: 'CN / EFECTIVO' }],
            },
          },
          {
            name: 'BCP',
            despliegue_de_pagos: {
              create: [
                { name: 'CN / BCP / YAPE' },
                { name: 'CN / BCP / TRANSFERENCIA' },
              ],
            },
          },
          {
            name: 'SCOTIABANK',
            despliegue_de_pagos: {
              create: [{ name: 'CN / SCOTIABANK / TRANSFERENCIA' }],
            },
          },
          {
            name: 'BBVA',
            despliegue_de_pagos: {
              create: [{ name: 'CN / BBVA / TRANSFERENCIA' }],
            },
          },
        ],
      },
    },
  })
}
