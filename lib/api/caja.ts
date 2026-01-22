/**
 * API Client para Apertura y Cierre de Caja (Laravel Backend)
 */
import { apiRequest, type ApiResponse } from '../api'

// ============= INTERFACES =============

export interface SubCajaInfo {
  id: number
  codigo: string
  nombre: string
  tipo_caja: 'CC' | 'SC'
  saldo_actual: string
}

export interface CajaPrincipalInfo {
  id: number
  codigo: string
  nombre: string
}

export interface AperturaYCierreCaja {
  id: string
  caja_principal_id: number
  sub_caja_id: number
  user_id: string
  monto_apertura: string
  fecha_apertura: string
  monto_cierre: string | null
  fecha_cierre: string | null
  estado: 'abierta' | 'cerrada'
  caja_principal?: CajaPrincipalInfo
  sub_caja?: SubCajaInfo
  user?: {
    id: string
    name: string
    email: string
  }
}

// ============= REQUEST TYPES =============

export interface AperturarCajaRequest {
  caja_principal_id: number
  monto_apertura: number
  conteo_billetes_monedas?: {
    billete_200?: number
    billete_100?: number
    billete_50?: number
    billete_20?: number
    billete_10?: number
    moneda_5?: number
    moneda_2?: number
    moneda_1?: number
    moneda_050?: number
    moneda_020?: number
    moneda_010?: number
  }
}

