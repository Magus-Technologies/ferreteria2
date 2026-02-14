import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface MetodoDePago {
  id: string;
  name: string;
  cuenta_bancaria?: string;
  nombre_titular?: string;
  monto: number;
  monto_inicial: number;
  subcaja_id?: string;
  activo: boolean;
  despliegues_de_pagos?: any[]; // Métodos específicos del banco
}

export interface MetodoPagoAgrupado {
  banco_id: string;
  banco_nombre: string;
  cuenta_bancaria?: string;
  tipos_pago: {
    id: string;
    nombre: string;
    adicional: string;
  }[];
}

// Laravel wraps responses in { data: ... }
interface LaravelResponse<T> {
  data: T;
}

// ============= API FUNCTIONS =============

class MetodoDePagoApi {
  /**
   * Get métodos de pago agrupados por banco
   */
  async getAgrupadosPorBanco(): Promise<ApiResponse<{ success: boolean; data: MetodoPagoAgrupado[] }>> {
    return apiRequest<{ success: boolean; data: MetodoPagoAgrupado[] }>('/metodos-de-pago/agrupados-por-banco', {
      method: 'GET',
    });
  }

  /**
   * Get all bancos/métodos de pago principales
   */
  async getAll(): Promise<ApiResponse<LaravelResponse<MetodoDePago[]>>> {
    return apiRequest<LaravelResponse<MetodoDePago[]>>('/metodos-de-pago', {
      method: 'GET',
    });
  }

  /**
   * Get a single banco by ID
   */
  async getById(id: string): Promise<ApiResponse<LaravelResponse<MetodoDePago>>> {
    return apiRequest<LaravelResponse<MetodoDePago>>(`/metodos-de-pago/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new banco
   */
  async create(data: {
    name: string;
    cuenta_bancaria?: string;
    nombre_titular?: string;
    monto_inicial?: number;
    subcaja_id?: string;
  }): Promise<ApiResponse<LaravelResponse<MetodoDePago>>> {
    return apiRequest<LaravelResponse<MetodoDePago>>('/metodos-de-pago', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a banco
   */
  async update(id: string, data: {
    name: string;
    cuenta_bancaria?: string;
    nombre_titular?: string;
  }): Promise<ApiResponse<LaravelResponse<MetodoDePago>>> {
    return apiRequest<LaravelResponse<MetodoDePago>>(`/metodos-de-pago/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a banco
   */
  async delete(id: string): Promise<ApiResponse<any>> {
    return apiRequest(`/metodos-de-pago/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get resumen detallado de un banco con filtros
   */
  async getResumenDetallado(
    id: string,
    filters?: {
      fecha_inicio?: string;
      fecha_fin?: string;
      vendedor_id?: string;
      sub_caja_id?: string;
      despliegue_pago_id?: string;
    }
  ): Promise<ApiResponse<{ success: boolean; data: any }>> {
    const params = new URLSearchParams();
    if (filters?.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
    if (filters?.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
    if (filters?.vendedor_id) params.append('vendedor_id', filters.vendedor_id);
    if (filters?.sub_caja_id) params.append('sub_caja_id', filters.sub_caja_id);
    if (filters?.despliegue_pago_id) params.append('despliegue_pago_id', filters.despliegue_pago_id);

    const queryString = params.toString();
    const url = `/metodos-de-pago/${id}/resumen-detallado${queryString ? `?${queryString}` : ''}`;

    return apiRequest<{ success: boolean; data: any }>(url, {
      method: 'GET',
    });
  }
}

export const metodoDePagoApi = new MetodoDePagoApi();
