export interface Lote {
  id: number
  almacen_id: number
  name: string
  vencimiento: string
  created_at: string
  updated_at: string
}

export interface ProductoLote {
  id: number
  producto_id: number
  lote_id: number
  stock_entero: number
  stock_fraccion: number
  created_at: string
  updated_at: string
}
