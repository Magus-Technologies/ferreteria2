import { App } from 'antd'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { productosApiV2 } from '~/lib/api/producto'

export default function useValidarCodigoProducto() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const { notification } = App.useApp()

  useEffect(() => {
    if (response)
      notification.error({
        message: `El código ${response} ya existe`,
      })
  }, [notification, response])

  const debounced = useDebouncedCallback<(value: string) => void>(
    async (value) => {
      setLoading(true)
      try {
        const res = await productosApiV2.validarCodigo(value)
        setResponse(res.data ?? null)
      } catch {
        setResponse(null)
      } finally {
        setLoading(false)
      }
    },
    500
  )

  return { validar: debounced, loading, response }
}
