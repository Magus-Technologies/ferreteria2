import { apiRequest, type ApiResponse } from '../api'

export type TipoMovimientoKardex = 'venta' | 'cotizacion' | 'prestamo' | 'guia'
export type TipoMovimientoInventario = 'compra' | 'recepcion' | 'ingreso' | 'salida'
export type TipoEfectoKardex = 'ENTRADA' | 'SALIDA' | 'REFERENCIA'

export interface MovimientoKardex {
  tipo: TipoMovimientoKardex
  movimiento: TipoEfectoKardex
  fecha: string
  documento: string
  unidad: string
  cantidad: number
  cantidad_fraccion: number
  precio: number
  costo: number
  entrada: number
  salida: number
  saldo: number
  referencia_id: string | number
}

export interface KardexResponse {
  data: MovimientoKardex[]
  total: number
  current_page: number
  per_page: number
  last_page: number
  stock_actual: number
  saldo_inicial: number
}

export interface KardexFilters {
  producto_id: number
  almacen_id?: number
  desde?: string
  hasta?: string
  tipo?: TipoMovimientoKardex
  per_page?: number
  page?: number
}

export interface KardexInventarioFilters {
  producto_id: number
  almacen_id?: number
  desde?: string
  hasta?: string
  tipo?: TipoMovimientoInventario
  per_page?: number
  page?: number
}

export const kardexApi = {
  async getMovimientos(filters: KardexFilters): Promise<ApiResponse<KardexResponse>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    return apiRequest<KardexResponse>(`/kardex?${params.toString()}`)
  },

  async getMovimientosInventario(filters: KardexInventarioFilters): Promise<ApiResponse<KardexResponse>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    return apiRequest<KardexResponse>(`/kardex/inventario?${params.toString()}`)
  },
}
