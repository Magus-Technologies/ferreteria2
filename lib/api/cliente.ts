import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoCliente {
  PERSONA = 'p',
  EMPRESA = 'e',
}

// ============= INTERFACES =============

export interface Cliente {
  id: number;
  tipo_cliente: TipoCliente;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  razon_social: string | null;
  direccion: string | null;
  direccion_2: string | null;
  direccion_3: string | null;
  direccion_4: string | null;
  telefono: string | null;
  celular: string | null;
  horario_atencion: string | null;
  fecha_nacimiento: string | null;
  puntos: number;
  centimos: number;
  contacto_referencia: string | null;
  email: string | null;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============= REQUEST TYPES =============

export interface CreateClienteRequest {
  tipo_cliente: TipoCliente;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  razon_social?: string | null;
  direccion?: string | null;
  direccion_2?: string | null;
  direccion_3?: string | null;
  direccion_4?: string | null;
  telefono?: string | null;
  celular?: string | null;
  horario_atencion?: string | null;
  fecha_nacimiento?: string | null;
  contacto_referencia?: string | null;
  email?: string | null;
  estado?: boolean;
}

export interface UpdateClienteRequest extends Partial<CreateClienteRequest> {}

export interface ClienteFilters {
  search?: string;
  tipo_cliente?: TipoCliente;
  estado?: boolean;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface ClienteResponse {
  data: Cliente;
  message?: string;
}

export interface ClientesListResponse {
  data: Cliente[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ClienteEstadisticas {
  activos: number;
  inactivos: number;
  vip: number;
  frecuentes: number;
  problematicos: number;
  nuevos: number;
}

export interface ClienteEstadisticasResponse {
  data: ClienteEstadisticas;
}

// ============= API METHODS =============

export const clienteApi = {
  /**
   * Listar clientes con filtros
   */
  getAll: async (filters?: ClienteFilters): Promise<ApiResponse<ClientesListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/clientes?${queryString}` : '/clientes';

    return apiRequest<ClientesListResponse>(url);
  },

  /**
   * Obtener cliente por ID
   */
  getById: async (id: number): Promise<ApiResponse<ClienteResponse>> => {
    return apiRequest<ClienteResponse>(`/clientes/${id}`);
  },

  /**
   * Crear cliente
   */
  create: async (data: CreateClienteRequest): Promise<ApiResponse<ClienteResponse>> => {
    return apiRequest<ClienteResponse>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar cliente
   */
  update: async (id: number, data: UpdateClienteRequest): Promise<ApiResponse<ClienteResponse>> => {
    return apiRequest<ClienteResponse>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar cliente
   */
  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Verificar si un documento ya existe
   */
  checkDocumento: async (numero_documento: string, exclude_id?: number): Promise<ApiResponse<{ exists: boolean; message: string }>> => {
    return apiRequest<{ exists: boolean; message: string }>('/clientes/check-documento', {
      method: 'POST',
      body: JSON.stringify({
        numero_documento,
        exclude_id,
      }),
    });
  },

  /**
   * Obtener estadísticas de clientes
   */
  getEstadisticas: async (): Promise<ApiResponse<ClienteEstadisticasResponse>> => {
    return apiRequest<ClienteEstadisticasResponse>('/clientes/estadisticas');
  },
};
