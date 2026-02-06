'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '~/lib/auth-context'
import { requestNotificationPermission, onForegroundMessage } from '~/lib/firebase/config'
import { fcmApi } from '~/lib/api/fcm'
import { App } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useNotifications() {
  const { user } = useAuth()
  const { notification } = App.useApp()
  const queryClient = useQueryClient()
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Verificar estado de permisos al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission
      console.log('🔔 Estado de permisos de notificaciones:', currentPermission)
      setPermissionStatus(currentPermission)
    }
  }, [])

  // Solicitar permisos y obtener token
  const enableNotifications = useCallback(async () => {
    console.log('🔔 enableNotifications llamado')
    console.log('🔔 Usuario:', user?.id, 'Rol:', user?.rol_sistema)
    
    if (!user?.id) {
      console.log('❌ No hay usuario autenticado')
      return null
    }

    setIsLoading(true)
    try {
      console.log('🔔 Solicitando permiso de notificaciones...')
      const token = await requestNotificationPermission()
      console.log('🔔 Token obtenido:', token ? 'SÍ' : 'NO')
      
      if (token) {
        setFcmToken(token)
        setPermissionStatus('granted')
        
        console.log('🔔 Guardando token en el backend...')
        // Guardar token en el backend
        const response = await fcmApi.updateToken({ fcm_token: token })
        
        if (response.error) {
          console.error('❌ Error guardando token FCM:', response.error)
        } else {
          console.log('✅ Token FCM guardado exitosamente en el backend')
        }
        
        return token
      } else {
        console.log('❌ No se pudo obtener el token')
        setPermissionStatus(Notification.permission)
        return null
      }
    } catch (error) {
      console.error('❌ Error habilitando notificaciones:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (typeof window === 'undefined') return

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('🔔 Notificación recibida en primer plano:', payload)
      
      // Invalidar caché de entregas para refrescar la tabla
      if (payload.data?.type === 'entrega') {
        console.log('🔄 Invalidando caché de entregas...')
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      }
      
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
  }, [notification, queryClient])

  // Escuchar mensajes del Service Worker (cuando se hace clic en notificación de background)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Mensaje del Service Worker:', event.data)
      
      if (event.data?.type === 'INVALIDATE_ENTREGAS_CACHE') {
        console.log('🔄 Invalidando caché de entregas desde Service Worker...')
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [queryClient])

  return {
    fcmToken,
    permissionStatus,
    isLoading,
    enableNotifications,
    isSupported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
  }
}
