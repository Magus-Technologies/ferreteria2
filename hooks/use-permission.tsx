'use client'

import { useAuth } from '~/lib/auth-context'

/**
 * Hook simple para verificar un permiso específico
 * Uso: const hasPermission = usePermission('permiso.name')
 */
export function usePermission(permiso: string) {
  const { user } = useAuth()
  
  // Verificar si el usuario tiene el permiso
  return user?.all_permissions?.includes(permiso) ?? false
}

/**
 * Hook completo con múltiples funciones de verificación
 * Uso: const { can, isAdmin, hasRole } = usePermissionHook()
 */
export default function usePermissionHook() {
  const { user } = useAuth()
  
  function can(permiso: string) {
    // Verificar si el usuario tiene el permiso
    return user?.all_permissions?.includes(permiso) ?? false
  }

  function isAdmin() {
    // En Laravel, el admin_global tiene todos los permisos
    // Podríamos verificar si tiene un permiso específico de admin
    // o si tiene una cantidad muy grande de permisos
    return user?.all_permissions?.length ? user.all_permissions.length > 100 : false
  }

  function hasPermission(permiso: string) {
    return can(permiso)
  }

  function hasAnyPermission(permisos: string[]) {
    return permisos.some(permiso => can(permiso))
  }

  function hasAllPermissions(permisos: string[]) {
    return permisos.every(permiso => can(permiso))
  }

  return { can, isAdmin, hasPermission, hasAnyPermission, hasAllPermissions }
}
