/**
 * API Client para Sistema de Cajas Principales (Laravel Backend)
 */
import { apiRequest, type ApiResponse } from '../api'

// ============= INTERFACES =============

export interface Usuario {
  id: string
  name: string
  email: string
  numero_documento?: string
  rol_sistema?: string
  empresa_id?: number
}

export interface MetodoPago {
  id: string
  name: string
  cuenta_bancaria: string | null
  monto?: string
}

export interface DesplieguePago {
  id: string
  name: string
  adicional: string
  mostrar: boolean
  metodo_de_pago?: MetodoPago
}

export interface SubCaja {
  id: number
  codigo: string
  nombre: string
  tipo_caja: 'CC' | 'SC'
  tipo_caja_label: string
  despliegues_pago_ids: string[]
  despliegues_pago: DesplieguePago[]
  acepta_todos_metodos: boolean
  tipos_comprobante: string[]
  tipos_comprobante_labels: string[]
  saldo_actual: string
  proposito?: string
  estado: boolean
  es_caja_chica: boolean
  puede_eliminar: boolean
  puede_modificar: boolean
  created_at: string
  updated_at: string
}

export interface CajaPrincipal {
  id: number
  codigo: string
  nombre: string
  estado: boolean
  user: Usuario
  sub_cajas: SubCaja[]
  total_sub_cajas: number
  saldo_total: string
  created_at: string
  updated_at: string
}

// ============= REQUEST TYPES =============

export interface CreateCajaPrincipalRequest {
  user_id: string
  nombre: string
}

export interface CreateSubCajaRequest {
  caja_principal_id: number
  nombre: string
  despliegues_pago_ids: string[]  // Array de IDs o ["*"]
  tipos_comprobante: string[]
  proposito?: string
}

export interface UpdateSubCajaRequest {
  nombre?: string
  despliegues_pago_ids?: string[]
  tipos_comprobante?: string[]
  proposito?: string
  estado?: boolean
}

// ============= RESPONSE TYPES =============

export interface CajaPrincipalResponse {
  success: boolean
  message?: string
  data: CajaPrincipal
}

export interface CajasPrincipalesListResponse {
  success: boolean
  data: CajaPrincipal[]
}

export interface VendedoresDisponiblesResponse {
  success: boolean
  data: Usuario[]
}

export interface SubCajaResponse {
  success: boolean
  message?: string
  data: SubCaja
}

export interface SubCajasListResponse {
  success: boolean
  data: SubCaja[]
}

// ============= API METHODS =============

export const cajaPrincipalApi = {
  /**
   * Obtener vendedores disponibles para asignar caja
   */
  getVendedoresDisponibles(params?: {
    solo_vendedores?: boolean
    sin_caja?: boolean
  }): Promise<ApiResponse<VendedoresDisponiblesResponse>> {
    const queryParams = new URLSearchParams()

    if (params?.solo_vendedores) {
      queryParams.append('solo_vendedores', 'true')
    }
    if (params?.sin_caja) {
      queryParams.append('sin_caja', 'true')
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `/usuarios/vendedores-disponibles?${queryString}`
      : '/usuarios/vendedores-disponibles'

    return apiRequest<VendedoresDisponiblesResponse>(url)
  },

  /**
   * Listar todas las cajas principales
   */
  getAll(): Promise<ApiResponse<CajasPrincipalesListResponse>> {
    return apiRequest<CajasPrincipalesListResponse>('/cajas/cajas-principales')
  },

  /**
   * Obtener una caja principal por ID
   */
  getById(id: number): Promise<ApiResponse<CajaPrincipalResponse>> {
    return apiRequest<CajaPrincipalResponse>(`/cajas/cajas-principales/${id}`)
  },

  /**
   * Obtener caja principal del usuario actual
   */
  getByUsuarioActual(userId?: string): Promise<ApiResponse<CajaPrincipalResponse>> {
    const url = userId
      ? `/cajas/cajas-principales/usuario/actual?user_id=${userId}`
      : '/cajas/cajas-principales/usuario/actual'

    return apiRequest<CajaPrincipalResponse>(url)
  },

  /**
   * Crear una nueva caja principal
   */
  create(data: CreateCajaPrincipalRequest): Promise<ApiResponse<CajaPrincipalResponse>> {
    return apiRequest<CajaPrincipalResponse>('/cajas/cajas-principales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Eliminar una caja principal
   */
  delete(id: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>(`/cajas/cajas-principales/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Listar sub-cajas de una caja principal
   */
  getSubCajas(cajaPrincipalId: number): Promise<ApiResponse<SubCajasListResponse>> {
    return apiRequest<SubCajasListResponse>(`/cajas/cajas-principales/${cajaPrincipalId}/sub-cajas`)
  },

  /**
   * Crear una sub-caja
   */
  createSubCaja(data: CreateSubCajaRequest): Promise<ApiResponse<SubCajaResponse>> {
    console.log('=== cajaPrincipalApi.createSubCaja ===')
    console.log('Data recibida:', data)
    console.log('despliegues_pago_ids:', data.despliegues_pago_ids)
    console.log('Es array?', Array.isArray(data.despliegues_pago_ids))
    console.log('JSON.stringify:', JSON.stringify(data))
    console.log('=====================================')

    return apiRequest<SubCajaResponse>('/cajas/sub-cajas', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Obtener una sub-caja por ID
   */
  getSubCajaById(id: number): Promise<ApiResponse<SubCajaResponse>> {
    return apiRequest<SubCajaResponse>(`/cajas/sub-cajas/${id}`)
  },

  /**
   * Actualizar una sub-caja
   */
  updateSubCaja(id: number, data: UpdateSubCajaRequest): Promise<ApiResponse<SubCajaResponse>> {
    return apiRequest<SubCajaResponse>(`/cajas/sub-cajas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Eliminar una sub-caja
   */
  deleteSubCaja(id: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest<{ success: boolean; message: string }>(`/cajas/sub-cajas/${id}`, {
      method: 'DELETE',
    })
  },
}
