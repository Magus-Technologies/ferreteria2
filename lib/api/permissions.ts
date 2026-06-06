import { apiRequest } from "../api";

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================
// INTERFACES
// ============================================

export interface Permission {
  id: number;
  name: string;
  descripcion: string;
}

export interface Restriction {
  id: number;
  name: string;
  descripcion: string;
}

export interface Role {
  id: number;
  name: string;
  descripcion: string;
  estado?: boolean;
  users_count?: number;
  permissions?: Permission[];
  restrictions?: Restriction[];
}

export interface UserPermissions {
  direct_permissions: Permission[];
  role_permissions: Permission[];
  roles: Role[];
  all_permission_ids: number[];
}

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  image?: string;
  roles: Role[];
  permissions: Permission[];
  all_permissions: string[];
}

export interface PermissionStats {
  total_permissions: number;
  total_roles: number;
  total_users: number;
  users_by_role: Array<{
    name: string;
    descripcion: string;
    total: number;
  }>;
  most_assigned_permissions: Array<{
    name: string;
    descripcion: string;
    total: number;
  }>;
}

export interface GroupedPermissions {
  [module: string]: Permission[];
}

// ============================================
// API CLIENT
// ============================================

export const permissionsApi = {
  /**
   * Listar todas las restricciones
   */
  getAll: async (): Promise<ApiResponse<Restriction[]>> => {
    return apiRequest<Restriction[]>("/restrictions", { method: "GET" });
  },

  /**
   * Listar todos los roles con sus restricciones
   */
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    return apiRequest<Role[]>("/roles", { method: "GET" });
  },

  /**
   * Listar roles para gestión (incluye estado y users_count).
   * GET /permissions/roles → { data: Role[] }
   */
  getRolesGestion: async (): Promise<ApiResponse<{ data: Role[] }>> => {
    return apiRequest<{ data: Role[] }>("/permissions/roles", { method: "GET" });
  },

  /**
   * Activar / desactivar un rol.
   */
  toggleRoleEstado: async (
    roleId: number,
    estado: boolean,
  ): Promise<ApiResponse<{ data: Role; message: string }>> => {
    return apiRequest(`/permissions/roles/${roleId}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
  },

  /**
   * Obtener un rol específico con sus restricciones
   */
  getRole: async (roleId: number): Promise<ApiResponse<Role>> => {
    return apiRequest<Role>(`/roles/${roleId}`, { method: "GET" });
  },

  /**
   * Crear un nuevo rol
   */
  createRole: async (data: {
    name: string;
    descripcion: string;
    estado?: boolean;
  }): Promise<ApiResponse<Role>> => {
    return apiRequest<Role>("/permissions/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar un rol
   */
  updateRole: async (
    roleId: number,
    data: {
      name: string;
      descripcion: string;
      estado?: boolean;
    },
  ): Promise<ApiResponse<Role>> => {
    return apiRequest<Role>(`/permissions/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar un rol (solo si ningún usuario lo usa).
   */
  deleteRole: async (
    roleId: number,
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/permissions/roles/${roleId}`, {
      method: "DELETE",
    });
  },

  /**
   * Asignar restricciones a un rol
   */
  assignRestrictionsToRole: async (
    roleId: number,
    restrictionIds: number[],
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(
      `/restrictions/roles/${roleId}/restrictions`,
      {
        method: "POST",
        body: JSON.stringify({ restriction_ids: restrictionIds }),
      },
    );
  },

  /**
   * Toggle restricción: mostrar u ocultar funcionalidad para un rol
   */
  toggleRestriction: async (
    roleId: number,
    permissionName: string,
    mostrar: boolean,
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(
      `/restrictions/roles/${roleId}/toggle`,
      {
        method: "POST",
        body: JSON.stringify({ permission_name: permissionName, mostrar }),
      },
    );
  },

  /**
   * Verificar si un usuario tiene acceso a una funcionalidad
   */
  checkAccess: async (
    userId: string,
    permission: string,
  ): Promise<
    ApiResponse<{
      has_access: boolean;
      reason: "admin_global" | "not_restricted" | "restricted";
    }>
  > => {
    return apiRequest<{
      has_access: boolean;
      reason: "admin_global" | "not_restricted" | "restricted";
    }>(`/restrictions/users/${userId}/check-access`, {
      method: "POST",
      body: JSON.stringify({ permission }),
    });
  },
};
