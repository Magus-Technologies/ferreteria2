import { useState, useEffect } from 'react'
import { message } from 'antd'
import { cierreCajaApi, type ResumenCajaResponse } from '~/lib/api/cierre-caja'

export function useCierreCaja() {
  const [loading, setLoading] = useState(false)
  const [cajaActiva, setCajaActiva] = useState<ResumenCajaResponse['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargarCajaActiva = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await cierreCajaApi.obtenerCajaActiva()
      
      if (response.success) {
        setCajaActiva(response.data)
      } else {
        setError('No se pudo cargar la caja activa')
        message.error('No se pudo cargar la caja activa')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar caja activa'
      setError(errorMsg)
      message.error(errorMsg)
      console.error('Error al cargar caja activa:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCajaActiva()
  }, [])

  return {
    loading,
    cajaActiva,
    error,
    recargar: cargarCajaActiva,
  }
}
