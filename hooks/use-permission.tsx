"use client";

import { useCallback, useMemo } from "react";
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
  const can = useCallback(
    (permiso: string) => {
      if (!user) return false;
      if (!user.all_restrictions) return true;

      // Tiene acceso si NO está restringido (lista negra)
      return !user.all_restrictions.includes(permiso);
    },
    [user],
  );

  /**
   * Verificar si el usuario está restringido de una funcionalidad
   * @param permiso - Nombre del permiso/funcionalidad
   * @returns true si está restringido, false si tiene acceso
   */
  const isRestricted = useCallback(
    (permiso: string) => {
      if (!user) return true;
      if (!user.all_restrictions) return false;

      return user.all_restrictions.includes(permiso);
    },
    [user],
  );

  /**
   * Verificar si el usuario es administrador
   * Los admins tienen pocas o ninguna restricción
   */
  const isAdmin = useCallback(() => {
    if (!user) return false;

    // Si no tiene restricciones o tiene muy pocas, es admin
    return !user.all_restrictions || user.all_restrictions.length === 0;
  }, [user]);

  /**
   * Alias de can() para compatibilidad
   */
  const hasPermission = useCallback((permiso: string) => can(permiso), [can]);

  /**
   * Verificar si tiene acceso a al menos una funcionalidad
   */
  const hasAnyPermission = useCallback(
    (permisos: string[]) => permisos.some((permiso) => can(permiso)),
    [can],
  );

  /**
   * Verificar si tiene acceso a todas las funcionalidades
   */
  const hasAllPermissions = useCallback(
    (permisos: string[]) => permisos.every((permiso) => can(permiso)),
    [can],
  );

  // Objeto de retorno también estable: código como `useColumnsProductos`
  // pone `can` (u otras funciones de este hook) en su propio array de
  // dependencias de useMemo/useCallback. Sin useCallback arriba, `can` era
  // una función nueva en cada render → esos memos nunca servían de nada y
  // recalculaban columnas de grillas de miles de filas en cada re-render
  // (ej. TableProductoSearch, con hasta 5000+ productos del catálogo).
  return useMemo(
    () => ({
      can,
      isAdmin,
      isRestricted,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [can, isAdmin, isRestricted, hasPermission, hasAnyPermission, hasAllPermissions],
  );
}
