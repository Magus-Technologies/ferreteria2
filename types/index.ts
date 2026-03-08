// Barrel export - tipos del sistema
// Usar: import { TipoDocumento, Compra, CompraWhereInput } from '~/types'

// Enums
export {
  TipoDocumento,
  EstadoDeCompra,
  FormaDePago,
  TipoMoneda,
} from './enums'

// Models
export type {
  Almacen,
  Ubicacion,
  UnidadDerivada,
  Producto,
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  Proveedor,
  Compra,
  UnidadDerivadaInmutableCompra,
  RecepcionAlmacen,
  IngresoSalida,
  Empresa,
  Marca,
  TipoIngresoSalida,
} from './models'

// Prisma helpers (for frontend stores/components)
export type {
  Decimal,
  CompraWhereInput,
  VentaWhereInput,
  ProductoWhereInput,
  EgresoDineroWhereInput,
  RecepcionAlmacenWhereInput,
} from './prisma-helpers'
