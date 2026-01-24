import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { prestamoVendedorApi } from '~/lib/api/prestamo-vendedor'
import type { CrearSolicitudRequest } from '~/lib/api/prestamo-vendedor'

export default function useSolicitarEfectivo(onSuccess?: () => void) {
  const { message, notification } = useApp()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const solicitarEfectivo = async (data: CrearSolicitudRequest) => {
    setLoading(true)
    try {
      const response = await prestamoVendedorApi.crearSolicitud(data)

      if (response.error) {
        notification.error({
          message: 'Error al solicitar efectivo',
          description: response.error.message,
        })
        return
      }

      message.success('Solicitud enviada exitosamente')
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['solicitudes-efectivo'] })
      
      onSuccess?.()
    } catch (error) {
      console.error('Error al solicitar efectivo:', error)
      notification.error({
        message: 'Error inesperado',
        description: 'Ocurrió un error al enviar la solicitud',
      })
    } finally {
      setLoading(false)
    }
  }

  return { solicitarEfectivo, loading }
}
