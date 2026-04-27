/**
 * API para Gestión de Comisiones de Vendedores
 */

import { apiRequest } from '../api'

export interface ComisionVendedor {
  user_id: string
  vendedor: string | null
  email: string | null
  total_ventas: number
  comision_generada: number
  comision_pagada: number
  comision_pendiente: number
}

export interface ResumenComisiones {
  total_vendedores: number
  total_generado: number
  total_pagado: number
  total_pendiente: number
}

export interface ComisionDetalle {
  venta_id: string
  comprobante: string
  tipo_documento: string
  fecha: string
  almacen: string | null
  cliente: string | null
  producto: string | null
  producto_codigo: string | null
  cantidad: number
  precio: number
  comision: number
  comision_total: number
}

export interface ComisionPago {
  id: string
  user_id: string
  pagado_por: string
  monto_pagado: number
  periodo_desde: string
  periodo_hasta: string
  fecha_pago: string
  metodo_pago: string | null
  observacion: string | null
  created_at: string
  updated_at: string
  vendedor?: { id: string; name: string; email: string }
  pagado_por_usuario?: { id: string; name: string }
}

export interface FiltrosComision {
  desde?: string
  hasta?: string
  almacen_id?: number
  user_id?: string
}

export interface RegistrarPagoPayload {
  user_id: string
  monto_pagado: number
  periodo_desde: string
  periodo_hasta: string
  fecha_pago: string
  metodo_pago?: string
  observacion?: string
}

function buildQuery(filtros?: Record<string, unknown>): string {
  if (!filtros) return ''
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const comisionApi = {
  async porVendedor(filtros?: FiltrosComision) {
    return apiRequest<{
      data: ComisionVendedor[]
      resumen: ResumenComisiones
    }>(`/comisiones/por-vendedor${buildQuery(filtros as Record<string, unknown>)}`)
  },

  async detalleVendedor(userId: string, filtros?: Omit<FiltrosComision, 'user_id'>) {
    return apiRequest<{
      data: ComisionDetalle[]
      total_comision: number
    }>(`/comisiones/detalle/${userId}${buildQuery(filtros as Record<string, unknown>)}`)
  },

  async historialPagos(filtros?: FiltrosComision) {
    return apiRequest<{ data: ComisionPago[] }>(
      `/comisiones/pagos${buildQuery(filtros as Record<string, unknown>)}`
    )
  },

  async registrarPago(payload: RegistrarPagoPayload) {
    return apiRequest<{ data: ComisionPago }>(`/comisiones/pagos`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async eliminarPago(id: string) {
    return apiRequest<{ message: string }>(`/comisiones/pagos/${id}`, {
      method: 'DELETE',
    })
  },
}
