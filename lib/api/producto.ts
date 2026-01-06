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
   * Importar productos desde Excel
   * POST /api/productos/import
   */
  async import(data: {
    data: Array<Record<string, unknown>>;
  }): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    const response = await apiRequest<{
      data: Array<Record<string, unknown>>;
    }>(`/productos/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Extraer data.data
    if (response.data) {
      return {
        data: response.data.data,
      };
    }

    return response as ApiResponse<Array<Record<string, unknown>>>;
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
};
