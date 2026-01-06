import { App } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { productosApiV2 } from '~/lib/api/producto'

export default function useValidarCodigoProducto(productoIdActual?: number) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const { notification } = App.useApp()

  // Limpiar response cuando cambia el producto
  useEffect(() => {
    setResponse(null)
  }, [productoIdActual])

  useEffect(() => {
    if (response)
      notification.error({
        message: `El código ${response} ya existe`,
      })
  }, [notification, response])

  const debounced = useDebouncedCallback(
    useCallback(async (value: string) => {
      if (!value) {
        setResponse(null)
        return
      }
      setLoading(true)
      try {
        const res = await productosApiV2.validarCodigo(value, productoIdActual)
        // Solo setear response si realmente hay un código duplicado
        // Si data es null, significa que NO hay duplicados
        setResponse(res.data && typeof res.data === 'string' ? res.data : null)
      } catch {
        setResponse(null)
      } finally {
        setLoading(false)
      }
    }, [productoIdActual]),
    500
  )

  return { validar: debounced, loading, response }
}
