/**
 * API Client para Transacciones y Movimientos entre Cajas (Laravel Backend)
 */
import { apiRequest, type ApiResponse } from '../api'
import type { Usuario, SubCaja } from './caja-principal'

// ============= INTERFACES =============

export interface Transaccion {
  id: string
  sub_caja_id: number
  tipo_transaccion: 'ingreso' | 'egreso' | 'prestamo_enviado' | 'prestamo_recibido' | 'movimiento_interno_salida' | 'movimiento_interno_entrada'
  monto: string
  saldo_anterior: string
  saldo_nuevo: string
  descripcion: string
  referencia_id?: string
  referencia_tipo?: string
  fecha: string
  user: Usuario
  sub_caja?: SubCaja
}

export interface Prestamo {
  id: string
  sub_caja_origen_id: number | null
  caja_principal_origen_id?: number
  sub_caja_destino_id: number
  monto: string
  estado: 'pendiente' | 'devuelto' | 'cancelado'
  estado_aprobacion: 'pendiente_aprobacion' | 'aprobado' | 'rechazado'
  aprobado_por_id?: string
  fecha_aprobacion?: string
  motivo_rechazo?: string
  motivo?: string
  fecha_prestamo: string
  fecha_devolucion?: string
  sub_caja_origen?: {
    id: number
    nombre: string
  }
  sub_caja_destino: {
    id: number
    nombre: string
  }
  caja_principal_origen?: {
    id: number
    nombre: string
    user: Usuario
  }
  user_presta: Usuario
  user_recibe: Usuario
  aprobado_por?: Usuario
}

export interface MovimientoInterno {
  id: string
  sub_caja_origen_id: number
  sub_caja_destino_id: number
  monto: string
  justificacion: string
  comprobante?: string
  fecha: string
  sub_caja_origen: {
    id: number
    nombre: string
  }
  sub_caja_destino: {
    id: number
    nombre: string
  }
  user: Usuario
}

export interface CrearPrestamoRequest {
  caja_principal_origen_id?: number // Caja principal de donde se solicita (opcional si se envía sub_caja)
  sub_caja_origen_id?: number // Sub-caja origen (la selecciona el aprobador)
  sub_caja_destino_id: number
  monto: number
  despliegue_de_pago_id?: string
  motivo?: string
  user_recibe_id: string
}

export interface CrearMovimientoInternoRequest {
  sub_caja_origen_id: number
  sub_caja_destino_id: number
  monto: number
  despliegue_de_pago_id?: string
  justificacion: string
  comprobante?: string
}

export interface RegistrarTransaccionRequest {
  sub_caja_id: number
  tipo_transaccion: 'ingreso' | 'egreso'
  monto: number
  descripcion: string
  referencia_id?: string
  referencia_tipo?: string
  despliegue_pago_id?: string
  numero_operacion?: string
  /** Conteo detallado de billetes y monedas (opcional) */
  conteo_billetes_monedas?: {
    billete_200: number
    billete_100: number
    billete_50: number
    billete_20: number
    billete_10: number
    moneda_5: number
    moneda_2: number
    moneda_1: number
    moneda_050: number
    moneda_020: number
    moneda_010: number
  }
}

// ============= RESPONSE TYPES =============

export interface TransaccionesListResponse {
  success: boolean
  data: Transaccion[]
  pagination?: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface PrestamosListResponse {
  success: boolean
  data: {
    current_page: number
    data: Prestamo[]
    per_page: number
    total: number
  }
}

export interface PrestamoResponse {
  success: boolean
  message?: string
  data: Prestamo
}

export interface MovimientosInternosListResponse {
  success: boolean
  data: {
    current_page: number
    data: MovimientoInterno[]
    per_page: number
    total: number
  }
}

export interface MovimientoInternoResponse {
  success: boolean
  message?: string
  data: MovimientoInterno
}

export interface TransaccionResponse {
  success: boolean
  message?: string
  data: Transaccion
}

// ============= API METHODS =============

export const transaccionesCajaApi = {
  /**
   * Listar transacciones de una sub-caja
   */
  getTransaccionesBySubCaja(
    subCajaId: number,
    params?: {
      per_page?: number
      page?: number
    }
  ): Promise<ApiResponse<TransaccionesListResponse>> {
    const queryParams = new URLSearchParams()

    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString())
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `/cajas/sub-cajas/${subCajaId}/transacciones?${queryString}`
      : `/cajas/sub-cajas/${subCajaId}/transacciones`

    return apiRequest<TransaccionesListResponse>(url)
  },

