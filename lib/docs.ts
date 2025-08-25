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
    code: 'xx',
    name: 'Nota de venta',
  },
}
