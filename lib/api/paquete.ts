/**
 * API Client para Paquetes (Laravel Backend)
 *
 * Un paquete es un conjunto predefinido de productos que se pueden
 * agregar rápidamente a una venta.
 */

import { apiRequest, type ApiResponse } from "../api";

// ============= INTERFACES =============

/**
 * Producto dentro de un paquete
 */
export interface PaqueteProducto {
  id: number;
  paquete_id: number;
  producto_id: number;
  unidad_derivada_id: number;
  cantidad: number;
  precio_sugerido: number | null;
  created_at: string;
  updated_at: string;
  // Relaciones cargadas desde el backend
  producto?: {
    id: number;
    name: string;
    cod_producto: string;
    marca?: {
      id: number;
      name: string;
    } | null;
    // Unidades derivadas con precios del producto
    unidades_derivadas_con_precios?: Array<{
      unidad_derivada: {
        id: number;
        name: string;
      };
      precio_publico?: number | null;
    }>;
  };
  unidad_derivada?: {
    id: number;
    name: string;
  };
}

/**
 * Paquete completo con sus productos
 */
export interface Paquete {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  productos_count?: number; // Contador de productos (cuando se lista)
  productos: PaqueteProducto[];
}

/**
 * Producto para crear/actualizar paquete
 */
export interface PaqueteProductoRequest {
  producto_id: number;
  unidad_derivada_id: number;
  cantidad: number;
  precio_sugerido?: number | null;
}

/**
 * Request para crear un paquete
 */
export interface CreatePaqueteRequest {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  productos: PaqueteProductoRequest[];
}

/**
 * Request para actualizar un paquete
 */
export interface UpdatePaqueteRequest {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
  productos?: PaqueteProductoRequest[];
}

/**
 * Filtros para listar paquetes
 */
export interface PaqueteFilters {
  search?: string;
  activo?: boolean;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

/**
 * Respuesta al obtener un paquete
 */
export interface PaqueteResponse {
  data: Paquete;
  message?: string;
}

/**
 * Respuesta al listar paquetes
 */
export interface PaquetesListResponse {
  data: Paquete[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

/**
 * Respuesta al eliminar un paquete
 */
export interface DeletePaqueteResponse {
  data: string;
  message: string;
}

// ============= API METHODS =============

export const paqueteApi = {
  /**
   * Listar paquetes con filtros y paginación
   *
   * @param filters - Filtros opcionales (búsqueda, activo, paginación)
   * @returns Lista de paquetes con paginación
   *
   * @example
   * ```typescript
   * const response = await paqueteApi.list({ search: 'kit', activo: true });
   * if (response.data) {
   *   console.log(response.data.data); // Array de paquetes
   *   console.log(response.data.total); // Total de registros
   * }
   * ```
   */
  async list(
    filters?: PaqueteFilters,
  ): Promise<ApiResponse<PaquetesListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/paquetes?${queryString}` : "/paquetes";

    return apiRequest<PaquetesListResponse>(url);
  },

  /**
   * Obtener un paquete por ID con todos sus productos
   *
   * @param id - ID del paquete
   * @returns Paquete con productos y relaciones cargadas
   *
   * @example
   * ```typescript
   * const response = await paqueteApi.getById(1);
   * if (response.data) {
   *   console.log(response.data.data.nombre);
   *   console.log(response.data.data.productos); // Array de productos
   * }
   * ```
   */
  async getById(id: number): Promise<ApiResponse<PaqueteResponse>> {
    return apiRequest<PaqueteResponse>(`/paquetes/${id}`);
  },

  /**
   * Crear un nuevo paquete con sus productos
   *
   * @param data - Datos del paquete a crear
   * @returns Paquete creado con productos
   *
   * @example
   * ```typescript
   * const response = await paqueteApi.create({
   *   nombre: 'Kit Construcción',
   *   descripcion: 'Productos básicos',
   *   activo: true,
   *   productos: [
   *     {
   *       producto_id: 1,
   *       unidad_derivada_id: 5,
   *       cantidad: 10,
   *       precio_sugerido: 150.50
   *     }
   *   ]
   * });
   * ```
   */
  async create(
    data: CreatePaqueteRequest,
  ): Promise<ApiResponse<PaqueteResponse>> {
    return apiRequest<PaqueteResponse>("/paquetes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar un paquete existente
   *
   * @param id - ID del paquete a actualizar
   * @param data - Datos a actualizar (parciales)
   * @returns Paquete actualizado
   *
   * @example
   * ```typescript
   * // Actualizar solo el nombre
   * await paqueteApi.update(1, { nombre: 'Nuevo nombre' });
   *
   * // Actualizar productos (reemplaza todos)
   * await paqueteApi.update(1, {
   *   productos: [
   *     { producto_id: 1, unidad_derivada_id: 5, cantidad: 5 }
   *   ]
   * });
   * ```
   */
  async update(
    id: number,
    data: UpdatePaqueteRequest,
  ): Promise<ApiResponse<PaqueteResponse>> {
    return apiRequest<PaqueteResponse>(`/paquetes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar un paquete
   *
   * Los productos del paquete se eliminan automáticamente (CASCADE)
   *
   * @param id - ID del paquete a eliminar
   * @returns Mensaje de confirmación
   *
   * @example
   * ```typescript
   * const response = await paqueteApi.delete(1);
   * if (response.data) {
   *   console.log(response.data.message); // "Paquete eliminado exitosamente"
   * }
   * ```
   */
  async delete(id: number): Promise<ApiResponse<DeletePaqueteResponse>> {
    return apiRequest<DeletePaqueteResponse>(`/paquetes/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Buscar paquetes que contengan un producto específico
   *
   * @param productoId - ID del producto a buscar
   * @returns Lista de paquetes que contienen el producto
   *
   * @example
   * ```typescript
   * const response = await paqueteApi.getByProducto(123);
   * if (response.data) {
   *   console.log(`El producto está en ${response.data.data.length} paquetes`);
   * }
   * ```
   */
  async getByProducto(
    productoId: number,
  ): Promise<ApiResponse<PaquetesListResponse>> {
    return apiRequest<PaquetesListResponse>(
      `/paquetes/by-producto/${productoId}`,
    );
  },
};
