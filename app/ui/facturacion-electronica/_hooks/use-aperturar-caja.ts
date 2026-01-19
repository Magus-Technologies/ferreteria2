import { useState, useEffect } from 'react'
import { message } from 'antd'
import { cajaApi, type AperturaYCierreCaja } from '~/lib/api/caja'
import { authApi } from '~/lib/api'
import { AperturarCajaFormValues } from '../_components/modals/modal-aperturar-caja'

export default function useAperturarCaja({
  onSuccess,
}: {
  onSuccess?: (data: AperturaYCierreCaja) => void
}) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Obtener el usuario actual al montar el componente
    const fetchUser = async () => {
      try {
        const response = await authApi.getUser()
        if (response.data?.id) {
          setUserId(response.data.id)
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error)
      }
    }
    fetchUser()
  }, [])

  async function crearAperturarCaja(values: AperturarCajaFormValues) {
    setLoading(true)
    try {
      const response = await cajaApi.aperturar({
        caja_principal_id: values.caja_principal_id,
        monto_apertura: values.monto_apertura,
      })

      if (response.error) {
        message.error(response.error.message || 'Error al aperturar caja')
        return
      }

      if (response.data?.data) {
        message.success('Caja aperturada exitosamente')
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
    userId,
  }
}
