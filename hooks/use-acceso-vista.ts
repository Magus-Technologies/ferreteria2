'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '~/lib/auth-context'
import { permissionForPath } from '~/lib/navigation/route-permission-map'

/**
 * Determina si la vista actual requiere autorización de acceso y si el usuario
 * todavía no la tiene otorgada. Se basa en `auth_required` / `auth_granted`
 * expuestos en el payload del usuario.
 */
export function useAccesoVista(): {
  componentId: string | null
  bloqueada: boolean
  /** La vista requería autorización y el usuario la tiene concedida. */
  concedida: boolean
} {
  const { user } = useAuth()
  const pathname = usePathname() || ''

  const componentId = permissionForPath(pathname)

  if (!componentId || !user) {
    return { componentId, bloqueada: false, concedida: false }
  }

  const required = (user.auth_required ?? []).includes(componentId)
  const granted = (user.auth_granted ?? []).includes(componentId)

  return {
    componentId,
    bloqueada: required && !granted,
    concedida: required && granted,
  }
}
