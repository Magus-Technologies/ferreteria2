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

export enum EstadoEventoEntrega {
  PROGRAMADO = 'pr',
  EN_CAMINO = 'ec',
  ENTREGADO = 'en',
  ANULADO = 'an',
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
  grupo_entrega_id?: number;
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
  grupo_entrega_id?: number;
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
  productos_entregados?: ProductoEntregadoRequest[];
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

export interface DetalleEntregaEventoRequest {
  detalle_entrega_producto_id: number;
  cantidad: number;
  ubicacion?: string;
}

export interface CreateEntregaEventoRequest {
  estado: EstadoEventoEntrega;
  fecha_programada?: string;
  fecha_ejecutada?: string;
  hora_inicio?: string;
  hora_fin?: string;
  chofer_id?: string;
  vehiculo_id?: number;
  quien_entrega?: QuienEntrega;
  tipo_pedido?: TipoPedido;
  cargo_destino?: string;
  direccion_entrega?: string;
  referencia_entrega?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  detalles: DetalleEntregaEventoRequest[];
}

export interface UpdateEntregaEventoRequest {
  estado?: EstadoEventoEntrega;
  fecha_programada?: string;
  fecha_ejecutada?: string;
  hora_inicio?: string;
  hora_fin?: string;
  chofer_id?: string;
  vehiculo_id?: number;
  quien_entrega?: QuienEntrega;
  tipo_pedido?: TipoPedido;
  cargo_destino?: string;
  direccion_entrega?: string;
  referencia_entrega?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  detalles?: DetalleEntregaEventoRequest[];
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

export interface EntregaEventoResponse {
  data: any;
  message?: string;
}

export interface EntregaEventoListResponse {
  data: any[];
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

  async listEventos(entregaId: number): Promise<ApiResponse<EntregaEventoListResponse>> {
    return apiRequest<EntregaEventoListResponse>(`/entregas-productos/${entregaId}/eventos`);
  },

  async createEvento(
    entregaId: number,
    data: CreateEntregaEventoRequest,
  ): Promise<ApiResponse<EntregaEventoResponse>> {
    return apiRequest<EntregaEventoResponse>(`/entregas-productos/${entregaId}/eventos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvento(
    entregaId: number,
    eventoId: number,
    data: UpdateEntregaEventoRequest,
  ): Promise<ApiResponse<EntregaEventoResponse>> {
    return apiRequest<EntregaEventoResponse>(`/entregas-productos/${entregaId}/eventos/${eventoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async anularEvento(
    entregaId: number,
    eventoId: number,
    motivo: string,
  ): Promise<ApiResponse<EntregaEventoResponse>> {
    return apiRequest<EntregaEventoResponse>(`/entregas-productos/${entregaId}/eventos/${eventoId}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  async deleteEvento(
    entregaId: number,
    eventoId: number,
  ): Promise<ApiResponse<{ data: 'ok'; message?: string }>> {
    return apiRequest<{ data: 'ok'; message?: string }>(`/entregas-productos/${entregaId}/eventos/${eventoId}`, {
      method: 'DELETE',
    });
  },
};
