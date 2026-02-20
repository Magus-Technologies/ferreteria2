/**
 * API de Productos (con relaciones de almacén)
 */

import { apiRequest } from '../api';
import type { ApiResponse, PaginatedResponse } from '~/app/_types/api';
import type {
  Producto,
  GetProductosParams,
  GetDetallePreciosParams,
  DetallePreciosResponse,
} from '~/app/_types/producto';

// ============================================
// TIPOS PARA COMPATIBILIDAD CON CÓDIGO LEGACY
// ============================================

export interface ProductoAlmacenUnidadDerivada {
  id: number
  producto_almacen_id: number
  unidad_derivada_id: number
  factor: number
  unidad_derivada: {
    id: number
    name: string
  }
}

export interface ProductoAlmacen {
  id: number
  producto_id: number
  almacen_id: number
  ubicacion_id: number | null
  stock_fraccion: number
  costo: number
  unidades_derivadas: ProductoAlmacenUnidadDerivada[]
  almacen: {
    id: number
    name: string
  }
  ubicacion: {
    id: number
    name: string
  } | null
  compras: Array<{
    id: number
    costo: number
    compra: {
      id: number
      fecha: string
      proveedor: {
        id: number
        razon_social: string
      }
    }
    unidades_derivadas: Array<{
      cantidad: number
      factor: number
      unidad_derivada_inmutable: {
        id: number
        name: string
      }
    }>
  }>
}

export interface getProductosResponseProps {
  id: number
  cod_producto: string
  cod_barra: string | null
  name: string
  descripcion: string | null
  unidades_contenidas: number
  marca_id: number
  categoria_id: number
  unidad_medida_id: number
  permitido: boolean
  producto_en_almacenes: ProductoAlmacen[]
  marca: {
    id: number
    name: string
  }
  categoria: {
    id: number
    name: string
  }
  unidad_medida: {
    id: number
    name: string
  }
}

// ============================================
// API CLIENT
// ============================================

export const productosApiV2 = {
  /**
   * Obtener productos de un almacén específico con todas sus relaciones
   * GET /api/productos?almacen_id={id}&...
   *
   * IMPORTANTE: almacen_id es requerido
   */
  async getAllByAlmacen(
    params: GetProductosParams
  ): Promise<ApiResponse<PaginatedResponse<Producto>>> {
    // Validar que almacen_id esté presente
    if (!params.almacen_id) {
      return {
        error: {
          message: 'El parámetro almacen_id es requerido',
          errors: {
            almacen_id: ['El campo almacen_id es requerido'],
          },
        },
      };
    }

    const queryParams = new URLSearchParams();

    // Agregar todos los parámetros
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiRequest<PaginatedResponse<Producto>>(
      `/productos?${queryParams.toString()}`
    );
  },

  /**
   * Obtener detalle de precios de un producto en un almacén específico
   * GET /api/productos/{id}/detalle-precios?almacen_id={id}
   */
  async getDetallePrecios(
    productoId: number,
    params: GetDetallePreciosParams
  ): Promise<ApiResponse<DetallePreciosResponse['data']>> {
    // Validar que almacen_id esté presente
    if (!params.almacen_id) {
      return {
        error: {
          message: 'El parámetro almacen_id es requerido',
          errors: {
            almacen_id: ['El campo almacen_id es requerido'],
          },
        },
      };
    }

    const queryParams = new URLSearchParams({
      almacen_id: String(params.almacen_id),
    });

    const response = await apiRequest<DetallePreciosResponse>(
      `/productos/${productoId}/detalle-precios?${queryParams.toString()}`
    );

    // Extraer data.data (Laravel devuelve { data: { producto, producto_almacen, ... } })
    if (response.data) {
      return {
        data: response.data.data,
      };
    }

    return response as ApiResponse<DetallePreciosResponse['data']>;
  },

  /**
   * Obtener un producto por ID (sin almacén específico)
   * GET /api/productos/{id}
   */
  async getById(id: number): Promise<ApiResponse<Producto>> {
    return apiRequest<Producto>(`/productos/${id}`);
  },

  /**
   * Crear un nuevo producto
   * POST /api/productos
   */
  async create(
    data: Record<string, unknown>
  ): Promise<ApiResponse<Producto>> {
    const response = await apiRequest<{ data: Producto }>(`/productos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Extraer data.data (Laravel devuelve { data: Producto })
    if (response.data) {
      return {
        data: response.data.data,
      };
    }

    return response as ApiResponse<Producto>;
  },

  /**
   * Actualizar un producto existente
   * PUT /api/productos/{id}
   */
  async update(
    id: number,
    data: Record<string, unknown>
  ): Promise<ApiResponse<Producto>> {
    const response = await apiRequest<{ data: Producto }>(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    // Extraer data.data (Laravel devuelve { data: Producto })
    if (response.data) {
      return {
        data: response.data.data,
      };
    }

    return response as ApiResponse<Producto>;
  },

  /**
   * Eliminar un producto
   * DELETE /api/productos/{id}
   */
  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>(`/productos/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Importar productos desde Excel (ASYNC con progress)
   * POST /api/productos/import
   * 
   * Retorna un import_id para hacer seguimiento del progreso
   */
  async import(data: {
    data: Array<Record<string, unknown>>;
  }): Promise<ApiResponse<{
    import_id: string;
    message: string;
    total_products: number;
  }>> {
    return apiRequest<{
      import_id: string;
      message: string;
      total_products: number;
    }>(`/productos/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Obtener progreso de importación
   * GET /api/productos/import-progress/{importId}
   */
  async getImportProgress(importId: string): Promise<ApiResponse<{
    status: 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    message: string;
    total_products: number;
    processed: number;
    imported: number;
    duplicates: number;
    errors: number;
    started_at: string;
    estimated_remaining?: number;
  }>> {
    return apiRequest(`/productos/import-progress/${importId}`);
  },

  /**
   * Obtener resultados finales de importación
   * GET /api/productos/import-results/{importId}
   */
  async getImportResults(importId: string): Promise<ApiResponse<{
    status: string;
    total_products: number;
    imported: number;
    duplicates: number;
    errors: number;
    duration_seconds: number;
    duplicate_codes: string[];
    error_details: Array<{ code: string; error: string }>;
  }>> {
    return apiRequest(`/productos/import-results/${importId}`);
  },

  /**
   * Cancelar importación en progreso
   * POST /api/productos/import-cancel/{importId}
   */
  async cancelImport(importId: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/productos/import-cancel/${importId}`, {
      method: 'POST',
    });
  },

  /**
   * Validar si un código de producto ya existe
   * GET /api/productos/validar-codigo?cod_producto=ABC123&exclude_id=123
   */
  async validarCodigo(cod_producto: string, excludeId?: number): Promise<ApiResponse<string | null>> {
    const queryParams = new URLSearchParams({ cod_producto });
    if (excludeId) {
      queryParams.append('exclude_id', excludeId.toString());
    }
    return apiRequest<string | null>(`/productos/validar-codigo?${queryParams.toString()}`);
  },

  /**
   * Obtener productos por vencer
   * GET /api/productos/vencimientos?almacen_id={id}&dias={id}
   */
  async getVencimientos(almacen_id: number, dias: number): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams({
      almacen_id: String(almacen_id),
      dias: String(dias)
    });

    const response = await apiRequest<{ data: any[] }>(`/productos/vencimientos?${queryParams.toString()}`);

    if (response.data) {
      return {
        data: response.data.data,
      };
    }

    return response as ApiResponse<any[]>;
  },
};
