/**
 * API de Tipos de Ingreso/Salida
 */

import { apiRequest } from "../api";
import type { ApiResponse, PaginatedResponse } from "~/app/_types/api";

// ============= INTERFACES =============

export interface TipoIngresoSalida {
  id: number;
  name: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

// ============= REQUEST TYPES =============

export interface CreateTipoIngresoSalidaRequest {
  name: string;
  estado?: boolean;
}

export interface UpdateTipoIngresoSalidaRequest extends Partial<CreateTipoIngresoSalidaRequest> {}

export interface TipoIngresoSalidaFilters {
  search?: string;
  estado?: boolean;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface TipoIngresoSalidaResponse {
  data: TipoIngresoSalida;
  message?: string;
}

export interface TipoIngresoSalidaListResponse {
  data: TipoIngresoSalida[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ============= API METHODS =============

export const tipoIngresoSalidaApi = {
  /**
   * Listar tipos de ingreso/salida con filtros
   */
  getAll: async (
    filters?: TipoIngresoSalidaFilters,
  ): Promise<ApiResponse<TipoIngresoSalida[]>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/tipos-ingreso-salida?${queryString}`
      : "/tipos-ingreso-salida";

    return apiRequest<TipoIngresoSalida[]>(url);
  },

  /**
   * Obtener tipo de ingreso/salida por ID
   */
  getById: async (
    id: number,
  ): Promise<ApiResponse<TipoIngresoSalidaResponse>> => {
    return apiRequest<TipoIngresoSalidaResponse>(`/tipos-ingreso-salida/${id}`);
  },

  /**
   * Crear tipo de ingreso/salida
   */
  create: async (
    data: CreateTipoIngresoSalidaRequest,
  ): Promise<ApiResponse<TipoIngresoSalidaResponse>> => {
    return apiRequest<TipoIngresoSalidaResponse>("/tipos-ingreso-salida", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar tipo de ingreso/salida
   */
  update: async (
    id: number,
    data: UpdateTipoIngresoSalidaRequest,
  ): Promise<ApiResponse<TipoIngresoSalidaResponse>> => {
    return apiRequest<TipoIngresoSalidaResponse>(
      `/tipos-ingreso-salida/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Eliminar tipo de ingreso/salida
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/tipos-ingreso-salida/${id}`, {
      method: "DELETE",
    });
  },
};
