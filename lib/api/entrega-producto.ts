/**
 * API Client para Entregas de Productos (Laravel Backend)
 */

import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoEntrega {
  RECOJO_EN_TIENDA = 'rt', // Recojo en Tienda
  DESPACHO = 'de',         // Despacho a Domicilio
  PARCIAL = 'pa',          // Despacho Parcial (parte en tienda, parte a domicilio)
}

export enum TipoDespacho {
  INMEDIATO = 'in',   // Inmediato (en tienda)
  PROGRAMADO = 'pr',  // Programado (a domicilio)
}

export enum EstadoEntrega {
  PENDIENTE = 'pe',   // Pendiente
  EN_CAMINO = 'ec',   // En Camino
  ENTREGADO = 'en',   // Entregado
  CANCELADO = 'ca',   // Cancelado
}

export enum QuienEntrega {
  VENDEDOR = 'vendedor',
  ALMACEN = 'almacen',
  CHOFER = 'chofer',
}

export enum TipoPedido {
  INTERNO = 'interno',
  EXTERNO = 'externo',
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
  referencia_entrega?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  almacen_salida_id: number;
  chofer_id?: string;
  quien_entrega?: QuienEntrega;
  user_id: string;
  tipo_pedido?: TipoPedido;
  cargo_destino?: string;
  vehiculo_id?: number;
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
  referencia_entrega?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  almacen_salida_id?: number;
  chofer_id?: string;
  quien_entrega?: QuienEntrega;
  vehiculo_id?: number;
  tipo_pedido?: TipoPedido;
  cargo_destino?: string;
}

export interface EntregaProductoFilters {
  venta_id?: string;
  almacen_salida_id?: number;
  chofer_id?: string;
  vehiculo_id?: number;
  estado_entrega?: EstadoEntrega | string;
  // Los enums TipoDespacho y TipoEntrega ya cubren estos valores literales —
  // antes había una unión redundante `TipoDespacho | 'in' | 'pr'`.
  tipo_despacho?: TipoDespacho;
  tipo_entrega?: TipoEntrega;
  search?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  per_page?: number;
  page?: number;
  solo_programadas?: boolean;
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
   * Aceptar un pedido externo (first-come-first-served)
   */
  async aceptar(id: number): Promise<ApiResponse<EntregaProductoResponse>> {
    return apiRequest<EntregaProductoResponse>(`/entregas-productos/${id}/aceptar`, {
      method: 'POST',
    });
  },

  /**
   * Anular una entrega que se marcó como entregada por error.
   * Vuelve `estado_entrega` a `'pe'` (pendiente) y registra el motivo
   * para auditoría. NO toca stock ni el comprobante SUNAT — la venta
   * sigue válida, solo se deshace la marca física de entregado.
   *
   * Si después se vuelve a marcar como `'en'`, los campos de anulación
   * se limpian automáticamente (lo hace el backend en el `update()`).
   */
  async anular(id: number, motivo: string): Promise<ApiResponse<EntregaProductoResponse>> {
    return apiRequest<EntregaProductoResponse>(`/entregas-productos/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },
};
