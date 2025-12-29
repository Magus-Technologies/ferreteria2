/**
 * API Client para Entregas de Productos (Laravel Backend)
 */

import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoEntrega {
  RECOJO_EN_TIENDA = 'rt',
  DESPACHO = 'de',
}

export enum TipoDespacho {
  INMEDIATO = 'in',
  PROGRAMADO = 'pr',
}

export enum EstadoEntrega {
  PENDIENTE = 'pe',
  EN_PROCESO = 'ep',
  ENTREGADO = 'en',
  CANCELADO = 'ca',
}

// ============= INTERFACES =============

export interface ProductoEntregadoRequest {
  unidad_derivada_venta_id: number;
  cantidad_entregada: number;
  ubicacion?: string;
}

export interface CreateEntregaProductoRequest {
  venta_id: string;
  tipo_entrega: TipoEntrega;
  tipo_despacho?: TipoDespacho;
  estado_entrega: EstadoEntrega;
  fecha_entrega: string;
  fecha_programada?: string;
  hora_inicio?: string; // Format: "HH:mm"
  hora_fin?: string; // Format: "HH:mm"
  direccion_entrega?: string;
  observaciones?: string;
  almacen_salida_id: number;
  chofer_id?: string;
  user_id: string;
  productos_entregados: ProductoEntregadoRequest[];
}

export interface UpdateEntregaProductoRequest {
  tipo_entrega?: TipoEntrega;
  tipo_despacho?: TipoDespacho;
  estado_entrega?: EstadoEntrega;
  fecha_entrega?: string;
  fecha_programada?: string;
  hora_inicio?: string;
  hora_fin?: string;
  direccion_entrega?: string;
  observaciones?: string;
  almacen_salida_id?: number;
  chofer_id?: string;
}

export interface EntregaProductoFilters {
  venta_id?: string;
  almacen_salida_id?: number;
  estado_entrega?: EstadoEntrega;
  fecha_desde?: string;
  fecha_hasta?: string;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface EntregaProductoResponse {
  data: any; // TODO: Definir interfaz completa de EntregaProducto
  message?: string;
}

export interface EntregasProductoListResponse {
  data: any[]; // TODO: Definir interfaz completa de EntregaProducto
  total: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
}

// ============= API METHODS =============

export const entregaProductoApi = {
  /**
   * Listar entregas de productos con filtros
   */
  async list(filters?: EntregaProductoFilters): Promise<ApiResponse<EntregasProductoListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/entregas-productos?${queryString}` : '/entregas-productos';

    return apiRequest<EntregasProductoListResponse>(url);
  },

  /**
   * Obtener una entrega de producto por ID
   */
  async getById(id: number): Promise<ApiResponse<EntregaProductoResponse>> {
    return apiRequest<EntregaProductoResponse>(`/entregas-productos/${id}`);
  },

  /**
   * Crear una nueva entrega de producto
   */
  async create(data: CreateEntregaProductoRequest): Promise<ApiResponse<EntregaProductoResponse>> {
    return apiRequest<EntregaProductoResponse>('/entregas-productos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar una entrega de producto (ej: cambiar estado)
   */
  async update(id: number, data: UpdateEntregaProductoRequest): Promise<ApiResponse<EntregaProductoResponse>> {
    return apiRequest<EntregaProductoResponse>(`/entregas-productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Anular una entrega de producto (revierte cantidad_pendiente)
   */
  async anular(id: number): Promise<ApiResponse<{ data: string; message: string }>> {
    return apiRequest<{ data: string; message: string }>(`/entregas-productos/${id}`, {
      method: 'DELETE',
    });
  },
};
