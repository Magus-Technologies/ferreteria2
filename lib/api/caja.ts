/**
 * API Client para Apertura y Cierre de Caja (Laravel Backend)
 */
import { apiRequest, type ApiResponse } from '../api'

// ============= INTERFACES =============

export interface AperturaYCierreCaja {
  id: string
  user_id: number
  monto_apertura: number
  fecha_apertura: string
  monto_cierre: number | null
  fecha_cierre: string | null
  user?: {
    id: number
    name: string
    email: string
  }
}

// ============= REQUEST TYPES =============

export interface AperturarCajaRequest {
  monto_apertura: number
}

export interface CerrarCajaRequest {
  monto_cierre: number
}

export interface CajaHistorialFilters {
  per_page?: number
  page?: number
}

// ============= RESPONSE TYPES =============

export interface CajaResponse {
  data: AperturaYCierreCaja
  message?: string
}

export interface CajasListResponse {
  data: AperturaYCierreCaja[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// ============= API METHODS =============

export const cajaApi = {
  /**
   * Consulta si el usuario tiene una caja abierta
   */
  consultaApertura(): Promise<ApiResponse<{ data: string }>> {
    return apiRequest<{ data: string }>('/cajas/consulta-apertura', {
      method: 'GET',
    })
  },

  /**
   * Aperturar una nueva caja
   */
  aperturar(data: AperturarCajaRequest): Promise<ApiResponse<CajaResponse>> {
    return apiRequest<CajaResponse>('/cajas/aperturar', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Cerrar una caja abierta
   */
  cerrar(
    id: string,
    data: CerrarCajaRequest
  ): Promise<ApiResponse<CajaResponse>> {
    return apiRequest<CajaResponse>(`/cajas/${id}/cerrar`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Obtener la caja activa del usuario autenticado
   */
  cajaActiva(): Promise<ApiResponse<{ data: AperturaYCierreCaja | null }>> {
    return apiRequest<{ data: AperturaYCierreCaja | null }>(
      '/cajas/activa',
      {
        method: 'GET',
      }
    )
  },

  /**
   * Obtener historial de aperturas/cierres de caja
   */
  historial(
    filters?: CajaHistorialFilters
  ): Promise<ApiResponse<CajasListResponse>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const url = queryString ? `/cajas/historial?${queryString}` : '/cajas/historial'

    return apiRequest<CajasListResponse>(url, {
      method: 'GET',
    })
  },
}
