import { apiRequest, type ApiResponse } from '../api';

export enum EstadoClienteCalificacion {
  EXCELENTE = 'excelente',
  BUENO = 'bueno',
  REGULAR = 'regular',
  PROBLEMATICO = 'problematico',
}

export interface ClienteCalificacion {
  id: number;
  cliente_id: number;
  estado: EstadoClienteCalificacion;
  razon: string | null;
  observacion: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  createdBy?: {
    id: number;
    name: string;
  };
}

export interface CreateClienteCalificacionRequest {
  estado: EstadoClienteCalificacion;
  razon?: string | null;
  observacion?: string | null;
}

export type UpdateClienteCalificacionRequest = Partial<CreateClienteCalificacionRequest>;

export interface EstadoOption {
  value: EstadoClienteCalificacion;
  label: string;
  color: string;
}

export const clienteCalificacionApi = {
  /**
   * Listar calificaciones de un cliente
   */
  getByCliente: async (clienteId: number): Promise<ApiResponse<{ data: ClienteCalificacion[] }>> => {
    return apiRequest<{ data: ClienteCalificacion[] }>(`/clientes/${clienteId}/calificaciones`);
  },

  /**
   * Obtener última calificación de un cliente
   */
  getUltima: async (clienteId: number): Promise<ApiResponse<{ data: ClienteCalificacion | null }>> => {
    return apiRequest<{ data: ClienteCalificacion | null }>(`/clientes/${clienteId}/calificaciones/ultima`);
  },

  /**
   * Crear calificación para un cliente
   */
  create: async (clienteId: number, data: CreateClienteCalificacionRequest): Promise<ApiResponse<{ data: ClienteCalificacion; message: string }>> => {
    return apiRequest<{ data: ClienteCalificacion; message: string }>(`/clientes/${clienteId}/calificaciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar calificación
   */
  update: async (calificacionId: number, data: UpdateClienteCalificacionRequest): Promise<ApiResponse<{ data: ClienteCalificacion; message: string }>> => {
    return apiRequest<{ data: ClienteCalificacion; message: string }>(`/calificaciones/${calificacionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar calificación
   */
  delete: async (calificacionId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/calificaciones/${calificacionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtener estados disponibles
   */
  getEstados: async (): Promise<ApiResponse<{ data: EstadoOption[] }>> => {
    return apiRequest<{ data: EstadoOption[] }>('/calificaciones/estados');
  },
};
