import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';

export interface CargoHierarchy {
  id: number;
  codigo: string;
  descripcion: string;
  parent: string | null;
  highlight: boolean;
  staff: boolean;
}

interface CargosResponse {
  data: CargoHierarchy[];
}

/**
 * API para obtener cargos con jerarquía
 */
export const cargosHierarchyApi = {
  /**
   * Obtener lista completa de cargos con jerarquía
   * GET /api/catalogos/cargos
   */
  async getAllCargos(): Promise<ApiResponse<CargosResponse>> {
    return apiRequest<CargosResponse>('/catalogos/cargos');
  },

  /**
   * Obtener cargos subordinados de un cargo específico
   * GET /api/catalogos/cargos?parent={codigo}
   */
  async getSubordinateCargos(parentCargo: string): Promise<ApiResponse<CargosResponse>> {
    return apiRequest<CargosResponse>(`/catalogos/cargos?parent=${encodeURIComponent(parentCargo)}`);
  },

  /**
   * Obtener el cargo padre de un cargo específico
   * GET /api/catalogos/cargos?only_parent_of={codigo}
   */
  async getParentCargo(cargo: string): Promise<ApiResponse<CargosResponse>> {
    return apiRequest<CargosResponse>(`/catalogos/cargos?only_parent_of=${encodeURIComponent(cargo)}`);
  },
};
