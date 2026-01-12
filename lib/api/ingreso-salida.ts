/**
 * API de Ingresos/Salidas
 */

import { apiRequest } from '../api';
import type { ApiResponse, PaginatedResponse } from '~/app/_types/api';

// Tipo para el Ingreso/Salida completo (GET)
export interface IngresoSalida {
  id: number;
  tipo_documento: 'Ingreso' | 'Salida';
  serie: number;
  numero: number;
  fecha: string;
  descripcion: string | null;
  estado: boolean;
  almacen_id: number;
  tipo_ingreso_id: number;
  proveedor_id: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Tipo para crear Ingreso/Salida (POST)
export interface CreateIngresoSalidaParams {
  tipo_documento: 'Ingreso' | 'Salida';
  almacen_id: number;
  producto_id: number;
  unidad_derivada_id: number;
  cantidad: number;
  fecha?: string;
  tipo_ingreso_id: number;
  proveedor_id?: number;
  descripcion?: string;
  lote?: string;
  vencimiento?: string;
}

// Tipo para listar Ingresos/Salidas (GET)
export interface GetIngresosSalidasParams {
  almacen_id?: number;
  tipo_documento?: 'Ingreso' | 'Salida';
  per_page?: number;
  page?: number;
}

export const ingresosSalidasApi = {
  /**
   * Obtener lista de ingresos/salidas
   * GET /api/ingresos-salidas?almacen_id={id}&tipo_documento={tipo}
   */
  async getAll(
    params?: GetIngresosSalidasParams
  ): Promise<ApiResponse<PaginatedResponse<IngresoSalida>>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return apiRequest<PaginatedResponse<IngresoSalida>>(
      `/ingresos-salidas?${queryParams.toString()}`
    );
  },

  /**
   * Crear un nuevo ingreso/salida
   * POST /api/ingresos-salidas
   */
  async create(
    data: CreateIngresoSalidaParams
  ): Promise<ApiResponse<IngresoSalida>> {
    return apiRequest<IngresoSalida>(
      `/ingresos-salidas`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};
