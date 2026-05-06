import { apiRequest, type ApiResponse } from '../api'

export interface Profesion {
  id: number
  nombre: string
  created_at?: string
  updated_at?: string
}

interface ProfesionListResponse {
  data: Profesion[]
}

export const profesionesApi = {
  async getAll(search?: string): Promise<ApiResponse<ProfesionListResponse>> {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiRequest<ProfesionListResponse>(`/profesiones${query}`)
  },

  async create(nombre: string): Promise<ApiResponse<{ data: Profesion; message?: string }>> {
    return apiRequest<{ data: Profesion; message?: string }>('/profesiones', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    })
  },
}
