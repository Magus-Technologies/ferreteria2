import { App } from 'antd'
import { useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { validarCodigoProducto } from '~/app/_actions/producto'
import { useServerMutation } from '~/hooks/use-server-mutation'

export default function useValidarCodigoProducto() {
  const { execute, response, loading } = useServerMutation({
    action: validarCodigoProducto,
  })

  const { notification } = App.useApp()

  useEffect(() => {
    if (response)
      notification.error({
        message: `El código ${response} ya existe`,
      })
  }, [notification, response])

  const debounced = useDebouncedCallback<(value: string) => void>(
    value => execute({ cod_producto: value }),
    500
  )

  return { validar: debounced, loading, response }
}
