/**
 * API de Ingresos/Salidas
 */

import { apiRequest } from "../api";
import type { ApiResponse, PaginatedResponse } from "~/app/_types/api";

// Tipo para el Ingreso/Salida básico (sin relaciones)
export interface IngresoSalida {
  id: number;
  tipo_documento: "Ingreso" | "Salida";
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

// Tipo para el Ingreso/Salida completo con relaciones (respuesta de Laravel)
export interface IngresoSalidaWithRelations {
  id: number;
  tipo_documento: "Ingreso" | "Salida";
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
  almacen: {
    id: number;
    name: string;
  };
  proveedor?: {
    id: number;
    razon_social: string;
  } | null;
  user: {
    id: string;
    name: string;
  };
  tipo_ingreso: {
    id: number;
    name: string;
  };
  productos_por_almacen: Array<{
    id: number;
    costo: number;
    producto_almacen: {
      id: number;
      producto: {
        id: number;
        name: string;
        cod_producto: string;
        marca: {
          id: number;
          name: string;
        } | null;
      };
    };
    unidades_derivadas: Array<{
      id: number;
      factor: number;
      cantidad: number;
      cantidad_restante: number;
      lote?: string | null;
      vencimiento?: string | null;
      unidad_derivada_inmutable: {
        id: number;
        name: string;
      };
    }>;
  }>;
}

// Tipo para crear Ingreso/Salida (POST)
export interface CreateIngresoSalidaParams {
  tipo_documento: "Ingreso" | "Salida";
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
  tipo_documento?: "Ingreso" | "Salida";
  desde?: string;
  hasta?: string;
  search_producto?: string;
  search_proveedor?: string;
  observacion?: string;
  tipo?: string;
  listar_no_anuladas?: boolean;
  per_page?: number;
  page?: number;
}

export const ingresosSalidasApi = {
  /**
   * Obtener lista de ingresos/salidas
   * GET /api/ingresos-salidas?almacen_id={id}&tipo_documento={tipo}
   */
  async getAll(
    params?: GetIngresosSalidasParams,
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
      `/ingresos-salidas?${queryParams.toString()}`,
    );
  },

  /**
   * Crear un nuevo ingreso/salida
   * POST /api/ingresos-salidas
   */
  async create(
    data: CreateIngresoSalidaParams,
  ): Promise<ApiResponse<IngresoSalidaWithRelations>> {
    return apiRequest<IngresoSalidaWithRelations>(`/ingresos-salidas`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
