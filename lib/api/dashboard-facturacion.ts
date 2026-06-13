import { apiRequest, type ApiResponse } from '../api'

// ============= TYPES =============

export interface DashboardFiltros {
  desde?: string
  hasta?: string
  almacen_id?: number
}

export interface LabelValue {
  label: string
  value: number
}

export interface ResumenDashboard {
  total_ventas: number
  num_ventas: number
  total_facturas: number
  total_boletas: number
  total_notas: number
}

export interface TipoDocumentoItem extends LabelValue {
  num_ventas: number
}

export interface CanalItem extends LabelValue {
  pedidos: number
}

// ============= API =============

const BASE = '/facturacion-electronica/dashboard'

const get = <T>(path: string, params: DashboardFiltros) =>
  apiRequest<{ data: T }>(`${BASE}/${path}`, { method: 'GET', params })

export const dashboardFacturacionApi = {
  resumen: (params: DashboardFiltros): Promise<ApiResponse<{ data: ResumenDashboard }>> =>
    get<ResumenDashboard>('resumen', params),

  ventasPorCategoria: (params: DashboardFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    get<LabelValue[]>('ventas-por-categoria', params),

  ventasPorMarca: (params: DashboardFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    get<LabelValue[]>('ventas-por-marca', params),

  ventasPorMetodoPago: (params: DashboardFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    get<LabelValue[]>('ventas-por-metodo-pago', params),

  productosMasVendidos: (params: DashboardFiltros): Promise<ApiResponse<{ data: LabelValue[] }>> =>
    get<LabelValue[]>('productos-mas-vendidos', params),

  ventasPorTipoDocumento: (params: DashboardFiltros): Promise<ApiResponse<{ data: TipoDocumentoItem[] }>> =>
    get<TipoDocumentoItem[]>('ventas-por-tipo-documento', params),

  ingresosPorCanal: (params: DashboardFiltros): Promise<ApiResponse<{ data: CanalItem[] }>> =>
    get<CanalItem[]>('ingresos-por-canal', params),
}

// ============= QUERY KEYS =============

export const dashboardFacturacionKeys = {
  all: ['dashboard-facturacion'] as const,
  resumen: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'resumen', f] as const,
  ventasPorCategoria: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'ventas-por-categoria', f] as const,
  ventasPorMarca: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'ventas-por-marca', f] as const,
  ventasPorMetodoPago: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'ventas-por-metodo-pago', f] as const,
  productosMasVendidos: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'productos-mas-vendidos', f] as const,
  ventasPorTipoDocumento: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'ventas-por-tipo-documento', f] as const,
  ingresosPorCanal: (f: DashboardFiltros) => [...dashboardFacturacionKeys.all, 'ingresos-por-canal', f] as const,
}
