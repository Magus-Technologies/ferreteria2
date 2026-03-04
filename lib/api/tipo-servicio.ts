/**
 * API de Tipos de Servicio
 */

import { apiRequest } from "../api";
import type { ApiResponse } from "~/app/_types/api";

// ============= INTERFACES =============

export interface TipoServicio {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ============= REQUEST TYPES =============

export interface CreateTipoServicioRequest {
  nombre: string;
  descripcion?: string;
}

export interface UpdateTipoServicioRequest extends Partial<CreateTipoServicioRequest> {
  activo?: boolean;
}

export interface TipoServicioFilters {
  search?: string;
  activo?: boolean;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface TipoServicioResponse {
  data: TipoServicio;
  message?: string;
}

export interface TipoServicioListResponse {
  data: TipoServicio[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

// ============= API METHODS =============

export const tipoServicioApi = {
  /**
   * Listar tipos de servicio
   */
  getAll: async (
    filters?: TipoServicioFilters,
  ): Promise<ApiResponse<TipoServicio[]>> => {
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
      ? `/tipos-servicio?${queryString}`
      : "/tipos-servicio";

    return apiRequest<TipoServicio[]>(url);
  },

  /**
   * Obtener tipo de servicio por ID
   */
  getById: async (
    id: number,
  ): Promise<ApiResponse<TipoServicioResponse>> => {
    return apiRequest<TipoServicioResponse>(`/tipos-servicio/${id}`);
  },

  /**
   * Crear tipo de servicio
   */
  create: async (
    data: CreateTipoServicioRequest,
  ): Promise<ApiResponse<TipoServicioResponse>> => {
    return apiRequest<TipoServicioResponse>("/tipos-servicio", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar tipo de servicio
   */
  update: async (
    id: number,
    data: UpdateTipoServicioRequest,
  ): Promise<ApiResponse<TipoServicioResponse>> => {
    return apiRequest<TipoServicioResponse>(
      `/tipos-servicio/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Eliminar tipo de servicio
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/tipos-servicio/${id}`, {
      method: "DELETE",
    });
  },
};
