import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface TopProductoItem {
  id: number;
  cod_producto: string;
  producto: string;
  marca: string | null;
  importe: number;
}

export interface InventarioResumen {
  total_productos: number;
  total_stock: number;
  valorizacion_total: number;
  valorizacion_venta: number;
  productos_sin_stock: number;
  productos_stock_bajo: number;
}

export interface StockValorizadoItem {
  id: number;
  cod_producto: string;
  producto: string;
  marca: string | null;
  categoria: string | null;
  unidad_medida: string | null;
  stock: number;
  costo_unitario: number;
  valor_total: number;
}

export interface StockValorizadoResponse {
  data: StockValorizadoItem[];
  resumen: {
    total_stock: number;
    total_valorizado: number;
  };
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StockBajoItem {
  id: number;
  cod_producto: string;
  producto: string;
  marca: string | null;
  categoria: string | null;
  stock: number;
  stock_min: number;
  stock_max: number;
  costo_unitario: number;
}

export interface CantidadVendidaItem {
  id: number;
  cod_producto: string;
  producto: string;
  marca: string | null;
  unidad_medida: string | null;
  cantidad_vendida: number;
  importe_venta: number;
  num_ventas: number;
}

export interface DemandaCategoriaItem {
  label: string;
  value: number;
}

export interface ProductosRotados {
  rotados: number;
  total: number;
}

export interface InventarioPorAnio {
  inicial: number;
  final: number;
}

export interface InventarioReporteFilters {
  almacen_id?: number;
  desde?: string;
  hasta?: string;
  tipo?: 'ventas' | 'utilidad' | 'recurrencia';
  limit?: number;
  categoria_id?: number;
  marca_id?: number;
  con_stock?: boolean;
  per_page?: number;
  page?: number;
  anio?: number;
  search?: string;
}

// ============= HELPERS =============

function buildParams(filters?: Record<string, any>): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ============= API METHODS =============

export const inventarioReporteApi = {
  getTopProductos: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: TopProductoItem[] }>> => {
    return apiRequest<{ data: TopProductoItem[] }>(`/inventario-reportes/top-productos${buildParams(filters)}`);
  },

  getResumen: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: InventarioResumen }>> => {
    return apiRequest<{ data: InventarioResumen }>(`/inventario-reportes/resumen${buildParams(filters)}`);
  },

  getStockValorizado: async (filters?: InventarioReporteFilters): Promise<ApiResponse<StockValorizadoResponse>> => {
    return apiRequest<StockValorizadoResponse>(`/inventario-reportes/stock-valorizado${buildParams(filters)}`);
  },

  getStockBajo: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: StockBajoItem[]; total: number }>> => {
    return apiRequest<{ data: StockBajoItem[]; total: number }>(`/inventario-reportes/stock-bajo${buildParams(filters)}`);
  },

  getCantidadesVendidas: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: CantidadVendidaItem[]; total: number }>> => {
    return apiRequest<{ data: CantidadVendidaItem[]; total: number }>(`/inventario-reportes/cantidades-vendidas${buildParams(filters)}`);
  },

  getDemandaPorCategoria: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: DemandaCategoriaItem[] }>> => {
    return apiRequest<{ data: DemandaCategoriaItem[] }>(`/inventario-reportes/demanda-por-categoria${buildParams(filters)}`);
  },

  getCostoAjuste: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: { costo_ajuste: number } }>> => {
    return apiRequest<{ data: { costo_ajuste: number } }>(`/inventario-reportes/costo-ajuste${buildParams(filters)}`);
  },

  getProductosRotados: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: ProductosRotados }>> => {
    return apiRequest<{ data: ProductosRotados }>(`/inventario-reportes/productos-rotados${buildParams(filters)}`);
  },

  getInventarioPorAnio: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: InventarioPorAnio }>> => {
    return apiRequest<{ data: InventarioPorAnio }>(`/inventario-reportes/inventario-por-anio${buildParams(filters)}`);
  },

  getProductosSinRotar: async (filters?: InventarioReporteFilters): Promise<ApiResponse<{ data: StockBajoItem[]; total: number }>> => {
    return apiRequest<{ data: StockBajoItem[]; total: number }>(`/inventario-reportes/productos-sin-rotar${buildParams(filters)}`);
  },
};
