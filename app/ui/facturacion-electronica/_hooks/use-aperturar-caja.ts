import { useState, useEffect } from 'react'
import { message } from 'antd'
import { cajaApi, type AperturaYCierreCaja } from '~/lib/api/caja'
import { authApi } from '~/lib/api'
import { AperturarCajaFormValues } from '../_components/modals/modal-aperturar-caja'
import { useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useAperturarCaja({
  onSuccess,
}: {
  onSuccess?: (data: AperturaYCierreCaja) => void
}) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const queryClient = useQueryClient()

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
      // Calcular el monto total
      const montoTotal = values.vendedores.reduce((sum, v) => sum + v.monto, 0)

      // Preparar los datos para el backend
      const payload = {
        caja_principal_id: values.caja_origen_id,
        monto_apertura: montoTotal,
        vendedores: values.vendedores.map(v => ({
          user_id: v.user_id,
          monto: v.monto,
          conteo_billetes_monedas: null, // Por ahora null, se puede agregar después
        })),
      }

      const response = await cajaApi.aperturar(payload)

      if (response.data?.data) {
        message.success(`Efectivo distribuido exitosamente a ${values.vendedores.length} vendedor(es)`)

        // Invalidar queries
        queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJAS_PRINCIPALES] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.SUB_CAJAS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS] })
        queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })

        onSuccess?.(response.data.data)
      } else {
        message.error('Error al distribuir efectivo')
      }
    } catch (error) {
      console.error('Error al aperturar caja:', error)
      message.error('Error inesperado al distribuir efectivo')
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
