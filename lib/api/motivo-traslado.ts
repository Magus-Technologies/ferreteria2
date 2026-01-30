import { apiRequest } from '../api'
import type { ApiResponse } from '~/app/_types/api'

// ============= INTERFACES =============

export interface MotivoTraslado {
  id: number
  codigo: string
  descripcion: string
  activo: boolean
  created_at: string
  updated_at: string
}

// ============= REQUEST TYPES =============

export interface GetMotivosParams {
  activo?: boolean
  search?: string
}

export interface CreateMotivoTrasladoRequest {
  codigo: string
  descripcion: string
  activo?: boolean
}

export interface UpdateMotivoTrasladoRequest extends Partial<CreateMotivoTrasladoRequest> {}

// ============= RESPONSE TYPES =============

export interface MotivoTrasladoResponse {
  data: MotivoTraslado
  message: string
}

export interface MotivosListResponse {
  data: MotivoTraslado[]
  message: string
}

// ============= API METHODS =============

export const motivoTrasladoApi = {
  /**
   * Obtener todos los motivos de traslado
   * GET /api/motivos-traslado
   */
  async getAll(params?: GetMotivosParams): Promise<ApiResponse<MotivosListResponse>> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value)
            }
            return acc
          }, {} as Record<string, string>)
        ).toString()
      : ''
    
    return apiRequest<MotivosListResponse>(`/motivos-traslado${queryString}`)
  },

  /**
   * Obtener un motivo específico
   * GET /api/motivos-traslado/{id}
   */
  async getById(id: number): Promise<ApiResponse<MotivoTrasladoResponse>> {
    return apiRequest<MotivoTrasladoResponse>(`/motivos-traslado/${id}`)
  },

  /**
   * Crear un nuevo motivo
   * POST /api/motivos-traslado
   */
  async create(data: CreateMotivoTrasladoRequest): Promise<ApiResponse<MotivoTrasladoResponse>> {
    return apiRequest<MotivoTrasladoResponse>('/motivos-traslado', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Actualizar un motivo
   * PUT /api/motivos-traslado/{id}
   */
  async update(id: number, data: UpdateMotivoTrasladoRequest): Promise<ApiResponse<MotivoTrasladoResponse>> {
    return apiRequest<MotivoTrasladoResponse>(`/motivos-traslado/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Eliminar un motivo
   * DELETE /api/motivos-traslado/{id}
   */
  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>(`/motivos-traslado/${id}`, {
      method: 'DELETE',
    })
  },
}

