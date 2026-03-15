import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { CrearCajaFormValues } from '../../_components/modals/modal-crear-caja'

export default function useCrearCajaPrincipal({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const { message, notification } = useApp()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const crearCaja = useCallback(
    async (values: CrearCajaFormValues) => {
      setLoading(true)
      try {
        const response = await cajaPrincipalApi.create({
          user_id: values.user_id,
          nombre: values.nombre,
          nombre_metodo_pago: values.crear_metodo_pago && values.nombre_metodo_pago
            ? values.nombre_metodo_pago
            : null,
        })

        if (response.error) {
          notification.error({
            message: 'Error al crear la caja',
            description: response.error.message,
          })
          return
        }

        message.success('Caja principal creada exitosamente')

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.CAJAS_PRINCIPALES],
        })
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.VENDEDORES_DISPONIBLES],
        })
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.METODO_DE_PAGO],
        })
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO],
        })

        onSuccess?.()
      } catch (error) {
        console.error('Error al crear caja:', error)
        notification.error({
          message: 'Error inesperado',
          description: 'Ocurrió un error al crear la caja principal',
        })
      } finally {
        setLoading(false)
      }
    },
    [message, notification, queryClient, onSuccess]
  )

  return { crearCaja, loading }
}
