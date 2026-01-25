import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { prestamoVendedorApi } from '~/lib/api/prestamo-vendedor'

interface AprobarSolicitudData {
  solicitud_id: number
  sub_caja_origen_id: number
  monto_aprobado: number
}

export function useAprobarSolicitudEfectivo() {
  const { message, notification } = useApp()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const aprobar = async (data: AprobarSolicitudData) => {
    setLoading(true)
    try {
      const response = await prestamoVendedorApi.aprobarSolicitud(
        data.solicitud_id,
        data.sub_caja_origen_id,
        data.monto_aprobado
      )

      if (response.error) {
        notification.error({
          message: 'Error al aprobar solicitud',
          description: response.error.message || 'Error desconocido',
        })
        return false
      }

      message.success('Solicitud aprobada y efectivo transferido')

      queryClient.invalidateQueries({ queryKey: ['solicitudes-efectivo'] })
      queryClient.invalidateQueries({ queryKey: ['sub-cajas'] })
      queryClient.invalidateQueries({ queryKey: ['caja-activa'] })

      return true
    } catch (error) {
      console.error('Error al aprobar solicitud:', error)
      notification.error({
        message: 'Error inesperado',
        description: 'Ocurrió un error al aprobar la solicitud',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return { aprobar, loading }
}
