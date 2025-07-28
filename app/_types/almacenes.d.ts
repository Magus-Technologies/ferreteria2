export interface Almacen {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface ProductoAlmacen {
  id: number
  producto_id: number
  almacen_id: number
  stock_fraccion: number
  created_at: string
  updated_at: string
}

export interface UnidadDerivada {
  id: number
  name: string
}

export interface ProductoAlmacenUnidadDerivada {
  id: number
  producto_almacen_id: number
  unidad_derivada_id: number
  factor: number
  costo: number
  precio_principal: number
  comision_principal: number
}

export interface ProductoAlmacenUnidadDerivadaPrecio {
  id: number
  producto_almacen_unidad_derivada_id: number
  name: string
  precio: number
  comision?: number
  activador: number
}
