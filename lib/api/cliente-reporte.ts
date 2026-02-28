import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface TopClienteItem {
  id: number;
  numero_documento: string;
  tipo_cliente: string;
  nombre: string;
  total_compras: number;
  num_ventas: number;
}

export interface ClienteResumen {
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  clientes_persona: number;
  clientes_empresa: number;
  clientes_con_deuda: number;
  total_por_cobrar: number;
  nuevos_30_dias: number;
}

export interface ClientePorCobrarItem {
  id: number;
  numero_documento: string;
  tipo_cliente: string;
  nombre: string;
  telefono: string | null;
  num_ventas_credito: number;
  total_credito: number;
  total_pagado: number;
  saldo_pendiente: number;
}

export interface ClienteListadoItem {
  id: number;
  numero_documento: string;
  tipo_cliente: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: boolean;
  total_ventas: number;
  total_compras: number;
}

export interface ClienteFrecuenteItem {
  id: number;
  numero_documento: string;
  tipo_cliente: string;
  nombre: string;
  num_ventas: number;
  total_compras: number;
}

export interface ClienteRecienteItem {
  id: number;
  numero_documento: string;
  tipo_cliente: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: boolean;
  primera_venta: string;
  total_ventas: number;
}

export interface ClienteReporteFilters {
  almacen_id?: number;
  desde?: string;
  hasta?: string;
  limit?: number;
  tipo_cliente?: string;
  estado?: string;
  dias?: number;
  per_page?: number;
  page?: number;
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

export const clienteReporteApi = {
  getTopClientes: async (filters?: ClienteReporteFilters): Promise<ApiResponse<{ data: TopClienteItem[] }>> => {
    return apiRequest<{ data: TopClienteItem[] }>(`/cliente-reportes/top-clientes${buildParams(filters)}`);
  },

  getResumen: async (filters?: ClienteReporteFilters): Promise<ApiResponse<{ data: ClienteResumen }>> => {
    return apiRequest<{ data: ClienteResumen }>(`/cliente-reportes/resumen${buildParams(filters)}`);
  },

  getPorCobrar: async (filters?: ClienteReporteFilters): Promise<ApiResponse<{
    data: ClientePorCobrarItem[];
    resumen: { total_credito: number; total_pagado: number; total_por_cobrar: number };
    total: number;
  }>> => {
    return apiRequest(`/cliente-reportes/por-cobrar${buildParams(filters)}`);
  },

  getListado: async (filters?: ClienteReporteFilters): Promise<ApiResponse<{
    data: ClienteListadoItem[];
    total: number;
  }>> => {
    return apiRequest(`/cliente-reportes/listado${buildParams(filters)}`);
  },

  getFrecuentes: async (filters?: ClienteReporteFilters): Promise<ApiResponse<{ data: ClienteFrecuenteItem[] }>> => {
    return apiRequest<{ data: ClienteFrecuenteItem[] }>(`/cliente-reportes/frecuentes${buildParams(filters)}`);
  },

  getRecientes: async (filters?: ClienteReporteFilters): Promise<ApiResponse<{
    data: ClienteRecienteItem[];
    total: number;
  }>> => {
    return apiRequest(`/cliente-reportes/recientes${buildParams(filters)}`);
  },
};
