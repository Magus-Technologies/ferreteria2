import { apiRequest } from '../api'

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

// ============================================
// INTERFACES
// ============================================

export interface Permission {
  id: number
  name: string
  descripcion: string
}

export interface Role {
  id: number
  name: string
  descripcion: string
  permissions?: Permission[]
}

export interface UserPermissions {
  direct_permissions: Permission[]
  role_permissions: Permission[]
  roles: Role[]
  all_permission_ids: number[]
}

export interface UserWithPermissions {
  id: string
  name: string
  email: string
  image?: string
  roles: Role[]
  permissions: Permission[]
  all_permissions: string[]
}

export interface PermissionStats {
  total_permissions: number
  total_roles: number
  total_users: number
  users_by_role: Array<{
    name: string
    descripcion: string
    total: number
  }>
  most_assigned_permissions: Array<{
    name: string
    descripcion: string
    total: number
  }>
}

export interface GroupedPermissions {
  [module: string]: Permission[]
}

// ============================================
// API CLIENT
// ============================================

export const permissionsApi = {
  /**
   * Listar todos los permisos
   */
  getAll: async (): Promise<ApiResponse<Permission[]>> => {
    return apiRequest<Permission[]>('/permissions', { method: 'GET' })
  },

  /**
   * Obtener permisos agrupados por módulo
   */
  getGrouped: async (): Promise<ApiResponse<GroupedPermissions>> => {
    return apiRequest<GroupedPermissions>('/permissions/grouped', { method: 'GET' })
  },

  /**
   * Obtener estadísticas del sistema de permisos
   */
  getStats: async (): Promise<ApiResponse<PermissionStats>> => {
    return apiRequest<PermissionStats>('/permissions/stats', { method: 'GET' })
  },

  /**
   * Listar todos los roles con sus permisos
   */
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    return apiRequest<Role[]>('/permissions/roles', { method: 'GET' })
  },

  /**
   * Obtener un rol específico con sus permisos
   */
  getRole: async (roleId: number): Promise<ApiResponse<Role>> => {
    return apiRequest<Role>(`/permissions/roles/${roleId}`, { method: 'GET' })
  },

  /**
   * Crear un nuevo rol
   */
  createRole: async (data: {
    name: string
    descripcion: string
  }): Promise<ApiResponse<Role>> => {
    return apiRequest<Role>('/permissions/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Actualizar un rol
   */
  updateRole: async (
    roleId: number,
    data: {
      name: string
      descripcion: string
    }
  ): Promise<ApiResponse<Role>> => {
    return apiRequest<Role>(`/permissions/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Eliminar un rol
   */
  deleteRole: async (roleId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/permissions/roles/${roleId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Asignar permisos a un rol
   */
  assignPermissionsToRole: async (
    roleId: number,
    permissionIds: number[]
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/permissions/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permission_ids: permissionIds }),
    })
  },

  /**
   * Listar todos los usuarios con sus roles y permisos
   */
  getUsers: async (): Promise<ApiResponse<UserWithPermissions[]>> => {
    return apiRequest<UserWithPermissions[]>('/permissions/users', { method: 'GET' })
  },

  /**
   * Obtener permisos de un usuario específico
   */
  getUserPermissions: async (userId: string): Promise<ApiResponse<UserPermissions>> => {
    return apiRequest<UserPermissions>(`/permissions/users/${userId}`, { method: 'GET' })
  },

  /**
   * Asignar permisos directos a un usuario
   */
  assignPermissionsToUser: async (
    userId: string,
    permissionIds: number[]
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/permissions/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permission_ids: permissionIds }),
    })
  },

  /**
   * Asignar roles a un usuario
   */
  assignRolesToUser: async (
    userId: string,
    roleIds: number[]
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/permissions/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_ids: roleIds }),
    })
  },

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  checkPermission: async (
    userId: string,
    permission: string
  ): Promise<
    ApiResponse<{
      has_permission: boolean
      reason: 'admin_global' | 'direct_or_role' | 'no_permission'
    }>
  > => {
    return apiRequest<{
      has_permission: boolean
      reason: 'admin_global' | 'direct_or_role' | 'no_permission'
    }>(`/permissions/users/${userId}/check`, {
      method: 'POST',
      body: JSON.stringify({ permission }),
    })
  },
}
