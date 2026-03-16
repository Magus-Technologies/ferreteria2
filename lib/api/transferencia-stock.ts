/**
 * API de Transferencias de Stock entre almacenes
 */

import { apiRequest } from '../api'
import type { ApiResponse, PaginatedResponse } from '~/app/_types/api'

export interface TransferenciaStock {
  id: number
  serie: number
  numero: number
  fecha: string
  almacen_origen_id: number
  almacen_destino_id: number
  user_id: string
  descripcion: string | null
  estado: boolean
  created_at: string
  updated_at: string
  almacen_origen: { id: number; name: string }
  almacen_destino: { id: number; name: string }
  user: { id: string; name: string }
  productos: ProductoTransferenciaStock[]
}

export interface ProductoTransferenciaStock {
  id: number
  transferencia_stock_id: number
  producto_almacen_origen_id: number
  producto_almacen_destino_id: number
  unidad_derivada_inmutable_id: number
  factor: number
  cantidad: number
  costo: number
  stock_anterior_origen: number
  stock_nuevo_origen: number
  stock_anterior_destino: number
  stock_nuevo_destino: number
  producto_almacen_origen: {
    id: number
    producto: {
      id: number
      name: string
      cod_producto: string
    }
  }
  unidad_derivada_inmutable: {
    id: number
    name: string
  }
}

export interface CreateTransferenciaStockParams {
  almacen_origen_id: number
  almacen_destino_id: number
  producto_id: number
  unidad_derivada_id: number
  cantidad: number
  fecha?: string
  descripcion?: string
}

export interface GetTransferenciasStockParams {
  almacen_id?: number
  desde?: string
  hasta?: string
  per_page?: number
  page?: number
}

export const transferenciaStockApi = {
  async getAll(
    params?: GetTransferenciasStockParams,
  ): Promise<ApiResponse<PaginatedResponse<TransferenciaStock>>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    return apiRequest<PaginatedResponse<TransferenciaStock>>(
      `/transferencias-stock?${queryParams.toString()}`,
    )
  },

  async create(
    data: CreateTransferenciaStockParams,
  ): Promise<ApiResponse<TransferenciaStock>> {
    return apiRequest<TransferenciaStock>(`/transferencias-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async anular(id: number): Promise<ApiResponse<any>> {
    return apiRequest<any>(`/transferencias-stock/${id}`, {
      method: 'DELETE',
    })
  },
}
