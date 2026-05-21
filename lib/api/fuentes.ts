import { apiRequest, type ApiResponse } from '../api'

export interface FuentePersonalizada {
  id: number
  nombre: string
  archivo_original: string
  archivo_url: string
  tipo_mime: string
  created_at: string
}

export const fuentesApi = {
  list: async (): Promise<ApiResponse<{ success: boolean; data: FuentePersonalizada[] }>> => {
    return apiRequest('/configuracion-impresion/fuentes-personalizadas')
  },

  upload: async (nombre: string, file: File): Promise<ApiResponse<{ success: boolean; message: string; data: FuentePersonalizada }>> => {
    const formData = new FormData()
    formData.append('nombre', nombre)
    formData.append('archivo', file)
    return apiRequest('/configuracion-impresion/fuentes-personalizadas/upload', {
      method: 'POST',
      data: formData,
    })
  },

  download: async (nombre: string, url: string): Promise<ApiResponse<{ success: boolean; message: string; data: FuentePersonalizada }>> => {
    return apiRequest('/configuracion-impresion/fuentes-personalizadas/download', {
      method: 'POST',
      data: { nombre, url },
    })
  },

  delete: async (id: number): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiRequest(`/configuracion-impresion/fuentes-personalizadas/${id}`, {
      method: 'DELETE',
    })
  },
}
