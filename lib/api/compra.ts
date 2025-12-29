import { apiRequest, type ApiResponse } from '../api';
import { EstadoDeCompra, FormaDePago, TipoDocumento, TipoMoneda } from '@prisma/client';

// ============= INTERFACES =============

export interface UnidadDerivadaInmutableCompra {
  id: number;
  unidad_derivada_inmutable_id: number;
  producto_almacen_compra_id: number;
  factor: number;
  cantidad: number;
  cantidad_pendiente: number;
  lote: string | null;
  vencimiento: string | null; // ISO date string
  flete: number;
  bonificacion: boolean;
  unidad_derivada_inmutable?: {
    id: number;
    name: string;
  };
}

export interface ProductoAlmacenCompra {
  id: number;
  compra_id: string;
  costo: number;
  producto_almacen_id: number;
  producto_almacen?: {
    id: number;
    producto: {
      id: number;
      name: string;
      cod_producto: string;
      marca?: {
        id: number;
        name: string;
      };
      unidad_medida?: {
        id: number;
        name: string;
      };
    };
  };
  unidades_derivadas?: UnidadDerivadaInmutableCompra[];
}

export interface Compra {
  id: string;
  tipo_documento: TipoDocumento;
  serie: string | null;
  numero: number | null;
  descripcion: string | null;
  forma_de_pago: FormaDePago;
  tipo_moneda: TipoMoneda;
  tipo_de_cambio: number | null;
  percepcion: number | null;
  numero_dias: number | null;
  fecha_vencimiento: string | null; // ISO date string
  fecha: string; // ISO date string
  guia: string | null;
  estado_de_compra: EstadoDeCompra;
  egreso_dinero_id: string | null;
  despliegue_de_pago_id: number | null;
  user_id: string;
  almacen_id: number;
  proveedor_id: number;
  created_at: string;
  updated_at: string;
  proveedor?: {
    id: number;
    ruc: string;
    razon_social: string;
  };
  productos_por_almacen?: ProductoAlmacenCompra[];
  user?: {
    id: string;
    name: string;
  };
  recepciones_almacen_count?: number;
  pagos_de_compras_count?: number;
}

// ============= REQUEST TYPES =============

export interface CreateUnidadDerivadaInmutableCompraRequest {
  unidad_derivada_inmutable_id?: number; // Optional - can use unidad_derivada_inmutable_name instead
  unidad_derivada_inmutable_name?: string; // Optional - alternative to unidad_derivada_inmutable_id
  factor: number;
  cantidad: number;
  cantidad_pendiente: number;
  lote?: string | null;
  vencimiento?: string | null; // ISO date string
  flete?: number;
  bonificacion?: boolean;
}

export interface CreateProductoAlmacenCompraRequest {
  costo: number;
  producto_almacen_id?: number; // Optional - can use producto_id instead
  producto_id?: number; // Optional - alternative to producto_almacen_id
  unidades_derivadas: CreateUnidadDerivadaInmutableCompraRequest[];
}

export interface CreateCompraRequest {
  id?: string; // Optional - backend generates if not provided
  tipo_documento: string; // TipoDocumento enum as string
  serie?: string | null;
  numero?: number | null;
  descripcion?: string | null;
  forma_de_pago: string; // FormaDePago enum as string
  tipo_moneda: string; // TipoMoneda enum as string
  tipo_de_cambio?: number | null;
  percepcion?: number | null;
  numero_dias?: number | null;
  fecha_vencimiento?: string | null; // ISO date string
  fecha: string; // ISO date string
  guia?: string | null;
  estado_de_compra: string; // EstadoDeCompra enum as string
  egreso_dinero_id?: string | null;
  despliegue_de_pago_id?: number | null;
  user_id: string;
  almacen_id: number;
  proveedor_id: number;
  productos_por_almacen: CreateProductoAlmacenCompraRequest[];
}

export interface UpdateCompraRequest extends Partial<Omit<CreateCompraRequest, 'id'>> {}

export interface CompraFilters {
  almacen_id?: number;
  estado_de_compra?: string; // EstadoDeCompra enum value
  proveedor_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface CompraResponse {
  data: Compra;
  message?: string;
}

export interface ComprasListResponse {
  data: Compra[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total: number;
}

// ============= API METHODS =============

export const compraApi = {
  /**
   * Listar compras con filtros
   */
  getAll: async (filters?: CompraFilters): Promise<ApiResponse<ComprasListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/compras?${queryString}` : '/compras';

    return apiRequest<ComprasListResponse>(url);
  },

  /**
   * Obtener compra por ID
   */
  getById: async (id: string): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>(`/compras/${id}`);
  },

  /**
   * Crear compra
   */
  create: async (data: CreateCompraRequest): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>('/compras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar compra (editar)
   */
  update: async (id: string, data: UpdateCompraRequest): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>(`/compras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar compra (anular)
   */
  delete: async (id: string): Promise<ApiResponse<{ data: string }>> => {
    return apiRequest<{ data: string }>(`/compras/${id}`, {
      method: 'DELETE',
    });
  },
};
