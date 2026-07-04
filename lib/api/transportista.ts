import { apiRequest, type ApiResponse } from '../api'

export type Transportista = {
  id: number
  ruc: string
  razon_social: string
  nro_mtc?: string | null
  estado: boolean
  created_at?: string
  updated_at?: string
}

export type TransportistaCreateInput = {
  ruc: string
  razon_social: string
  nro_mtc?: string
}

export type TransportistaUpdateInput = Partial<TransportistaCreateInput> & {
  estado?: boolean
}

export type TransportistaSearchParams = {
  search?: string
  /** Filtra solo transportistas activos (para el select del formulario) */
  solo_activos?: boolean
  per_page?: number
  page?: number
}

export type TransportistaResponse = {
  data: Transportista
  message?: string
}

/** Registro en el Registro Nacional de Transporte de Mercancías (MTC).
 *  Un RUC puede tener varios; el backend los ordena con los habilitados primero. */
export type RegistroMtc = {
  codigo: string
  razon_social: string
  ruc: string
  estado: string
  habilitado: boolean
  vigente_hasta: string
  modalidad: string
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
   * Consultar el Registro Nacional de Transporte de Mercancías (MTC) por
   * RUC. Un RUC puede tener varios registros; el backend cachea 24h.
   */
  consultaMtc: async (
    ruc: string
  ): Promise<ApiResponse<{ data: RegistroMtc[] }>> =>
    apiRequest<{ data: RegistroMtc[] }>(`/transportistas/consulta-mtc/${ruc}`),

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

  /**
   * Actualizar un transportista existente (edición completa o payload
   * parcial, ej. solo { estado } para activar/desactivar)
   */
  update: async (
    id: number,
    data: TransportistaUpdateInput
  ): Promise<ApiResponse<TransportistaResponse>> => {
    return apiRequest<TransportistaResponse>(`/transportistas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}
