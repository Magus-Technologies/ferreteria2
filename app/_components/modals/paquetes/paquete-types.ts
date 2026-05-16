// ============= TIPOS =============

export type TipoPrecioPaquete = 'publico' | 'especial' | 'minimo' | 'ultimo'

export const TIPO_PRECIO_OPTIONS = [
  { value: 'publico' as TipoPrecioPaquete, label: 'Precio Público' },
  { value: 'especial' as TipoPrecioPaquete, label: 'Precio Ferreteria' },
  { value: 'minimo' as TipoPrecioPaquete, label: 'Precio Mínimo' },
  { value: 'ultimo' as TipoPrecioPaquete, label: 'Precio Final' },
]

export interface ProductoPaquete {
  key: string
  producto_id: number
  producto_name: string
  producto_codigo: string
  marca_name?: string
  unidad_derivada_id: number
  unidad_derivada_name: string
  cantidad: number
  precio_publico?: number
  precio_especial?: number
  precio_minimo?: number
  precio_ultimo?: number
  descuento_publico?: number
  descuento_especial?: number
  descuento_minimo?: number
  descuento_ultimo?: number
  tipo_precio_vista: TipoPrecioPaquete
  costo?: number
  costo_base?: number
  unidades_derivadas_disponibles?: any[]
}

// ============= HELPERS =============

/** Precio original del producto según tipo y unidad derivada (desde el catálogo del almacén) */
export function getPrecioOriginal(producto: ProductoPaquete, tipo?: TipoPrecioPaquete): number {
  const unidades = producto.unidades_derivadas_disponibles || []
  const unidad = unidades.find((u: any) => u.unidad_derivada.id === producto.unidad_derivada_id)
  if (!unidad) return 0
  return Number(unidad[`precio_${tipo ?? producto.tipo_precio_vista}`] || 0)
}

/** Precio del paquete guardado para un tipo */
export function getPrecioPaquete(producto: ProductoPaquete, tipo?: TipoPrecioPaquete): number {
  const campo = `precio_${tipo ?? producto.tipo_precio_vista}` as keyof ProductoPaquete
  return Number(producto[campo] || 0)
}

/** Descuento del paquete guardado para un tipo */
export function getDescuentoPaquete(producto: ProductoPaquete, tipo?: TipoPrecioPaquete): number {
  const campo = `descuento_${tipo ?? producto.tipo_precio_vista}` as keyof ProductoPaquete
  return Number(producto[campo] || 0)
}
