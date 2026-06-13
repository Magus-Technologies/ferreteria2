'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '~/lib/auth-context'
import { requestNotificationPermission, onForegroundMessage } from '~/lib/firebase/config'
import { fcmApi } from '~/lib/api/fcm'
import { App } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { autorizacionesKeys } from '~/lib/api/autorizaciones'

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
      setPermissionStatus(currentPermission)
    }
  }, [])

  // Solicitar permisos y obtener token
  const enableNotifications = useCallback(async () => {
    if (!user?.id) {
      return null
    }

    setIsLoading(true)
    try {
      const token = await requestNotificationPermission()
      
      if (token) {
        setFcmToken(token)
        setPermissionStatus('granted')
        
        // Guardar token en el backend
        await fcmApi.updateToken({ fcm_token: token })
        
        return token
      } else {
        setPermissionStatus(Notification.permission)
        return null
      }
    } catch (error) {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (typeof window === 'undefined') return

    const unsubscribe = onForegroundMessage((payload) => {
      // Invalidar caché de entregas para refrescar la tabla
      if (payload.data?.type === 'entrega') {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      }

      // Pedido de entrega (interno o externo)
      if (payload.data?.type === 'pedido_entrega') {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      }

      // Pedido externo ya fue tomado por otro usuario
      if (payload.data?.type === 'pedido_entrega_tomado') {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      }

      // Entrega completada — refrescar calendario y listado
      if (payload.data?.type === 'entrega_completada') {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'programadas'] })
      }

      // Invalidar caché de autorizaciones (nueva solicitud para aprobador)
      if (payload.data?.type === 'autorizacion') {
        queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientes() })
        queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientesCount() })
      }

      // Invalidar caché de autorizaciones (respuesta para solicitante)
      if (payload.data?.type === 'autorizacion_respuesta') {
        queryClient.invalidateQueries({ queryKey: autorizacionesKeys.misSolicitudes() })
      }

      // Mostrar TAMBIÉN la notificación a nivel sistema (toast de Windows).
      // FCM en primer plano NO la muestra automáticamente — solo el service
      // worker lo hace en background. Sin esto, con la pestaña activa el
      // usuario solo ve el toast de antd y cree que "no llegan a Windows".
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        'serviceWorker' in navigator
      ) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification(payload.notification?.title || 'Nueva Notificación', {
              body: payload.notification?.body,
              icon: '/icon-192x192.png',
              badge: '/icon-72x72.png',
              data: payload.data,
              // tag: dedup — si llega el mismo evento dos veces, reemplaza
              tag: payload.data?.entrega_id
                ? `entrega-${payload.data.entrega_id}-${payload.data?.type ?? ''}`
                : undefined,
            })
          )
          .catch(() => {})
      }

      // Mostrar notificación usando Ant Design
      notification.info({
        message: payload.notification?.title || 'Nueva Notificación',
        description: payload.notification?.body,
        placement: 'topRight',
        duration: 10,
        onClick: () => {
          // Navegar a entregas si es una notificación de entrega
          if (payload.data?.type === 'entrega' || payload.data?.type === 'pedido_entrega' || payload.data?.type === 'pedido_entrega_tomado') {
            window.location.href = '/ui/facturacion-electronica/mis-entregas'
          }
          // Entrega completada — ir al calendario
          if (payload.data?.type === 'entrega_completada') {
            window.location.href = '/ui/facturacion-electronica/mis-ventas/calendario'
          }
          // Navegar a solicitudes si es de autorización
          if (payload.data?.type === 'autorizacion' || payload.data?.type === 'autorizacion_respuesta') {
            window.location.href = '/ui/solicitudes-autorizacion'
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
      if (event.data?.type === 'INVALIDATE_ENTREGAS_CACHE') {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
      }
      if (event.data?.type === 'INVALIDATE_CALENDARIO_CACHE') {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'programadas'] })
      }
      if (event.data?.type === 'INVALIDATE_AUTORIZACIONES_CACHE') {
        queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientes() })
        queryClient.invalidateQueries({ queryKey: autorizacionesKeys.pendientesCount() })
        queryClient.invalidateQueries({ queryKey: autorizacionesKeys.misSolicitudes() })
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
