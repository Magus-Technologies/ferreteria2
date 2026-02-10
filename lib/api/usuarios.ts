import { apiRequest } from '../api';
import type { ApiResponse } from '~/app/_types/api';

// ============= INTERFACES =============

export interface Empresa {
  id: number;
  ruc: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface Usuario {
  id: string;
  name: string;
  email: string;
  password?: string;
  efectivo: number;
  empresa_id: number;
  image: string | null;
  emailVerified: string | null;
  
  // Información personal
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE' | null;
  numero_documento: string | null;
  codigo: string | null;
  telefono: string | null;
  celular: string | null;
  genero: 'M' | 'F' | 'O' | null;
  estado_civil: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'CONVIVIENTE' | null;
  email_corporativo: string | null;
  
  // Dirección
  direccion_linea1: string | null;
  direccion_linea2: string | null;
  ciudad: string | null;
  nacionalidad: string | null;
  fecha_nacimiento: string | null;
  
  // Información de Contrato
  cargo: string | null;
  fecha_inicio: string | null;
  fecha_baja: string | null;
  vacaciones_dias: number;
  sueldo_boleta: number | null;
  rol_sistema: 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO' | 'CONTADOR' | 'DESPACHADOR' | 'CONDUCTOR' | null;
  
  // Estado
  estado: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  // Relaciones
  empresa?: Empresa;
}

export interface CreateUsuarioRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  supervisor_password?: string;
  supervisor_password_confirmation?: string;
  empresa_id: number;
  
  // Información personal (opcionales)
  tipo_documento?: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  numero_documento?: string;
  codigo?: string;
  telefono?: string;
  celular?: string;
  genero?: 'M' | 'F' | 'O';
  estado_civil?: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'CONVIVIENTE';
  email_corporativo?: string;
  
  // Dirección (opcionales)
  direccion_linea1?: string;
  direccion_linea2?: string;
  ciudad?: string;
  nacionalidad?: string;
  fecha_nacimiento?: string;
  
  // Información de Contrato (opcionales)
  cargo?: string;
  fecha_inicio?: string;
  fecha_baja?: string;
  vacaciones_dias?: number;
  sueldo_boleta?: number;
  rol_sistema?: 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO' | 'CONTADOR' | 'DESPACHADOR' | 'CONDUCTOR';
  
  // Otros
  efectivo?: number;
  estado?: boolean;
}

export interface UpdateUsuarioRequest {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  supervisor_password?: string;
  supervisor_password_confirmation?: string;
  empresa_id?: number;
  
  // Información personal
  tipo_documento?: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  numero_documento?: string;
  codigo?: string;
  telefono?: string;
  celular?: string;
  genero?: 'M' | 'F' | 'O';
  estado_civil?: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'CONVIVIENTE';
  email_corporativo?: string;
  
  // Dirección
  direccion_linea1?: string;
  direccion_linea2?: string;
  ciudad?: string;
  nacionalidad?: string;
  fecha_nacimiento?: string;
  
  // Información de Contrato
  cargo?: string;
  fecha_inicio?: string;
  fecha_baja?: string;
  vacaciones_dias?: number;
  sueldo_boleta?: number;
  rol_sistema?: 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO' | 'CONTADOR' | 'DESPACHADOR' | 'CONDUCTOR';
  
  // Otros
  efectivo?: number;
  estado?: boolean;
}

interface GetUsuariosParams {
  search?: string;
  empresa_id?: number;
  estado?: boolean;
  rol_sistema?: 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO' | 'CONTADOR' | 'DESPACHADOR' | 'CONDUCTOR';
}

// ============= RESPONSES =============

interface UsuarioResponse {
  data: Usuario;
  message: string;
}

interface UsuariosListResponse {
  data: Usuario[];
}

// ============= USUARIOS API =============

export const usuariosApi = {
  /**
   * Obtener lista de usuarios con filtros
   * GET /api/usuarios
   */
  async getAll(params?: GetUsuariosParams): Promise<ApiResponse<UsuariosListResponse>> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    return apiRequest<UsuariosListResponse>(`/usuarios${queryString}`);
  },

  /**
   * Obtener un usuario por ID
   * GET /api/usuarios/{id}
   */
  async getById(id: string): Promise<ApiResponse<UsuarioResponse>> {
    return apiRequest<UsuarioResponse>(`/usuarios/${id}`);
  },

  /**
   * Crear un nuevo usuario
   * POST /api/usuarios
   */
  async create(data: CreateUsuarioRequest): Promise<ApiResponse<UsuarioResponse>> {
    return apiRequest<UsuarioResponse>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar un usuario
   * PUT /api/usuarios/{id}
   */
  async update(id: string, data: UpdateUsuarioRequest): Promise<ApiResponse<UsuarioResponse>> {
    return apiRequest<UsuarioResponse>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar/Desactivar un usuario
   * DELETE /api/usuarios/{id}
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtener lista de supervisores (usuarios con contraseña de supervisor)
   * GET /api/usuarios/supervisores
   */
  async getSupervisores(): Promise<ApiResponse<UsuariosListResponse>> {
    return apiRequest<UsuariosListResponse>('/usuarios/supervisores');
  },
};