export interface CerrarCajaRequest {
  monto_cierre_efectivo: number
  total_cuentas: number
  conteo_billetes_monedas?: {
    billete_200?: number
    billete_100?: number
    billete_50?: number
    billete_20?: number
    billete_10?: number
    moneda_5?: number
    moneda_2?: number
    moneda_1?: number
    moneda_050?: number
    moneda_020?: number
    moneda_010?: number
  }
  conceptos_adicionales?: Array<{
    concepto: string
    numero: string
    cantidad: number
  }>
  comentarios?: string
  supervisor_id?: number
  forzar_cierre?: boolean
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
   * Consulta si una caja principal tiene una apertura activa
   */
  consultaApertura(cajaPrincipalId: number): Promise<ApiResponse<{ 
    success: boolean
    message: string
    data: AperturaYCierreCaja | null 
  }>> {
    return apiRequest<{ 
      success: boolean
      message: string
      data: AperturaYCierreCaja | null 
    }>(`/cajas/consulta-apertura/${cajaPrincipalId}`, {
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
  ): Promise<ApiResponse<{
    success: boolean
    message: string
    data: AperturaYCierreCaja & {
      diferencias?: {
        efectivo_esperado: string
        efectivo_contado: string
        diferencia_efectivo: string
        total_esperado: string
        total_contado: string
        diferencia_total: string
        sobrante: string
        faltante: string
      }
      supervisor?: {
        id: number
        name: string
      }
      comentarios?: string
    }
  }>> {
    return apiRequest<any>(`/cajas/${id}/cerrar`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Obtener la caja activa del usuario autenticado
   */
  cajaActiva(userId?: string): Promise<ApiResponse<{ 
    success: boolean
    data: AperturaYCierreCaja & {
      resumen?: {
        total_ventas: number
        total_cobros: number
        total_tarjetas: number
        total_yape: number
        total_izipay: number
        total_transferencias: number
        total_otros: number
        total_efectivo_esperado: number
        total_otros_ingresos: number
        total_anulados: number
        total_devoluciones: number
        total_gastos: number
        total_pagos: number
        resumen_ventas: number
        resumen_ingresos: number
        resumen_egresos: number
        total_en_caja: number
      }
    } | null
  }>> {
    const url = userId ? `/cajas/activa?user_id=${userId}` : '/cajas/activa'
    return apiRequest<{ 
      success: boolean
      data: AperturaYCierreCaja & {
        resumen?: any
      } | null
    }>(url, {
      method: 'GET',
    })
  },

  /**
   * Obtener resumen de movimientos de una caja
   */
  resumenMovimientos(id: string): Promise<ApiResponse<{
    success: boolean
    data: {
      ventas: any[]
      ingresos: any[]
      egresos: any[]
      anulaciones: any[]
      totales_por_metodo: {
        efectivo: string
        tarjeta: string
        yape: string
        izipay: string
        transferencia: string
        otros: string
      }
    }
  }>> {
    return apiRequest<any>(`/cajas/${id}/resumen-movimientos`, {
      method: 'GET',
    })
  },

  /**
   * Obtener detalle completo de movimientos de una caja
   */
  detalleMovimientos(id: string): Promise<ApiResponse<{
    success: boolean
    data: {
      movimientos: {
        ventas: Array<{
          id: string
          serie_numero: string
          fecha: string
          monto: string
          metodo_pago: string
        }>
        ingresos: Array<{
          id: string
          fecha: string
          descripcion: string
          monto: string
          metodo_pago: string
          sub_caja: string
          sub_caja_codigo: string
        }>
        egresos: Array<{
          id: string
          fecha: string
          descripcion: string
          monto: string
          metodo_pago: string
          sub_caja: string
          sub_caja_codigo: string
        }>
        prestamos_enviados: Array<{
          id: string
          fecha: string
          descripcion: string
          monto: string
          metodo_pago: string
          sub_caja: string
          sub_caja_codigo: string
        }>
        prestamos_recibidos: Array<{
          id: string
          fecha: string
          descripcion: string
          monto: string
          metodo_pago: string
          sub_caja: string
          sub_caja_codigo: string
        }>
        movimientos_internos_salida: Array<{
          id: string
          fecha: string
          descripcion: string
          monto: string
          metodo_pago: string
          sub_caja: string
          sub_caja_codigo: string
        }>
        movimientos_internos_entrada: Array<{
          id: string
          fecha: string
          descripcion: string
          monto: string
          metodo_pago: string
          sub_caja: string
          sub_caja_codigo: string
        }>
      }
      totales_por_metodo: Record<string, number>
      resumen: {
        total_ventas: string
        total_ingresos: string
        total_egresos: string
        total_movimientos: number
      }
    }
  }>> {
    return apiRequest<any>(`/cajas/${id}/detalle-movimientos`, {
      method: 'GET',
    })
  },

  /**
   * Validar supervisor para autorizar cierres
   */
  validarSupervisor(data: {
    email: string
    password: string
  }): Promise<ApiResponse<{
    success: boolean
    data: {
      supervisor_id: number
      name: string
      puede_autorizar: boolean
    }
  }>> {
    return apiRequest<any>('/cajas/validar-supervisor', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Obtener historial de aperturas/cierres del usuario actual
   */
  historial(
    filters?: CajaHistorialFilters
  ): Promise<ApiResponse<{
    success: boolean
    data: AperturaYCierreCaja[]
    pagination?: {
      total: number
      per_page: number
      current_page: number
      last_page: number
    }
  }>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const url = queryString
      ? `/cajas/historial-aperturas?${queryString}`
      : '/cajas/historial-aperturas'

    return apiRequest<{
      success: boolean
      data: AperturaYCierreCaja[]
      pagination?: {
        total: number
        per_page: number
        current_page: number
        last_page: number
      }
    }>(url, {
      method: 'GET',
    })
  },

  /**
   * Obtener historial de TODAS las aperturas/cierres (Admin)
   */
  historialTodas(
    filters?: CajaHistorialFilters & { caja_principal_id?: number }
  ): Promise<ApiResponse<{
    success: boolean
    data: AperturaYCierreCaja[]
    pagination?: {
      total: number
      per_page: number
      current_page: number
      last_page: number
    }
  }>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const url = queryString
      ? `/cajas/historial-aperturas/todas?${queryString}`
      : '/cajas/historial-aperturas/todas'

    return apiRequest<{
      success: boolean
      data: AperturaYCierreCaja[]
      pagination?: {
        total: number
        per_page: number
        current_page: number
        last_page: number
      }
    }>(url, {
      method: 'GET',
    })
  },
}
