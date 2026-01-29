/**
 * API Client para Movimientos Internos y Depósitos de Seguridad
 */
import { apiRequest, type ApiResponse } from '../api'

// ============= INTERFACES =============

export interface MovimientoInterno {
  id: string
  sub_caja_origen: string
  sub_caja_destino: string
  metodo_origen: string
  banco_origen: string
  metodo_destino: string
  banco_destino: string
  monto: number
  justificacion: string
  fecha: string
  vendedor: string
}

export interface DepositoSeguridad {
  id: string
  vendedor: string
  sub_caja_origen: string
  sub_caja_destino: string
  metodo_destino: string
  banco_destino: string
  titular: string
  monto: number
  motivo: string
  fecha: string
  tipo: 'deposito_seguridad'
}

export interface CrearMovimientoInternoRequest {
  sub_caja_origen_id: number
  sub_caja_destino_id: number
  monto: number
  despliegue_de_pago_origen_id: string
  despliegue_de_pago_destino_id: string
  justificacion: string
  comprobante?: string
  numero_operacion?: string
}

// ============= API METHODS =============

export const movimientoInternoApi = {
  /**
   * Crear movimiento interno (incluye depósitos de seguridad)
   */
  crear: async (data: CrearMovimientoInternoRequest): Promise<ApiResponse<any>> => {
    return apiRequest('/cajas/movimientos-internos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Listar todos los movimientos internos
   */
  listar: async (): Promise<ApiResponse<MovimientoInterno[]>> => {
    return apiRequest('/cajas/movimientos-internos', {
      method: 'GET',
    })
  },

  /**
   * Listar depósitos de seguridad (Efectivo → Banco)
   */
  listarDepositosSeguridad: async (): Promise<ApiResponse<DepositoSeguridad[]>> => {
    return apiRequest('/cajas/movimientos-internos/depositos-seguridad', {
      method: 'GET',
    })
  },
}
