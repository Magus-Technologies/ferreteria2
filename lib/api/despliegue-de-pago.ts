import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface DespliegueDePago {
  id: string;
  name: string;
  adicional: number;
  mostrar: boolean;
  metodo_de_pago_id: string;
}

export interface GetDesplieguesDePagoParams {
  mostrar?: boolean;
}

// Laravel wraps responses in { data: ... }
interface LaravelResponse<T> {
  data: T;
}

// ============= API FUNCTIONS =============

class DespliegueDePagoApi {
  /**
   * Get all despliegues de pago
   */
  async getAll(params?: GetDesplieguesDePagoParams): Promise<ApiResponse<LaravelResponse<DespliegueDePago[]>>> {
    const queryParams = new URLSearchParams();

    if (params?.mostrar !== undefined) {
      queryParams.append('mostrar', params.mostrar ? '1' : '0');
    }

    const queryString = queryParams.toString();
    const url = `/despliegues-de-pago${queryString ? `?${queryString}` : ''}`;

    return apiRequest<LaravelResponse<DespliegueDePago[]>>(url, {
      method: 'GET',
    });
  }

  /**
   * Get a single despliegue de pago by ID
   */
  async getById(id: string): Promise<ApiResponse<LaravelResponse<DespliegueDePago>>> {
    return apiRequest<LaravelResponse<DespliegueDePago>>(`/despliegues-de-pago/${id}`, {
      method: 'GET',
    });
  }
}

export const despliegueDePagoApi = new DespliegueDePagoApi();
