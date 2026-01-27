import { useState } from 'react'
import { message } from 'antd'
import { cierreCajaApi, type CerrarCajaRequest } from '~/lib/api/cierre-caja'

export function useCerrarCaja() {
  const [loading, setLoading] = useState(false)

  const cerrarCaja = async (
    aperturaId: string,
    data: CerrarCajaRequest
  ): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await cierreCajaApi.cerrarCaja(aperturaId, data)

      if (response.success) {
        message.success(response.message || 'Caja cerrada exitosamente')
        return true
      } else {
        message.error('No se pudo cerrar la caja')
        return false
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cerrar caja'
      message.error(errorMsg)
      console.error('Error al cerrar caja:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    cerrarCaja,
    loading,
  }
}
