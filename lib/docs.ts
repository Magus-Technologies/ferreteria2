import { TipoDocumento } from '@prisma/client'

export const TiposDocumentos: Record<
  TipoDocumento,
  { code: string; name: string }
> = {
  [TipoDocumento.Factura]: {
    code: '01',
    name: 'Factura',
  },
  [TipoDocumento.Boleta]: {
    code: '03',
    name: 'Boleta de venta',
  },
  [TipoDocumento.NotaDeVenta]: {
    code: 'nv',
    name: 'Nota de venta',
  },
  [TipoDocumento.Ingreso]: {
    code: 'in',
    name: 'Ingreso',
  },
  [TipoDocumento.Salida]: {
    code: 'sa',
    name: 'Salida',
  },
}
