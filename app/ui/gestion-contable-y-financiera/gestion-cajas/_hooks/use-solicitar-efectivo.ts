import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { prestamoVendedorApi, type CrearSolicitudRequest } from '~/lib/api/prestamo-vendedor'

// Hook para solicitar efectivo a otro vendedor
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
          message: 'Error al crear solicitud',
          description: response.error.message || 'Error desconocido',
        })
        return false
      }

      message.success('Solicitud enviada exitosamente')

      queryClient.invalidateQueries({ queryKey: ['solicitudes-efectivo'] })
      queryClient.invalidateQueries({ queryKey: ['vendedores-con-efectivo'] })

      onSuccess?.()
      return true
    } catch (error) {
      console.error('Error al solicitar efectivo:', error)
      notification.error({
        message: 'Error inesperado',
        description: 'Ocurrió un error al enviar la solicitud',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return { solicitarEfectivo, loading }
}
