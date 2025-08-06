import { TipoDocumento } from '@prisma/client'

export const TiposDocumentos: Record<
  TipoDocumento,
  { code: string; name: string }
> = {
  [TipoDocumento.T01]: {
    code: '01',
    name: 'Factura',
  },
  [TipoDocumento.T03]: {
    code: '03',
    name: 'Boleta de venta',
  },
  [TipoDocumento.XX]: {
    code: 'xx',
    name: 'Nota de venta',
  },
}
