/**
 * API Client para Servicios (Laravel Backend)
 *
 * Un servicio es un ítem no-inventariable (DELIVERY, FLETE, DESCUENTO, etc.)
 * que se puede agregar a una venta.
 */

import { apiRequest, type ApiResponse } from "../api";

// ============= INTERFACES =============

export interface Servicio {
  id: number;
  nombre: string;
  precio: number;
  codigo_sunat: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicioVenta {
  id: number;
  venta_id: string;
  servicio_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  referencia: string | null;
  created_at: string;
  updated_at: string;
  servicio?: Servicio;
}

export interface CreateServicioRequest {
  nombre: string;
  precio: number;
  codigo_sunat?: string | null;
}

export interface UpdateServicioRequest {
  nombre?: string;
  precio?: number;
  codigo_sunat?: string | null;
  activo?: boolean;
}

export interface ServicioFilters {
  search?: string;
  activo?: boolean;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface ServicioResponse {
  data: Servicio;
  message?: string;
}

export interface ServiciosListResponse {
  data: Servicio[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

// ============= API METHODS =============

export const servicioApi = {
  async list(
    filters?: ServicioFilters,
  ): Promise<ApiResponse<ServiciosListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/servicios?${queryString}` : "/servicios";

    return apiRequest<ServiciosListResponse>(url);
  },

  async getById(id: number): Promise<ApiResponse<ServicioResponse>> {
    return apiRequest<ServicioResponse>(`/servicios/${id}`);
  },

  async create(
    data: CreateServicioRequest,
  ): Promise<ApiResponse<ServicioResponse>> {
    return apiRequest<ServicioResponse>("/servicios", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: UpdateServicioRequest,
  ): Promise<ApiResponse<ServicioResponse>> {
    return apiRequest<ServicioResponse>(`/servicios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<{ data: string; message: string }>> {
    return apiRequest<{ data: string; message: string }>(`/servicios/${id}`, {
      method: "DELETE",
    });
  },
};
