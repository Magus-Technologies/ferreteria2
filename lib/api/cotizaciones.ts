import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';

// ============= INTERFACES =============

export interface Cliente {
  id: number;
  tipo_cliente: 'p' | 'e'; // persona o empresa
  numero_documento: string;
  nombres: string;
  apellidos: string;
  razon_social: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
}

export interface User {
  id: string;
  name: string;
}

export interface Almacen {
  id: number;
  name: string;
}

export interface Marca {
  id: number;
  name: string;
}

export interface Producto {
  id: number;
  name: string;
  cod_producto: string | null;
  marca: Marca;
}

export interface ProductoAlmacen {
  id: number;
  producto_id: number;
  almacen_id: number;
  producto: Producto;
}

export interface UnidadDerivadaInmutable {
  id: number;
  name: string;
}

export interface UnidadDerivadaInmutableCotizacion {
  id: number;
  unidad_derivada_inmutable_id: number;
  producto_almacen_cotizacion_id: number;
  factor: number;
  cantidad: number;
  precio: number;
  recargo: number;
  descuento_tipo: '%' | 'm';
  descuento: number;
  unidad_derivada_inmutable: UnidadDerivadaInmutable;
}

export interface ProductoAlmacenCotizacion {
  id: number;
  cotizacion_id: string;
  producto_almacen_id: number;
  costo: number;
  producto_almacen: ProductoAlmacen;
  unidades_derivadas: UnidadDerivadaInmutableCotizacion[];
}

export interface Cotizacion {
  id: string;
  numero: string;
  fecha: string;
  fecha_proforma: string | null;
  vigencia_dias: number;
  fecha_vencimiento: string;
  tipo_moneda: 's' | 'd';
  tipo_de_cambio: number;
  observaciones: string | null;
  estado_cotizacion: 'pe' | 'co' | 've' | 'ca'; // pendiente, confirmado, vendido, cancelado
  reservar_stock: boolean;
  cliente_id: number | null;
  ruc_dni: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo_documento: string | null;
  user_id: string;
  vendedor: string | null;
  forma_de_pago: string | null;
  almacen_id: number;
  venta_id: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones
  cliente?: Cliente | null;
  user?: User;
  almacen?: Almacen;
  productos_por_almacen?: ProductoAlmacenCotizacion[];
}

export interface ProductoCotizacion {
  producto_id: number;
  unidad_derivada_id: number;
  unidad_derivada_factor: number;
  cantidad: number;
  precio_venta: number;
  recargo?: number;
  descuento_tipo?: '%' | 'm';
  descuento?: number;
}

export interface CreateCotizacionRequest {
  productos: ProductoCotizacion[];
  fecha: string; // 'YYYY-MM-DD HH:mm:ss'
  fecha_proforma?: string;
  tipo_moneda: 's' | 'd';
  tipo_de_cambio?: number;
  vigencia_dias?: number;
  fecha_vencimiento?: string;
  vendedor?: string;
  forma_de_pago?: string;
  ruc_dni?: string;
  cliente_id?: number;
  telefono?: string;
  direccion?: string;
  tipo_documento?: string;
  observaciones?: string;
  reservar_stock?: boolean;
  almacen_id: number;
}

interface GetCotizacionesParams {
  estado_cotizacion?: 'pe' | 'co' | 've' | 'ca';
  almacen_id?: number;
  cliente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

// ============= RESPONSES =============

interface CotizacionResponse {
  data: Cotizacion;
  message: string;
}

interface CotizacionesListResponse {
  data: Cotizacion[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ============= COTIZACIONES API =============

export const cotizacionesApi = {
  /**
   * Obtener el siguiente número de cotización disponible
   */
  async getSiguienteNumero(): Promise<ApiResponse<{ numero: string }>> {
    return apiRequest<{ numero: string }>('/cotizaciones/siguiente-numero/preview');
  },

  /**
   * Obtener lista de cotizaciones con filtros
   */
  async getAll(params?: GetCotizacionesParams): Promise<ApiResponse<CotizacionesListResponse>> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    return apiRequest<CotizacionesListResponse>(`/cotizaciones${queryString}`);
  },

  /**
   * Obtener una cotización por ID
   */
  async getById(id: string): Promise<ApiResponse<CotizacionResponse>> {
    return apiRequest<CotizacionResponse>(`/cotizaciones/${id}`);
  },

  /**
   * Crear una nueva cotización
   */
  async create(data: CreateCotizacionRequest): Promise<ApiResponse<CotizacionResponse>> {
    return apiRequest<CotizacionResponse>('/cotizaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar una cotización
   */
  async update(id: string, data: Partial<CreateCotizacionRequest>): Promise<ApiResponse<CotizacionResponse>> {
    return apiRequest<CotizacionResponse>(`/cotizaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Cancelar una cotización (devuelve stock si estaba reservado)
   */
  async cancel(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>(`/cotizaciones/${id}`, {
      method: 'DELETE',
    });
  },
};
