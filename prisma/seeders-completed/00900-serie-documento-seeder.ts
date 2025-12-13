import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function serieDocumentoSeeder() {
  const data = [
    {
      tipo_documento: 'Factura',
      serie: 'F001',
      correlativo: 0,
      almacen_id: 1,
      activo: true,
    },
    {
      tipo_documento: 'Boleta',
      serie: 'B001',
      correlativo: 0,
      almacen_id: 1,
      activo: true,
    },
    {
      tipo_documento: 'NotaDeVenta',
      serie: 'NV01',
      correlativo: 0,
      almacen_id: 1,
      activo: true,
    },
  ]

  for (const item of data) {
    await prisma.serieDocumento.upsert({
      where: {
        tipo_documento_serie_almacen_id: {
          tipo_documento: item.tipo_documento as any,
          serie: item.serie,
          almacen_id: item.almacen_id,
        },
      },
      update: {},
      create: item as any,
    })
  }
}
