import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { CrearSubCajaFormValues } from '../_components/modal-crear-sub-caja'

export default function useCrearSubCaja({
  cajaPrincipalId,
  onSuccess,
}: {
  cajaPrincipalId: number
  onSuccess?: () => void
}) {
  const { message, notification } = useApp()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const crearSubCaja = useCallback(
    async (values: CrearSubCajaFormValues) => {
      setLoading(true)
      try {
        console.log('Valores del formulario:', values)

        // Asegurar que despliegues_pago_ids sea un array
        let desplieguesPagoIds = values.despliegues_pago_ids

        // Si no es un array, convertirlo
        if (!Array.isArray(desplieguesPagoIds)) {
          console.warn('despliegues_pago_ids no es un array, convirtiendo...')
          desplieguesPagoIds = desplieguesPagoIds ? [desplieguesPagoIds as string] : []
        }

        // Si está vacío, mostrar error
        if (desplieguesPagoIds.length === 0) {
          notification.error({
            message: 'Error de validación',
            description: 'Debe seleccionar al menos un método de pago',
          })
          setLoading(false)
          return
        }

        const payload = {
          caja_principal_id: cajaPrincipalId,
          nombre: values.nombre,
          despliegues_pago_ids: desplieguesPagoIds,
          tipos_comprobante: values.tipos_comprobante,
          proposito: values.proposito,
        }

        console.log('Payload a enviar:', payload)
        console.log('despliegues_pago_ids es array?', Array.isArray(payload.despliegues_pago_ids))
        console.log('despliegues_pago_ids valor:', JSON.stringify(payload.despliegues_pago_ids))

        const response = await cajaPrincipalApi.createSubCaja(payload)

        if (response.error) {
          notification.error({
            message: 'Error al crear la sub-caja',
            description: response.error.message,
          })
          return
        }

        message.success('Sub-caja creada exitosamente')

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.CAJAS_PRINCIPALES],
        })
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.SUB_CAJAS],
        })

        onSuccess?.()
      } catch (error) {
        console.error('Error al crear sub-caja:', error)
        notification.error({
          message: 'Error inesperado',
          description: 'Ocurrió un error al crear la sub-caja',
        })
      } finally {
        setLoading(false)
      }
    },
    [cajaPrincipalId, message, notification, queryClient, onSuccess]
  )

  return { crearSubCaja, loading }
}
