import { apiRequest, type ApiResponse } from '../api'

export type TipoMovimientoKardex = 'venta' | 'cotizacion' | 'prestamo' | 'guia'
export type TipoMovimientoInventario = 'compra' | 'recepcion' | 'ingreso' | 'salida'
export type TipoEfectoKardex = 'ENTRADA' | 'SALIDA' | 'REFERENCIA' | 'ANULADO' | 'DEVOLUCION' | 'COMPRA'

export interface MovimientoKardex {
  tipo: string
  movimiento: string
  fecha: string
  documento: string
  unidad: string
  cantidad: number
  cantidad_fraccion: number
  precio: number
  costo: number
  entrada: number
  salida: number
  stock_anterior: number
  cant_ingreso: number
  cant_salida: number
  stock_actual: number
  saldo: number | null
  saldo_anterior: number | null
  referencia_id: string | number
  producto_nombre?: string
  producto_codigo?: string
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
  producto_id?: number
  cliente_id?: number
  almacen_id?: number
  desde?: string
  hasta?: string
  tipo?: TipoMovimientoKardex
  per_page?: number
  page?: number
}

export interface KardexInventarioFilters {
  producto_id?: number
  proveedor_id?: number
  almacen_id?: number
  desde?: string
  hasta?: string
  tipo?: TipoMovimientoInventario
  per_page?: number
  page?: number
}

export interface KardexFinanzasFilters {
  metodo_pago_id?: string
  sub_caja_id?: string
  vendedor_id?: string
  desde?: string
  hasta?: string
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

    return apiRequest<KardexResponse>(`/kardex-facturacion?${params.toString()}`)
  },

  async getMovimientosInventario(filters: KardexInventarioFilters): Promise<ApiResponse<KardexResponse>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    return apiRequest<KardexResponse>(`/kardex-inventario?${params.toString()}`)
  },

  async getMovimientosFinanzas(filters: KardexFinanzasFilters): Promise<ApiResponse<KardexResponse>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    return apiRequest<KardexResponse>(`/kardex/finanzas?${params.toString()}`)
  },
}
