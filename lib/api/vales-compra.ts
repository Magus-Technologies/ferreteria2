import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';

// ============= INTERFACES =============

export interface Producto {
  id: number;
  name: string;
  cod_producto: string;
}

export interface Categoria {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
}

export type TipoPromocion =
  | 'SORTEO'
  | 'DESCUENTO_MISMA_COMPRA'
  | 'DESCUENTO_PROXIMA_COMPRA'
  | 'PRODUCTO_GRATIS';

export type Modalidad =
  | 'CANTIDAD_MINIMA'
  | 'POR_CATEGORIA'
  | 'POR_PRODUCTOS'
  | 'MIXTO';

export type DescuentoTipo = 'PORCENTAJE' | 'MONTO_FIJO';

export type EstadoVale = 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';

export interface ValeCompra {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo_promocion: TipoPromocion;
  modalidad: Modalidad;
  cantidad_minima: number;
  descuento_tipo: DescuentoTipo | null;
  descuento_valor: number | null;
  producto_gratis_id: number | null;
  cantidad_producto_gratis: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_validez_vale: string | null;
  usa_limite_por_cliente: boolean;
  limite_usos_cliente: number | null;
  usa_limite_stock: boolean;
  stock_disponible: number | null;
  aplica_precio_publico: boolean;
  aplica_precio_especial: boolean;
  aplica_precio_minimo: boolean;
  aplica_precio_ultimo: boolean;
  estado: EstadoVale;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;

  // Relaciones
  producto_gratis?: Producto | null;
  categorias?: Categoria[];
  productos?: Producto[];
  creador?: User | null;
  editor?: User | null;
  aplicaciones?: ValeCompraAplicado[];
  historial?: ValeCompraHistorial[];
}

export interface ValeCompraAplicado {
  id: number;
  vale_compra_id: number;
  venta_id: string;
  cliente_id: number | null;
  cantidad_productos: number;
  descuento_aplicado: number | null;
  descuento_tipo: DescuentoTipo | null;
  genera_vale_futuro: boolean;
  codigo_vale_generado: string | null;
  fecha_validez_generado: string | null;
  usado: boolean;
  fecha_uso: string | null;
  aplicado_por: number | null;
  fecha_aplicacion: string;

  // Relaciones
  vale_compra?: ValeCompra;
  venta?: { id: string; numero: string; fecha: string };
  cliente?: { id: number; nombres: string; apellidos: string; razon_social: string | null };
  aplicado_por_user?: User;
}

export type AccionHistorial =
  | 'CREADO'
  | 'MODIFICADO'
  | 'ACTIVADO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'APLICADO'
  | 'STOCK_AGOTADO';

export interface ValeCompraHistorial {
  id: number;
  vale_compra_id: number;
  accion: AccionHistorial;
  descripcion: string | null;
  datos_anteriores: Record<string, any> | null;
  datos_nuevos: Record<string, any> | null;
  user_id: number | null;
  fecha: string;

  // Relaciones
  usuario?: User;
}

export interface CreateValeCompraRequest {
  nombre: string;
  descripcion?: string | null;
  tipo_promocion: TipoPromocion;
  modalidad: Modalidad;
  cantidad_minima: number;
  descuento_tipo?: DescuentoTipo | null;
  descuento_valor?: number | null;
  producto_gratis_id?: number | null;
  cantidad_producto_gratis?: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  fecha_validez_vale?: string | null;
  usa_limite_por_cliente?: boolean;
  limite_usos_cliente?: number | null;
  usa_limite_stock?: boolean;
  stock_disponible?: number | null;
  aplica_precio_publico?: boolean;
  aplica_precio_especial?: boolean;
  aplica_precio_minimo?: boolean;
  aplica_precio_ultimo?: boolean;
  categoria_ids?: number[];
  producto_ids?: number[];
}

export interface UpdateValeCompraRequest extends Partial<CreateValeCompraRequest> {}

export interface ValesAplicablesRequest {
  cantidad_total: number;
  categoria_ids?: number[];
  producto_ids?: number[];
  cliente_id?: number;
}

