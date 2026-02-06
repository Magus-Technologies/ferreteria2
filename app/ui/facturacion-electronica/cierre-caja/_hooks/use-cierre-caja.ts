import { useState, useEffect } from 'react'
import { message } from 'antd'
import { cajaApi } from '~/lib/api/caja'

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
        
        if (response.data?.data) {
          setCajaActiva(response.data.data)
        } else {
          setError('No se encontró el cierre')
          if (!options?.optional) {
            message.error('No se encontró el cierre')
          }
        }
      } else {
        // Cargar caja activa normal (sin cerrar)
        const response = await cajaApi.cajaActiva()
        
        console.log('=== RESPONSE CAJA ACTIVA ===', response)
        console.log('=== RESPONSE.DATA ===', response.data)
        
        if (response.data?.data) {
          console.log('=== TIENE RESUMEN? ===', !!(response.data.data as any).resumen)
          console.log('=== RESUMEN ===', (response.data.data as any).resumen)
          setCajaActiva(response.data.data)
        } else {
          const errorMsg = 'No tienes una caja abierta'
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
