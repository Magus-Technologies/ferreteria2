import { apiRequest, type ApiResponse } from '../api';

export enum EstadoProveedorCalificacion {
  EXCELENTE = 'excelente',
  BUENO = 'bueno',
  REGULAR = 'regular',
  PROBLEMATICO = 'problematico',
}

export interface ProveedorCalificacion {
  id: number;
  proveedor_id: number;
  estado: EstadoProveedorCalificacion;
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

export interface CreateProveedorCalificacionRequest {
  estado: EstadoProveedorCalificacion;
  razon?: string | null;
  observacion?: string | null;
}

export type UpdateProveedorCalificacionRequest = Partial<CreateProveedorCalificacionRequest>;

export interface EstadoOption {
  value: EstadoProveedorCalificacion;
  label: string;
  color: string;
}

export const proveedorCalificacionApi = {
  /**
   * Listar calificaciones de un proveedor
   */
  getByProveedor: async (proveedorId: number): Promise<ApiResponse<{ data: ProveedorCalificacion[] }>> => {
    return apiRequest<{ data: ProveedorCalificacion[] }>(`/proveedores/${proveedorId}/calificaciones`);
  },

  /**
   * Obtener última calificación de un proveedor
   */
  getUltima: async (proveedorId: number): Promise<ApiResponse<{ data: ProveedorCalificacion | null }>> => {
    return apiRequest<{ data: ProveedorCalificacion | null }>(`/proveedores/${proveedorId}/calificaciones/ultima`);
  },

  /**
   * Crear calificación para un proveedor
   */
  create: async (proveedorId: number, data: CreateProveedorCalificacionRequest): Promise<ApiResponse<{ data: ProveedorCalificacion; message: string }>> => {
    return apiRequest<{ data: ProveedorCalificacion; message: string }>(`/proveedores/${proveedorId}/calificaciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar calificación
   */
  update: async (calificacionId: number, data: UpdateProveedorCalificacionRequest): Promise<ApiResponse<{ data: ProveedorCalificacion; message: string }>> => {
    return apiRequest<{ data: ProveedorCalificacion; message: string }>(`/calificaciones/${calificacionId}`, {
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
