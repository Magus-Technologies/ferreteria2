import { TipoDocumento } from '@prisma/client'

export const TiposDocumentos: Record<
  TipoDocumento,
  { code: string; name: string; cod_serie: string }
> = {
  [TipoDocumento.Factura]: {
    code: '01',
    name: 'Factura',
    cod_serie: 'F',
  },
  [TipoDocumento.Boleta]: {
    code: '03',
    name: 'Boleta de venta',
    cod_serie: 'B',
  },
  [TipoDocumento.NotaDeVenta]: {
    code: 'nv',
    name: 'Nota de venta',
    cod_serie: 'NV',
  },
  [TipoDocumento.Ingreso]: {
    code: 'in',
    name: 'Ingreso',
    cod_serie: 'IN',
  },
  [TipoDocumento.Salida]: {
    code: 'sa',
    name: 'Salida',
    cod_serie: 'SA',
  },
  [TipoDocumento.RecepcionAlmacen]: {
    code: 'rc',
    name: 'Recepcion de Almacén',
    cod_serie: 'RC',
  },
}
