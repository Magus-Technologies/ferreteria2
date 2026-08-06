import { apiRequest, type ApiResponse } from '../api'

export type TipoMovimientoKardex = 'venta' | 'cotizacion' | 'prestamo' | 'guia'
export type TipoMovimientoInventario = 'compra' | 'recepcion' | 'ingreso' | 'salida' | 'transferencia'
export type TipoEfectoKardex = 'ENTRADA' | 'SALIDA' | 'REFERENCIA' | 'ANULADO' | 'DEVOLUCION' | 'COMPRA'

export interface MovimientoKardex {
  tipo: string
  movimiento: string
  fecha: string
  documento: string
  unidad?: string
  cantidad?: number
  cantidad_fraccion?: number
  // Cuánto de esta línea ya estaba reservado por una cotización previa. `cantidad`
  // puede ser solo el excedente sobre esa reserva (venta) — `cantidad_total` es
  // siempre el total real (excedente + reservado, o el total ya completo si no
  // hay reserva de por medio).
  cantidad_reservada?: number
  cantidad_total?: number
  // Cuánto se liberó de una reserva de cotización que no se cubrió por
  // completo con esta venta (o el que corresponde a la fila "RESERVA
  // LIBERADA" en sí). Se copia también a la ENTREGA pareja de la venta.
  cantidad_liberada?: number
  precio?: number
  costo?: number
  entrada: number
  salida: number
  stock_anterior?: number
  cant_ingreso?: number
  cant_salida?: number
  stock_actual?: number
  costo_anterior?: number
  costo_actual?: number
  saldo: number | null
  saldo_anterior: number | null
  referencia_id: string | number
  producto_nombre?: string
  producto_codigo?: string
  cliente_id?: number | null
  cliente_nombre?: string | null
  cliente?: {
    id?: number | string
    razon_social?: string
    nombre_comercial?: string
  }
  unidades_contenidas?: number
  nota?: string | null
  // Campos para Kardex Finanzas
  metodo_pago?: string
  user_id?: string
  metodo_de_pago_id?: string
  subcaja_id?: string | null
  anulada?: boolean
  usuario_nombre?: string | null
  proveedor_nombre?: string | null
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
