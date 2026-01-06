import { apiRequest, type ApiResponse } from '../api'

export type Chofer = {
  id: number
  dni: string
  nombres: string
  apellidos: string
  licencia: string
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  estado: number
  created_at?: string
  updated_at?: string
}

export type ChoferCreateInput = Omit<Chofer, 'id' | 'created_at' | 'updated_at'>

export type ChoferUpdateInput = Partial<ChoferCreateInput>

export type ChoferSearchParams = {
  search?: string
  estado?: number
  per_page?: number
  page?: number
}

export type ChoferResponse = {
  data: Chofer
  message?: string
}

export type ChoferesListResponse = {
  data: Chofer[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const choferApi = {
  /**
   * Obtener todos los choferes con búsqueda y paginación
   */
  getAll: async (params?: ChoferSearchParams): Promise<ApiResponse<ChoferesListResponse>> => {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/choferes?${queryString}` : '/choferes'

    return apiRequest<ChoferesListResponse>(url)
  },

  /**
   * Obtener un chofer por ID
   */
  getById: async (id: number): Promise<ApiResponse<Chofer>> => {
    return apiRequest<Chofer>(`/choferes/${id}`)
  },

  /**
   * Buscar chofer por DNI
   */
  buscarPorDni: async (dni: string): Promise<ApiResponse<Chofer>> => {
    return apiRequest<Chofer>(`/choferes/buscar-dni/${dni}`)
  },

  /**
   * Crear un nuevo chofer
   */
  create: async (data: ChoferCreateInput): Promise<ApiResponse<ChoferResponse>> => {
    return apiRequest<ChoferResponse>('/choferes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Actualizar un chofer existente
   */
  update: async (id: number, data: ChoferUpdateInput): Promise<ApiResponse<ChoferResponse>> => {
    return apiRequest<ChoferResponse>(`/choferes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Eliminar (desactivar) un chofer
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/choferes/${id}`, {
      method: 'DELETE',
    })
  },
}
