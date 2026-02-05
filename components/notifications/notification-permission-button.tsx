'use client'

import { Button, Tooltip, Badge } from 'antd'
import { FaBell, FaBellSlash } from 'react-icons/fa'
import { useNotifications } from '~/hooks/use-notifications'

interface NotificationPermissionButtonProps {
  showLabel?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
}

export default function NotificationPermissionButton({
  showLabel = true,
  size = 'middle',
  className = '',
}: NotificationPermissionButtonProps) {
  const { 
    permissionStatus, 
    isLoading, 
    enableNotifications, 
    isSupported 
  } = useNotifications()

  if (!isSupported) {
    return (
      <Tooltip title="Tu navegador no soporta notificaciones push">
        <Button 
          disabled 
          icon={<FaBellSlash />}
          size={size}
          className={className}
        >
          {showLabel && 'No soportado'}
        </Button>
      </Tooltip>
    )
  }

  if (permissionStatus === 'granted') {
    return (
      <Tooltip title="Notificaciones habilitadas">
        <Badge status="success" dot>
          <Button 
            type="text"
            icon={<FaBell className="text-green-500" />}
            size={size}
            className={className}
          >
            {showLabel && 'Notificaciones activas'}
          </Button>
        </Badge>
      </Tooltip>
    )
  }

  if (permissionStatus === 'denied') {
    return (
      <Tooltip title="Notificaciones bloqueadas. Habilítalas desde la configuración del navegador">
        <Button 
          disabled
          danger
          icon={<FaBellSlash />}
          size={size}
          className={className}
        >
          {showLabel && 'Bloqueadas'}
        </Button>
      </Tooltip>
    )
  }

  return (
    <Tooltip title="Habilita notificaciones para recibir alertas de entregas">
      <Button 
        type="primary"
        icon={<FaBell />}
        onClick={enableNotifications}
        loading={isLoading}
        size={size}
        className={className}
      >
        {showLabel && 'Habilitar notificaciones'}
      </Button>
    </Tooltip>
  )
}
