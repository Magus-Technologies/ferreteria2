/**
 * API de Almacenes
 */

import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';
import type {
  AlmacenesResponse,
  AlmacenResponse,
  CreateAlmacenInput,
  UpdateAlmacenInput,
} from '~/app/_types/almacen';

export const almacenesApi = {
  /**
   * Obtener todos los almacenes
   * GET /api/almacenes
   */
  async getAll(): Promise<ApiResponse<AlmacenesResponse>> {
    return apiRequest<AlmacenesResponse>('/almacenes');
  },

  /**
   * Obtener un almacén por ID
   * GET /api/almacenes/{id}
   */
  async getById(id: number): Promise<ApiResponse<AlmacenResponse>> {
    return apiRequest<AlmacenResponse>(`/almacenes/${id}`);
  },

  /**
   * Crear un nuevo almacén
   * POST /api/almacenes
   */
  async create(data: CreateAlmacenInput): Promise<ApiResponse<AlmacenResponse>> {
    return apiRequest<AlmacenResponse>('/almacenes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar un almacén
   * PUT /api/almacenes/{id}
   */
  async update(id: number, data: UpdateAlmacenInput): Promise<ApiResponse<AlmacenResponse>> {
    return apiRequest<AlmacenResponse>(`/almacenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar un almacén
   * DELETE /api/almacenes/{id}
   */
  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>(`/almacenes/${id}`, {
      method: 'DELETE',
    });
  },
};