export interface CambiarEstadoRequest {
  estado: EstadoVale;
}

export interface ValeCompraListResponse {
  data: ValeCompra[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ValeCompraAplicadoListResponse {
  data: ValeCompraAplicado[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ============= API FUNCTIONS =============

/**
 * Obtener lista de vales de compra
 */
export async function getValesCompra(params?: {
  page?: number;
  per_page?: number;
  estado?: EstadoVale;
  tipo_promocion?: TipoPromocion;
  modalidad?: Modalidad;
  vigentes?: boolean;
  activos?: boolean;
  search?: string;
}): Promise<ApiResponse<ValeCompraListResponse>> {
  return apiRequest<ValeCompraListResponse>('/vales-compra', {
    method: 'GET',
    params,
  });
}

/**
 * Obtener un vale de compra por ID
 */
export async function getValeCompra(id: number): Promise<ApiResponse<ValeCompra>> {
  return apiRequest<ValeCompra>(`/vales-compra/${id}`, {
    method: 'GET',
  });
}

/**
 * Crear un nuevo vale de compra
 */
export async function createValeCompra(
  data: CreateValeCompraRequest
): Promise<ApiResponse<{ message: string; data: ValeCompra }>> {
  return apiRequest<{ message: string; data: ValeCompra }>('/vales-compra', {
    method: 'POST',
    data,
  });
}

/**
 * Actualizar un vale de compra
 */
export async function updateValeCompra(
  id: number,
  data: UpdateValeCompraRequest
): Promise<ApiResponse<{ message: string; data: ValeCompra }>> {
  return apiRequest<{ message: string; data: ValeCompra }>(`/vales-compra/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * Eliminar un vale de compra
 */
export async function deleteValeCompra(
  id: number
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/vales-compra/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Cambiar estado de un vale
 */
export async function cambiarEstadoVale(
  id: number,
  data: CambiarEstadoRequest
): Promise<ApiResponse<{ message: string; data: ValeCompra }>> {
  return apiRequest<{ message: string; data: ValeCompra }>(
    `/vales-compra/${id}/cambiar-estado`,
    {
      method: 'POST',
      data,
    }
  );
}

/**
 * Obtener vales aplicables para una venta
 */
export async function getValesAplicables(
  data: ValesAplicablesRequest
): Promise<ApiResponse<{ data: ValeCompra[]; count: number }>> {
  return apiRequest<{ data: ValeCompra[]; count: number }>(
    '/vales-compra/vales-aplicables',
    {
      method: 'POST',
      data,
    }
  );
}

/**
 * Obtener historial de aplicaciones de un vale
 */
export async function getHistorialAplicaciones(
  id: number,
  page?: number
): Promise<ApiResponse<ValeCompraAplicadoListResponse>> {
  return apiRequest<ValeCompraAplicadoListResponse>(
    `/vales-compra/${id}/historial-aplicaciones`,
    {
      method: 'GET',
      params: { page },
    }
  );
}

/**
 * Obtener vales aplicados a una venta específica
 */
export async function getValesAplicadosVenta(
  ventaId: string
): Promise<ApiResponse<{ data: ValeCompraAplicado[]; count: number }>> {
  return apiRequest<{ data: ValeCompraAplicado[]; count: number }>(
    `/vales-compra/venta/${ventaId}/vales-aplicados`,
    {
      method: 'GET',
    }
  );
}

// ============= REACT QUERY HOOKS =============

export const valesCompraKeys = {
  all: ['vales-compra'] as const,
  lists: () => [...valesCompraKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) =>
    [...valesCompraKeys.lists(), filters] as const,
  details: () => [...valesCompraKeys.all, 'detail'] as const,
  detail: (id: number) => [...valesCompraKeys.details(), id] as const,
  historial: (id: number) => [...valesCompraKeys.detail(id), 'historial'] as const,
  aplicables: () => [...valesCompraKeys.all, 'aplicables'] as const,
  valesAplicadosVenta: (ventaId: string) => [...valesCompraKeys.all, 'venta', ventaId] as const,
};
