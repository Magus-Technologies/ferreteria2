'use client'

import { useSession } from 'next-auth/react'

export function usePermission(permiso: string) {
  const { data: session } = useSession()
  return session?.user?.all_permissions.includes(permiso) ?? false
}

export default function usePermissionHook() {
  const { data: session } = useSession()
  function can(permiso: string) {
    return session?.user?.all_permissions.includes(permiso) ?? false
  }

  return can
}