  /**
   * Listar transacciones de una caja principal (todas sus sub-cajas)
   */
  getTransaccionesByCajaPrincipal(
    cajaPrincipalId: number,
    params?: {
      per_page?: number
      page?: number
    }
  ): Promise<ApiResponse<TransaccionesListResponse>> {
    const queryParams = new URLSearchParams()

    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString())
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `/cajas/cajas-principales/${cajaPrincipalId}/transacciones?${queryString}`
      : `/cajas/cajas-principales/${cajaPrincipalId}/transacciones`

    return apiRequest<TransaccionesListResponse>(url)
  },

  /**
   * Listar préstamos
   */
  getPrestamos(params?: {
    per_page?: number
    page?: number
  }): Promise<ApiResponse<PrestamosListResponse>> {
    const queryParams = new URLSearchParams()

    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString())
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/cajas/prestamos?${queryString}` : '/cajas/prestamos'

    return apiRequest<PrestamosListResponse>(url)
  },

  /**
   * Crear préstamo entre cajas principales diferentes
   */
  crearPrestamo(
    data: CrearPrestamoRequest
  ): Promise<ApiResponse<PrestamoResponse>> {
    return apiRequest<PrestamoResponse>('/cajas/prestamos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Listar préstamos pendientes de aprobación
   */
  getPrestamosPendientes(): Promise<ApiResponse<{ success: boolean; data: Prestamo[] }>> {
    return apiRequest<{ success: boolean; data: Prestamo[] }>('/cajas/prestamos/pendientes')
  },

  /**
   * Aprobar préstamo
   */
  aprobarPrestamo(id: string, subCajaOrigenId: number): Promise<ApiResponse<PrestamoResponse>> {
    return apiRequest<PrestamoResponse>(`/cajas/prestamos/${id}/aprobar`, {
      method: 'POST',
      body: JSON.stringify({ sub_caja_origen_id: subCajaOrigenId }),
    })
  },

  /**
   * Rechazar préstamo
   */
  rechazarPrestamo(
    id: string,
    motivo_rechazo?: string
  ): Promise<ApiResponse<PrestamoResponse>> {
    return apiRequest<PrestamoResponse>(`/cajas/prestamos/${id}/rechazar`, {
      method: 'POST',
      body: JSON.stringify({ motivo_rechazo }),
    })
  },

  /**
   * Devolver préstamo
   */
  devolverPrestamo(id: string): Promise<ApiResponse<PrestamoResponse>> {
    return apiRequest<PrestamoResponse>(`/cajas/prestamos/${id}/devolver`, {
      method: 'POST',
    })
  },

  /**
   * Listar movimientos internos
   */
  getMovimientosInternos(params?: {
    per_page?: number
    page?: number
  }): Promise<ApiResponse<MovimientosInternosListResponse>> {
    const queryParams = new URLSearchParams()

    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString())
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `/cajas/movimientos-internos?${queryString}`
      : '/cajas/movimientos-internos'

    return apiRequest<MovimientosInternosListResponse>(url)
  },

  /**
   * Crear movimiento interno (entre sub-cajas de la misma caja principal)
   */
  crearMovimientoInterno(
    data: CrearMovimientoInternoRequest
  ): Promise<ApiResponse<MovimientoInternoResponse>> {
    return apiRequest<MovimientoInternoResponse>('/cajas/movimientos-internos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Registrar una transacción manual (ingreso o egreso)
   */
  registrarTransaccion(
    data: RegistrarTransaccionRequest
  ): Promise<ApiResponse<TransaccionResponse>> {
    return apiRequest<TransaccionResponse>('/cajas/transacciones', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
