'use client'

import { useAuth } from '~/lib/auth-context'

export function usePermission(permiso: string) {
  const { user } = useAuth()
  return user?.all_permissions?.includes(permiso) ?? false
}

export default function usePermissionHook() {
  const { user } = useAuth()
  function can(permiso: string) {
    return user?.all_permissions?.includes(permiso) ?? false
  }

  return can
}
