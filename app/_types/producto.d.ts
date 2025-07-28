export interface Producto {
  id: number
  cod_barra?: string
  name: string
  name_ticket: string
  categoria_id: number
  marca_id: number
  unidad_medida_id: number
  ubicacion_id: number
  accion_tecnica: string
  stock_min: number
  unidades_contenidas: number
  created_at: string
  updated_at: string
}

export interface Ubicacion {
  id: number
  name: string
  almacen_id: number
}

export interface Categoria {
  id: number
  name: string
}

export interface Marca {
  id: number
  name: string
}

export interface UnidadMedida {
  id: number
  name: string
}
