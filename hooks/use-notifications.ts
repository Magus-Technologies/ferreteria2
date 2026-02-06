'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '~/lib/auth-context'
import { requestNotificationPermission, onForegroundMessage } from '~/lib/firebase/config'
import { fcmApi } from '~/lib/api/fcm'
import { App } from 'antd'

export function useNotifications() {
  const { user } = useAuth()
  const { notification } = App.useApp()
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Verificar estado de permisos al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  // Solicitar permisos y obtener token
  const enableNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log('No hay usuario autenticado')
      return null
    }

    setIsLoading(true)
    try {
      const token = await requestNotificationPermission()
      
      if (token) {
        setFcmToken(token)
        setPermissionStatus('granted')
        
        // Guardar token en el backend
        const response = await fcmApi.updateToken({ fcm_token: token })
        
        if (response.error) {
          console.error('Error guardando token FCM:', response.error)
        } else {
          console.log('Token FCM guardado exitosamente')
        }
        
        return token
      } else {
        setPermissionStatus(Notification.permission)
        return null
      }
    } catch (error) {
      console.error('Error habilitando notificaciones:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (typeof window === 'undefined') return

    const unsubscribe = onForegroundMessage((payload) => {
      // Mostrar notificación usando Ant Design
      notification.info({
        message: payload.notification?.title || 'Nueva Notificación',
        description: payload.notification?.body,
        placement: 'topRight',
        duration: 10,
        onClick: () => {
          // Navegar a entregas si es una notificación de entrega
          if (payload.data?.type === 'entrega') {
            window.location.href = '/ui/facturacion-electronica/mis-entregas'
          }
        },
      })
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [notification])

  // Auto-registrar si el usuario tiene rol DESPACHADOR
  useEffect(() => {
    if (
      user?.rol_sistema === 'DESPACHADOR' && 
      permissionStatus === 'default' &&
      typeof window !== 'undefined'
    ) {
      // Para despachadores, solicitar permisos automáticamente después de 3 segundos
      const timer = setTimeout(() => {
        enableNotifications()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [user?.rol_sistema, permissionStatus, enableNotifications])

  return {
    fcmToken,
    permissionStatus,
    isLoading,
    enableNotifications,
    isSupported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
  }
}
