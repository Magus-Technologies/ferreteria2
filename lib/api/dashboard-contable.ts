import { apiRequest, type ApiResponse } from '../api'

export interface ContableFiltros {
  desde?: string
  hasta?: string
  almacen_id?: number
}

export interface LabelValue {
  label: string
  value: number
}

export interface ResumenCardsContable {
  ganancias: number
  capital: number
  ventas_por_cobrar: number
  compras_por_pagar: number
  caja: number
}

const buildParams = (params: ContableFiltros) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v))
  })
  const s = qs.toString()
  return s ? `?${s}` : ''
}

const BASE = '/dashboard-contable'

export const dashboardContableApi = {
  porcentajeGanancias: (p: ContableFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    apiRequest<{ data: LabelValue[] }>(`${BASE}/porcentaje-ganancias${buildParams(p)}`),

  cierresConPerdida: (p: ContableFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    apiRequest<{ data: LabelValue[] }>(`${BASE}/cierres-con-perdida${buildParams(p)}`),

  clientesMorosos: (p: ContableFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    apiRequest<{ data: LabelValue[] }>(`${BASE}/clientes-morosos${buildParams(p)}`),

  gananciasPorRecomendacion: (p: ContableFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    apiRequest<{ data: LabelValue[] }>(`${BASE}/ganancias-por-recomendacion${buildParams(p)}`),

  resumenCards: (p: ContableFiltros): Promise<ApiResponse<{ data: ResumenCardsContable }>> =>
    apiRequest<{ data: ResumenCardsContable }>(`${BASE}/resumen-cards${buildParams(p)}`),
}
