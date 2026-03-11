'use client'

import { useState, useCallback } from 'react'
import { autorizacionesApi } from '~/lib/api/autorizaciones'
import { message } from 'antd'

interface UseRequiereAutorizacionOptions {
  modulo: string
  accion: 'crear' | 'editar' | 'eliminar'
  descripcion: string
  metadata?: Record<string, any>
  onPermitido: () => void | Promise<void>
}

interface UseRequiereAutorizacionReturn {
  ejecutar: () => Promise<void>
  solicitar: () => Promise<void>
  verificando: boolean
  solicitando: boolean
  requiereAutorizacion: boolean | null
  tieneAutorizacion: boolean | null
}

export function useRequiereAutorizacion({
  modulo,
  accion,
  descripcion,
  metadata,
  onPermitido,
}: UseRequiereAutorizacionOptions): UseRequiereAutorizacionReturn {
  const [verificando, setVerificando] = useState(false)
  const [solicitando, setSolicitando] = useState(false)
  const [requiereAutorizacion, setRequiereAutorizacion] = useState<boolean | null>(null)
  const [tieneAutorizacion, setTieneAutorizacion] = useState<boolean | null>(null)

  const ejecutar = useCallback(async () => {
    setVerificando(true)
    try {
      const res = await autorizacionesApi.verificar(modulo, accion)
      const data = res.data

      if (!data?.requiere) {
        // No requiere autorización → ejecutar directamente
        setRequiereAutorizacion(false)
        setTieneAutorizacion(true)
        await onPermitido()
        return
      }

      if (data.tiene_autorizacion) {
        // Requiere pero ya tiene → ejecutar
        setRequiereAutorizacion(true)
        setTieneAutorizacion(true)
        await onPermitido()
        return
      }

      // Requiere y no tiene → mostrar que necesita solicitar
      setRequiereAutorizacion(true)
      setTieneAutorizacion(false)
      message.warning('Esta acción requiere autorización. Solicita permiso para continuar.')
    } catch (err: any) {
      console.error('Error verificando autorización:', err)
      // En caso de error, permitir la acción (fail-open)
      await onPermitido()
    } finally {
      setVerificando(false)
    }
  }, [modulo, accion, onPermitido])

  const solicitar = useCallback(async () => {
    setSolicitando(true)
    try {
      const res = await autorizacionesApi.solicitar({
        modulo,
        accion,
        descripcion,
        metadata,
      })

      if (res.data) {
        message.success('Solicitud enviada. Recibirás una notificación cuando sea aprobada.')
        setRequiereAutorizacion(null)
        setTieneAutorizacion(null)
      } else if (res.error) {
        message.error(res.error.message || 'Error al enviar solicitud')
      }
    } catch (err: any) {
      message.error(err?.message || 'Error al enviar solicitud')
    } finally {
      setSolicitando(false)
    }
  }, [modulo, accion, descripcion, metadata])

  return {
    ejecutar,
    solicitar,
    verificando,
    solicitando,
    requiereAutorizacion,
    tieneAutorizacion,
  }
}
