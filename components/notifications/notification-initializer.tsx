'use client'

import { useEffect } from 'react'
import { useAuth } from '~/lib/auth-context'
import { useNotifications } from '~/hooks/use-notifications'

/**
 * Componente que inicializa las notificaciones automáticamente
 * para usuarios con rol DESPACHADOR después del login
 */
export default function NotificationInitializer() {
  const { user } = useAuth()
  const { enableNotifications, permissionStatus } = useNotifications()

  useEffect(() => {


    // Solo para usuarios DESPACHADOR
    if (user?.rol_sistema === 'DESPACHADOR') {
      if (permissionStatus === 'default') {
        const timer = setTimeout(() => {
          enableNotifications()
        }, 3000)
        return () => clearTimeout(timer)
      } else if (permissionStatus === 'granted') {
        enableNotifications()
      }
    }
  }, [user?.rol_sistema, permissionStatus, enableNotifications])

  // Este componente no renderiza nada
  return null
}
