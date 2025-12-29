import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface Vendedor {
  id: number;
  dni: string;
  nombres: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: boolean;
  cumple: string | null; // ISO date string
  proveedor_id: number;
}

export interface Carro {
  id: number;
  placa: string;
  proveedor_id: number;
}

export interface Chofer {
  id: number;
  dni: string;
  name: string;
  licencia: string;
  proveedor_id: number;
}

export interface Proveedor {
  id: number;
  razon_social: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: boolean;
  vendedores?: Vendedor[];
  carros?: Carro[];
  choferes?: Chofer[];
}

// ============= REQUEST TYPES =============

export interface CreateVendedorRequest {
  dni: string;
  nombres: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  estado: boolean;
  cumple?: string | null; // ISO date string
}

export interface CreateCarroRequest {
  placa: string;
}

export interface CreateChoferRequest {
  dni: string;
  name: string;
  licencia: string;
}

export interface CreateProveedorRequest {
  razon_social: string;
  ruc: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  estado: boolean;
  vendedores?: CreateVendedorRequest[];
  carros?: CreateCarroRequest[];
  choferes?: CreateChoferRequest[];
}

export interface UpdateProveedorRequest extends Partial<CreateProveedorRequest> {}

export interface ProveedorFilters {
  search?: string;
  estado?: boolean | string;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface ProveedorResponse {
  data: Proveedor;
  message?: string;
}

export interface ProveedoresListResponse {
  data: Proveedor[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ============= API METHODS =============

export const proveedorApi = {
  /**
   * Listar proveedores con filtros
   */
  getAll: async (filters?: ProveedorFilters): Promise<ApiResponse<ProveedoresListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/proveedores?${queryString}` : '/proveedores';

    return apiRequest<ProveedoresListResponse>(url);
  },

  /**
   * Obtener proveedor por ID
   */
  getById: async (id: number): Promise<ApiResponse<ProveedorResponse>> => {
    return apiRequest<ProveedorResponse>(`/proveedores/${id}`);
  },

  /**
   * Crear proveedor
   */
  create: async (data: CreateProveedorRequest): Promise<ApiResponse<ProveedorResponse>> => {
    return apiRequest<ProveedorResponse>('/proveedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar proveedor
   */
  update: async (id: number, data: UpdateProveedorRequest): Promise<ApiResponse<ProveedorResponse>> => {
    return apiRequest<ProveedorResponse>(`/proveedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar proveedor
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/proveedores/${id}`, {
      method: 'DELETE',
    });
  },
};
