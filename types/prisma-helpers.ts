// Tipos auxiliares de Prisma para uso en frontend (stores, componentes)
// Reemplazo ligero de Prisma namespace - NO usar en server actions que ejecutan queries

// ============================================================
// Decimal - tipo para campos decimales de Prisma
// ============================================================
export type Decimal = number | string

// ============================================================
// Filtros base reutilizables
// ============================================================
type StringFilter = string | { contains?: string; startsWith?: string; endsWith?: string; equals?: string; in?: string[]; notIn?: string[]; not?: string }
type NumberFilter = number | { equals?: number; gt?: number; gte?: number; lt?: number; lte?: number; in?: number[]; notIn?: number[]; not?: number }
type DateTimeFilter = Date | string | { equals?: Date | string; gt?: Date | string; gte?: Date | string; lt?: Date | string; lte?: Date | string; not?: Date | string }
type BoolFilter = boolean | { equals?: boolean }
type StringNullableFilter = StringFilter | null
type NumberNullableFilter = NumberFilter | null
type DateTimeNullableFilter = DateTimeFilter | null

// ============================================================
// WhereInput genérico base
// ============================================================
interface BaseWhereInput {
  AND?: this | this[]
  OR?: this[]
  NOT?: this | this[]
}

// ============================================================
// CompraWhereInput
// ============================================================
export interface CompraWhereInput extends BaseWhereInput {
  id?: StringFilter
  tipo_documento?: StringFilter
  serie?: StringNullableFilter
  numero?: NumberNullableFilter
  descripcion?: StringNullableFilter
  forma_de_pago?: StringFilter
  tipo_moneda?: StringFilter
  tipo_de_cambio?: NumberFilter
  percepcion?: NumberFilter
  numero_dias?: NumberNullableFilter
  fecha_vencimiento?: DateTimeNullableFilter
  fecha?: DateTimeFilter
  guia?: StringNullableFilter
  estado_de_compra?: StringFilter | { in?: string[] }
  egreso_dinero_id?: StringNullableFilter
  despliegue_de_pago_id?: StringNullableFilter
  user_id?: StringFilter
  almacen_id?: NumberFilter
  created_at?: DateTimeFilter
  updated_at?: DateTimeFilter
  proveedor_id?: NumberNullableFilter
  almacen?: Record<string, unknown>
  despliegue_de_pago?: Record<string, unknown> | null
  egreso_dinero?: Record<string, unknown> | null
  proveedor?: Record<string, unknown> | null
  user?: Record<string, unknown>
  pagos_de_compras?: Record<string, unknown>
  productos_por_almacen?: Record<string, unknown>
  recepciones_almacen?: Record<string, unknown>
  [key: string]: unknown
}

// ============================================================
// VentaWhereInput
// ============================================================
export interface VentaWhereInput extends BaseWhereInput {
  id?: StringFilter
  tipo_documento?: StringFilter
  serie?: StringNullableFilter
  numero?: NumberNullableFilter
  descripcion?: StringNullableFilter
  forma_de_pago?: StringFilter
  tipo_moneda?: StringFilter
  tipo_de_cambio?: NumberFilter
  fecha?: DateTimeFilter
  estado_de_venta?: StringFilter | { in?: string[] }
  cliente_id?: NumberNullableFilter
  recomendado_por_id?: NumberNullableFilter
  user_id?: StringFilter
  almacen_id?: NumberFilter
  created_at?: DateTimeFilter
  updated_at?: DateTimeFilter
  [key: string]: unknown
}

// ============================================================
// ProductoWhereInput
// ============================================================
export interface ProductoWhereInput extends BaseWhereInput {
  id?: NumberFilter
  cod_producto?: StringFilter
  cod_barra?: StringNullableFilter
  name?: StringFilter
  name_ticket?: StringFilter
  categoria_id?: NumberFilter
  marca_id?: NumberFilter
  unidad_medida_id?: NumberFilter
  estado?: BoolFilter
  permitido?: BoolFilter
  [key: string]: unknown
}

// ============================================================
// EgresoDineroWhereInput
// ============================================================
export interface EgresoDineroWhereInput extends BaseWhereInput {
  id?: StringFilter
  monto?: NumberFilter
  vuelto?: NumberNullableFilter
  observaciones?: StringNullableFilter
  estado?: BoolFilter
  despliegue_de_pago_id?: StringFilter
  user_id?: StringFilter
  [key: string]: unknown
}

// ============================================================
// RecepcionAlmacenWhereInput
// ============================================================
export interface RecepcionAlmacenWhereInput extends BaseWhereInput {
  id?: NumberFilter
  numero?: NumberFilter
  observaciones?: StringNullableFilter
  fecha?: DateTimeFilter
  estado?: BoolFilter
  user_id?: StringFilter
  compra_id?: StringFilter
  [key: string]: unknown
}
