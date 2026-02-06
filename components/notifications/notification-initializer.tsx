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
    console.log('🔔 NotificationInitializer montado')
    console.log('🔔 Usuario:', user?.name, 'Rol:', user?.rol_sistema)
    console.log('🔔 Estado de permisos:', permissionStatus)

    // Solo para usuarios DESPACHADOR
    if (user?.rol_sistema === 'DESPACHADOR') {
      console.log('✅ Usuario es DESPACHADOR')
      
      // Si los permisos están en "default", solicitar automáticamente
      if (permissionStatus === 'default') {
        console.log('🔔 Permisos en "default", solicitando en 3 segundos...')
        const timer = setTimeout(() => {
          console.log('🔔 Ejecutando enableNotifications...')
          enableNotifications()
        }, 3000)
        
        return () => clearTimeout(timer)
      } else if (permissionStatus === 'granted') {
        console.log('✅ Permisos ya concedidos, registrando token...')
        // Si ya tiene permisos, solo registrar el token
        enableNotifications()
      } else if (permissionStatus === 'denied') {
        console.log('❌ Permisos denegados por el usuario')
      }
    }
  }, [user?.rol_sistema, permissionStatus, enableNotifications])

  // Este componente no renderiza nada
  return null
}
