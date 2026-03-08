// Enums del sistema - reemplazo de @prisma/client enums
// Los valores deben coincidir con los del schema Prisma original

export const TipoDocumento = {
  Factura: 'Factura',
  Boleta: 'Boleta',
  NotaDeVenta: 'NotaDeVenta',
  Ingreso: 'Ingreso',
  Salida: 'Salida',
  RecepcionAlmacen: 'RecepcionAlmacen',
} as const
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento]

export const EstadoDeCompra = {
  Creado: 'Creado',
  EnEspera: 'EnEspera',
  Anulado: 'Anulado',
  Procesado: 'Procesado',
} as const
export type EstadoDeCompra = (typeof EstadoDeCompra)[keyof typeof EstadoDeCompra]

export const FormaDePago = {
  Contado: 'Contado',
  cr: 'cr',
} as const
export type FormaDePago = (typeof FormaDePago)[keyof typeof FormaDePago]

export const TipoMoneda = {
  Soles: 'Soles',
  d: 'd',
} as const
export type TipoMoneda = (typeof TipoMoneda)[keyof typeof TipoMoneda]
