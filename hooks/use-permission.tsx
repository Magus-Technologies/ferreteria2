'use client'

import { useSession } from 'next-auth/react'

export default function usePermission() {
  const { data: session } = useSession()
  function can(permiso: string) {
    return session?.user?.all_permissions.includes(permiso)
  }

  return can
}
