'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '~/lib/auth-context'
import { useNotifications } from '~/hooks/use-notifications'
import { usePermission } from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

/**
 * Componente que inicializa las notificaciones automáticamente
 * para cualquier usuario con acceso al módulo de entregas,
 * independientemente de su rol.
 */
export default function NotificationInitializer() {
  const { user } = useAuth()
  const { enableNotifications, permissionStatus } = useNotifications()
  const hasModuleAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX)
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!user?.id || !hasModuleAccess) return

    if (permissionStatus === 'default') {
      const timer = setTimeout(() => {
        enableNotifications()
      }, 3000)
      return () => clearTimeout(timer)
    }

    if (permissionStatus === 'granted' && !registeredRef.current) {
      registeredRef.current = true
      enableNotifications()
    }
  }, [user?.id, hasModuleAccess, permissionStatus, enableNotifications])

  return null
}
