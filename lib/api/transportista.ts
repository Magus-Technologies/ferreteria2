import { apiRequest, type ApiResponse } from '../api'

export type Transportista = {
  id: number
  ruc: string
  razon_social: string
  nro_mtc?: string | null
  created_at?: string
  updated_at?: string
}

export type TransportistaCreateInput = {
  ruc: string
  razon_social: string
  nro_mtc?: string
}

export type TransportistaSearchParams = {
  search?: string
  per_page?: number
  page?: number
}

export type TransportistasListResponse = {
  data: Transportista[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const transportistaApi = {
  /**
   * Obtener todos los transportistas con búsqueda y paginación
   */
  list: async (
    params?: TransportistaSearchParams
  ): Promise<ApiResponse<TransportistasListResponse>> => {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/transportistas?${queryString}` : '/transportistas'

    return apiRequest<TransportistasListResponse>(url)
  },

  /**
   * Crear un nuevo transportista
   */
  create: async (
    data: TransportistaCreateInput
  ): Promise<ApiResponse<Transportista>> => {
    return apiRequest<Transportista>('/transportistas', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
