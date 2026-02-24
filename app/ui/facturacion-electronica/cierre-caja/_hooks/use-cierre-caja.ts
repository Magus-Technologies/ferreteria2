import { useState, useEffect } from 'react'
import { message } from 'antd'
import { cajaApi } from '~/lib/api/caja'
import { cierreCajaApi } from '~/lib/api/cierre-caja'

export function useCierreCaja(cierreId?: string, options?: { optional?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [cajaActiva, setCajaActiva] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [esEdicion, setEsEdicion] = useState(false)

  const cargarCaja = async () => {
    try {
      setLoading(true)
      setError(null)

      // Si hay cierreId, cargar ese cierre específico para edición
      if (cierreId) {
        setEsEdicion(true)
        // Cargar el cierre completo con su resumen desde el endpoint específico
        const response = await cajaApi.obtenerCierre(cierreId)

        console.log('📦 Respuesta de obtenerCierre:', response)

        if (response.data?.data) {
          console.log('✅ Caja cargada:', response.data.data)
          console.log('📊 Estado de la caja:', response.data.data.estado)
          setCajaActiva(response.data.data)
        } else {
          setError('No se encontró el cierre')
          if (!options?.optional) {
            message.error('No se encontró el cierre')
          }
        }
      } else {
        // Cargar caja activa usando el endpoint refactorizado
        const response: any = await cierreCajaApi.obtenerCajaActiva()

        console.log('📦 Respuesta de obtenerCajaActiva:', response)

        if (response.success && response.data) {
          console.log('✅ Caja activa cargada:', response.data)
          console.log('📊 Estado de la caja:', response.data.estado)
          setCajaActiva(response.data)
        } else {
          const errorMsg = response.error?.message || response.message || 'No tienes una caja abierta o hubo un problema al consultarla'
          setError(errorMsg)
          // Solo mostrar error si no es opcional
          if (!options?.optional) {
            message.warning(errorMsg)
          }
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar caja'
      setError(errorMsg)
      console.error('Error al cargar caja:', err)
      // Solo mostrar error si no es opcional
      if (!options?.optional) {
        message.error(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCaja()
  }, [cierreId])

  return {
    loading,
    cajaActiva,
    error,
    esEdicion,
    recargar: cargarCaja,
  }
}
