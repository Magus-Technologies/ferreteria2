// Interfaces de modelos - reemplazo de @prisma/client model types
// Los campos deben coincidir con los del schema Prisma original

import type { TipoDocumento, EstadoDeCompra, FormaDePago, TipoMoneda } from './enums'
import type { Decimal } from './prisma-helpers'

// ============================================================
// Almacen
// ============================================================
export interface Almacen {
  id: number
  name: string
  created_at: Date
  updated_at: Date
}

// ============================================================
// Ubicacion
// ============================================================
export interface Ubicacion {
  id: number
  name: string
  almacen_id: number
  estado: boolean
}

// ============================================================
// UnidadDerivada
// ============================================================
export interface UnidadDerivada {
  id: number
  name: string
  estado: boolean
}

// ============================================================
// Producto
// ============================================================
export interface Producto {
  id: number
  cod_producto: string
  cod_barra: string | null
  name: string
  name_ticket: string
  categoria_id: number
  marca_id: number
  unidad_medida_id: number
  accion_tecnica: string | null
  img: string | null
  ficha_tecnica: string | null
  stock_min: Decimal
  stock_max: number | null
  unidades_contenidas: Decimal
  estado: boolean
  permitido: boolean
  created_at: Date
  updated_at: Date
}

// ============================================================
// ProductoAlmacen
// ============================================================
export interface ProductoAlmacen {
  id: number
  producto_id: number
  almacen_id: number
  stock_fraccion: Decimal
  costo: Decimal
  ubicacion_id: number
  created_at: Date
  updated_at: Date
}

// ============================================================
// ProductoAlmacenUnidadDerivada
// ============================================================
export interface ProductoAlmacenUnidadDerivada {
  id: number
  producto_almacen_id: number
  unidad_derivada_id: number
  factor: Decimal
  precio_publico: Decimal
  comision_publico: Decimal | null
  precio_especial: Decimal | null
  comision_especial: Decimal | null
  activador_especial: Decimal | null
  precio_minimo: Decimal | null
  comision_minimo: Decimal | null
  activador_minimo: Decimal | null
  precio_ultimo: Decimal | null
  comision_ultimo: Decimal | null
  activador_ultimo: Decimal | null
}

// ============================================================
// Proveedor
// ============================================================
export interface Proveedor {
  id: number
  razon_social: string
  ruc: string
  direccion: string | null
  telefono: string | null
  email: string | null
  estado: boolean
}

// ============================================================
// Compra
// ============================================================
export interface Compra {
  id: string
  tipo_documento: TipoDocumento
  serie: string | null
  numero: number | null
  descripcion: string | null
  forma_de_pago: FormaDePago
  tipo_moneda: TipoMoneda
  tipo_de_cambio: Decimal
  percepcion: Decimal
  numero_dias: number | null
  fecha_vencimiento: Date | null
  fecha: Date
  guia: string | null
  estado_de_compra: EstadoDeCompra
  egreso_dinero_id: string | null
  despliegue_de_pago_id: string | null
  user_id: string
  almacen_id: number
  created_at: Date
  updated_at: Date
  proveedor_id: number | null
}

// ============================================================
// UnidadDerivadaInmutableCompra
// ============================================================
export interface UnidadDerivadaInmutableCompra {
  id: number
  unidad_derivada_inmutable_id: number
  producto_almacen_compra_id: number
  factor: Decimal
  cantidad: Decimal
  cantidad_pendiente: Decimal
  lote: string | null
  vencimiento: Date | null
  flete: Decimal
  bonificacion: boolean
}

// ============================================================
// RecepcionAlmacen
// ============================================================
export interface RecepcionAlmacen {
  id: number
  numero: number
  observaciones: string | null
  fecha: Date
  transportista_razon_social: string | null
  transportista_ruc: string | null
  transportista_placa: string | null
  transportista_licencia: string | null
  transportista_dni: string | null
  transportista_name: string | null
  transportista_guia_remision: string | null
  estado: boolean
  user_id: string
  compra_id: string
  created_at: Date
  updated_at: Date
}

// ============================================================
// IngresoSalida
// ============================================================
export interface IngresoSalida {
  id: number
  fecha: Date
  tipo_documento: TipoDocumento
  serie: number
  numero: number
  descripcion: string | null
  estado: boolean
  almacen_id: number
  tipo_ingreso_id: number
  proveedor_id: number | null
  user_id: string
  created_at: Date
  updated_at: Date
}

// ============================================================
// Marca
// ============================================================
export interface Marca {
  id: number
  name: string
  estado: boolean
}

// ============================================================
// TipoIngresoSalida
// ============================================================
export interface TipoIngresoSalida {
  id: number
  name: string
  estado: boolean
}

// ============================================================
// Empresa
// ============================================================
export interface Empresa {
  id: number
  almacen_id: number
  marca_id: number
  serie_ingreso: string
  serie_salida: string
  serie_recepcion_almacen: string
  ruc: string
  razon_social: string
  direccion: string
  telefono: string
  email: string
  logo: string | null
}
