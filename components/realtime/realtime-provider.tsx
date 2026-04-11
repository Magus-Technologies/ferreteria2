'use client'

import { useRealtime } from '~/hooks/use-realtime'

/**
 * Componente que activa la escucha de WebSocket para
 * invalidar queries automáticamente cuando otro usuario
 * realiza cambios en el sistema.
 */
export default function RealtimeProvider() {
  useRealtime()
  return null
}
