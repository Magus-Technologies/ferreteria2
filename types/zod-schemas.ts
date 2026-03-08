import { z } from 'zod'

const decimal = z.union([z.number(), z.string()]).optional()
const decimalRequired = z.union([z.number(), z.string()])

export const ProductoAlmacenUnidadDerivadaCreateInputSchema = z.object({
  factor: decimalRequired,
  precio_publico: decimalRequired,
  comision_publico: decimal.nullable(),
  precio_especial: decimal.nullable(),
  comision_especial: decimal.nullable(),
  activador_especial: decimal.nullable(),
  precio_minimo: decimal.nullable(),
  comision_minimo: decimal.nullable(),
  activador_minimo: decimal.nullable(),
  precio_ultimo: decimal.nullable(),
  comision_ultimo: decimal.nullable(),
  activador_ultimo: decimal.nullable(),
})

export const CompraCreateInputSchema = z.object({
  id: z.string().optional(),
  tipo_documento: z.string().optional(),
  serie: z.string().optional().nullable(),
  numero: z.number().int().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  forma_de_pago: z.string().optional(),
  tipo_moneda: z.string().optional(),
  tipo_de_cambio: decimal,
  percepcion: decimal,
  numero_dias: z.number().int().optional().nullable(),
  fecha_vencimiento: z.coerce.date().optional().nullable(),
  fecha: z.coerce.date(),
  guia: z.string().optional().nullable(),
  estado_de_compra: z.string().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
})

export const ProveedorCreateInputSchema = z.object({
  razon_social: z.string(),
  ruc: z.string(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  estado: z.boolean().optional(),
})

export const ProductoCreateInputSchema = z.object({
  cod_producto: z.string(),
  cod_barra: z.string().optional().nullable(),
  name: z.string(),
  name_ticket: z.string(),
  accion_tecnica: z.string().optional().nullable(),
  img: z.string().optional().nullable(),
  ficha_tecnica: z.string().optional().nullable(),
  stock_min: decimalRequired,
  stock_max: z.number().int().optional().nullable(),
  unidades_contenidas: decimalRequired,
  estado: z.boolean().optional(),
  permitido: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
})

export const VentaCreateInputSchema = z.object({
  id: z.string().optional(),
  tipo_documento: z.string().optional(),
  serie: z.string().optional().nullable(),
  numero: z.number().int().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  forma_de_pago: z.string().optional(),
  tipo_moneda: z.string().optional(),
  tipo_de_cambio: decimal,
  fecha: z.coerce.date(),
  estado_de_venta: z.string().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
})
