import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';

// ============= INTERFACES =============
// Catálogos generales (estados civiles, roles, tipos de documento, etc.)
// NO confundir con lib/api/catalogos.ts que maneja almacenes, marcas, categorías, etc.

export interface EstadoCivil {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
}

export interface Role {
  id: number;
  name: string;
  descripcion: string;
}

export interface TipoDocumento {
  codigo: string;
  descripcion: string;
}

export interface Genero {
  codigo: string;
  descripcion: string;
}

export interface RolSistema {
  codigo: string;
  descripcion: string;
  role_id: number;
}

export interface Cargo {
  codigo: string;
  descripcion: string;
}

// ============= RESPONSES =============

interface EstadosCivilesResponse {
  data: EstadoCivil[];
}

interface RolesResponse {
  data: Role[];
}

interface TiposDocumentoResponse {
  data: TipoDocumento[];
}

interface GenerosResponse {
  data: Genero[];
}

interface RolesSistemaResponse {
  data: RolSistema[];
}

interface CargosResponse {
  data: Cargo[];
}

// ============= CATALOGOS GENERALES API =============

export const catalogosGeneralesApi = {
  /**
   * Obtener lista de estados civiles
   * GET /api/catalogos/estados-civiles
   */
  async getEstadosCiviles(): Promise<ApiResponse<EstadosCivilesResponse>> {
    return apiRequest<EstadosCivilesResponse>('/catalogos/estados-civiles');
  },

  /**
   * Obtener lista de roles
   * GET /api/roles
   */
  async getRoles(): Promise<ApiResponse<RolesResponse>> {
    return apiRequest<RolesResponse>('/roles');
  },

  /**
   * Obtener lista de tipos de documento
   * GET /api/catalogos/tipos-documento
   */
  async getTiposDocumento(): Promise<ApiResponse<TiposDocumentoResponse>> {
    return apiRequest<TiposDocumentoResponse>('/catalogos/tipos-documento');
  },

  /**
   * Obtener lista de géneros
   * GET /api/catalogos/generos
   */
  async getGeneros(): Promise<ApiResponse<GenerosResponse>> {
    return apiRequest<GenerosResponse>('/catalogos/generos');
  },

  /**
   * Obtener lista de roles del sistema (para formularios)
   * GET /api/catalogos/roles-sistema
   */
  async getRolesSistema(): Promise<ApiResponse<RolesSistemaResponse>> {
    return apiRequest<RolesSistemaResponse>('/catalogos/roles-sistema');
  },

  /**
   * Obtener lista de cargos/ocupaciones
   * GET /api/catalogos/cargos
   */
  async getCargos(): Promise<ApiResponse<CargosResponse>> {
    return apiRequest<CargosResponse>('/catalogos/cargos');
  },
};
