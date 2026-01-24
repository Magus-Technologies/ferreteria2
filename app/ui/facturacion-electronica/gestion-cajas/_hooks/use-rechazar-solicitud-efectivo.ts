import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { prestamoVendedorApi } from '~/lib/api/prestamo-vendedor'
import type { RechazarSolicitudRequest } from '~/lib/api/prestamo-vendedor'

export default function useRechazarSolicitudEfectivo(onSuccess?: () => void) {
  const { message, notification } = useApp()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const rechazar = async (solicitudId: string, data: RechazarSolicitudRequest) => {
    setLoading(true)
    try {
      const response = await prestamoVendedorApi.rechazar(solicitudId, data)

      if (response.error) {
        notification.error({
          message: 'Error al rechazar solicitud',
          description: response.error.message,
        })
        return
      }

      message.success('Solicitud rechazada')
      
      queryClient.invalidateQueries({ queryKey: ['solicitudes-efectivo'] })
      
      onSuccess?.()
    } catch (error) {
      console.error('Error al rechazar solicitud:', error)
      notification.error({
        message: 'Error inesperado',
        description: 'Ocurrió un error al rechazar la solicitud',
      })
    } finally {
      setLoading(false)
    }
  }

  return { rechazar, loading }
}
