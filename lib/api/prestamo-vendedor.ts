/**
 * API Client para Préstamos entre Vendedores
 */
import { apiRequest, type ApiResponse } from '../api'

// ============= INTERFACES =============

export interface VendedorConEfectivo {
  vendedor_id: number
  vendedor_nombre: string
  efectivo_inicial: string
  efectivo_disponible: string
}

export interface SolicitudEfectivo {
  id: string
  monto: string
  motivo: string | null
  solicitante: string
  solicitante_id: number
  fecha: string
}

export interface CrearSolicitudRequest {
  apertura_cierre_caja_id: string
  vendedor_prestamista_id: number
  monto_solicitado: number
  motivo?: string
}

export interface RechazarSolicitudRequest {
  comentario?: string
}

// ============= API METHODS =============

export const prestamoVendedorApi = {
  /**
   * Crear solicitud de efectivo
   */
  crearSolicitud: async (data: CrearSolicitudRequest): Promise<ApiResponse<any>> => {
    return apiRequest('/cajas/prestamos-vendedores', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Listar solicitudes pendientes (recibidas)
   */
  listarPendientes: async (): Promise<ApiResponse<SolicitudEfectivo[]>> => {
    return apiRequest('/cajas/prestamos-vendedores/pendientes', {
      method: 'GET',
    })
  },

  /**
   * Listar todas las solicitudes
   */
  listarSolicitudes: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest('/cajas/prestamos-vendedores', {
      method: 'GET',
    })
  },

  /**
   * Aprobar solicitud con monto
   */
  aprobarSolicitud: async (solicitudId: number, montoAprobado: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/cajas/prestamos-vendedores/${solicitudId}/aprobar`, {
      method: 'POST',
      body: JSON.stringify({ monto_aprobado: montoAprobado }),
    })
  },

  /**
   * Aprobar solicitud (método legacy)
   */
  aprobar: async (solicitudId: string): Promise<ApiResponse<any>> => {
    return apiRequest(`/cajas/prestamos-vendedores/${solicitudId}/aprobar`, {
      method: 'POST',
    })
  },

  /**
   * Rechazar solicitud
   */
  rechazarSolicitud: async (solicitudId: number): Promise<ApiResponse<any>> => {
    return apiRequest(`/cajas/prestamos-vendedores/${solicitudId}/rechazar`, {
      method: 'POST',
    })
  },

  /**
   * Rechazar solicitud
   */
  rechazar: async (
    solicitudId: string,
    data: RechazarSolicitudRequest
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/cajas/prestamos-vendedores/${solicitudId}/rechazar`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Obtener vendedores con efectivo disponible
   */
  obtenerVendedoresConEfectivo: async (
    aperturaId: string
  ): Promise<ApiResponse<VendedorConEfectivo[]>> => {
    return apiRequest(
      `/cajas/vendedores/con-efectivo?apertura_id=${aperturaId}`,
      {
        method: 'GET',
      }
    )
  },

  /**
   * Listar transferencias de efectivo entre vendedores
   */
  listarTransferencias: async (): Promise<ApiResponse<any[]>> => {
    return apiRequest('/cajas/prestamos-vendedores/transferencias', {
      method: 'GET',
    })
  },
}
