import { PrismaClient, TipoDocumento } from '@prisma/client'

const prisma = new PrismaClient()

interface SerieDocumentoData {
  tipo_documento: TipoDocumento
  serie: string
  correlativo: number
  almacen_id: number
  activo: boolean
}

export default async function serieDocumentoSeeder() {
  const data: SerieDocumentoData[] = [
    {
      tipo_documento: TipoDocumento.Factura,
      serie: 'F001',
      correlativo: 0,
      almacen_id: 1,
      activo: true,
    },
    {
      tipo_documento: TipoDocumento.Boleta,
      serie: 'B001',
      correlativo: 0,
      almacen_id: 1,
      activo: true,
    },
    {
      tipo_documento: TipoDocumento.NotaDeVenta,
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
          tipo_documento: item.tipo_documento,
          serie: item.serie,
          almacen_id: item.almacen_id,
        },
      },
      update: {},
      create: item,
    })
  }
}