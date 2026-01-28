"use client";

import { useAuth } from "~/lib/auth-context";

/**
 * Hook simple para verificar si el usuario tiene acceso a una funcionalidad
 * SISTEMA DE RESTRICCIONES (Lista Negra):
 * - Por defecto, todos tienen acceso a todo
 * - Solo se guardan restricciones en la BD
 * - Si NO está en all_restrictions → tiene acceso
 * - Si está en all_restrictions → está bloqueado
 *
 * Uso: const hasAccess = usePermission('permiso.name')
 */
export function usePermission(permiso: string) {
  const { user } = useAuth();

  // Si no hay usuario, no tiene acceso
  if (!user) return false;

  // Si no hay restricciones, tiene acceso a todo
  if (!user.all_restrictions) return true;

  // Tiene acceso si NO está restringido (lista negra)
  return !user.all_restrictions.includes(permiso);
}

/**
 * Hook completo con múltiples funciones de verificación
 * Uso: const { can, isAdmin, isRestricted } = usePermissionHook()
 */
export default function usePermissionHook() {
  const { user } = useAuth();

  /**
   * Verificar si el usuario tiene acceso a una funcionalidad
   * @param permiso - Nombre del permiso/funcionalidad
   * @returns true si tiene acceso, false si está restringido
   */
  function can(permiso: string) {
    if (!user) return false;
    if (!user.all_restrictions) return true;

    // Tiene acceso si NO está restringido (lista negra)
    return !user.all_restrictions.includes(permiso);
  }

  /**
   * Verificar si el usuario está restringido de una funcionalidad
   * @param permiso - Nombre del permiso/funcionalidad
   * @returns true si está restringido, false si tiene acceso
   */
  function isRestricted(permiso: string) {
    if (!user) return true;
    if (!user.all_restrictions) return false;

    return user.all_restrictions.includes(permiso);
  }

  /**
   * Verificar si el usuario es administrador
   * Los admins tienen pocas o ninguna restricción
   */
  function isAdmin() {
    if (!user) return false;

    // Si no tiene restricciones o tiene muy pocas, es admin
    return !user.all_restrictions || user.all_restrictions.length === 0;
  }

  /**
   * Alias de can() para compatibilidad
   */
  function hasPermission(permiso: string) {
    return can(permiso);
  }

  /**
   * Verificar si tiene acceso a al menos una funcionalidad
   */
  function hasAnyPermission(permisos: string[]) {
    return permisos.some((permiso) => can(permiso));
  }

  /**
   * Verificar si tiene acceso a todas las funcionalidades
   */
  function hasAllPermissions(permisos: string[]) {
    return permisos.every((permiso) => can(permiso));
  }

  return {
    can,
    isAdmin,
    isRestricted,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
