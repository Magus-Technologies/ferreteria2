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
}

export const metodoDePagoApi = new MetodoDePagoApi();
