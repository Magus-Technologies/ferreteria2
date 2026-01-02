import { useState } from 'react'
import { message } from 'antd'
import { cajaApi, type AperturaYCierreCaja } from '~/lib/api/caja'
import { AperturarCajaFormValues } from '../_components/modals/modal-aperturar-caja'

export default function useAperturarCaja({
  onSuccess,
}: {
  onSuccess?: (data: AperturaYCierreCaja) => void
}) {
  const [loading, setLoading] = useState(false)

  async function crearAperturarCaja(values: AperturarCajaFormValues) {
    setLoading(true)
    try {
      const response = await cajaApi.aperturar({
        monto_apertura: values.monto_apertura,
      })

      if (response.error) {
        message.error(response.error.message || 'Error al aperturar caja')
        return
      }

      if (response.data?.data) {
        message.success('Apertura de caja creada exitosamente')
        onSuccess?.(response.data.data)
      }
    } catch (error) {
      console.error('Error al aperturar caja:', error)
      message.error('Error inesperado al aperturar caja')
    } finally {
      setLoading(false)
    }
  }

  return {
    crearAperturarCaja,
    loading,
  }
}
