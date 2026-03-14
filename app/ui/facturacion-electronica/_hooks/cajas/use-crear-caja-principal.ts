import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'
import { metodoDePagoApi } from '~/lib/api/metodo-de-pago'
import { apiRequest } from '~/lib/api'
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
        let desplieguePagoId: string | null = null

        // Si se debe crear método de pago
        if (values.crear_metodo_pago && values.nombre_metodo_pago) {
          try {
            // Crear el método de pago (banco)
            const responseMetodo = await metodoDePagoApi.create({
              name: values.nombre_metodo_pago,
              cuenta_bancaria: undefined,
              nombre_titular: undefined,
              monto_inicial: 0,
            })

            if (responseMetodo.error) {
              notification.warning({
                message: 'Error al crear método de pago',
                description: responseMetodo.error.message,
              })
            } else {
              const metodoPagoId = responseMetodo.data?.data.id

              // Crear el despliegue de pago (tipo de pago)
              if (metodoPagoId) {
                const responseDespliegue = await apiRequest('/despliegues-de-pago', {
                  method: 'POST',
                  body: JSON.stringify({
                    name: values.nombre_metodo_pago,
                    metodo_de_pago_id: metodoPagoId,
                    requiere_numero_serie: false,
                    tipo_sobrecargo: 'ninguno',
                    sobrecargo_porcentaje: 0,
                    adicional: 0,
                    mostrar: true,
                    numero_celular: null,
                  }),
                })

                if (responseDespliegue.error) {
                  notification.warning({
                    message: 'Error al crear despliegue de pago',
                    description: responseDespliegue.error.message,
                  })
                } else {
                  // Guardar el ID del despliegue de pago creado
                  // El endpoint responde con { data: { id, ... } }
                  desplieguePagoId = (responseDespliegue.data as any)?.id || null
                  console.log('=== Despliegue de pago creado ===', {
                    desplieguePagoId,
                    responseData: (responseDespliegue.data as any),
                  })
                }
              }
            }
          } catch (error) {
            console.error('Error al crear método de pago:', error)
            notification.warning({
              message: 'Error al crear método de pago',
              description: 'Continuaremos con la creación de la caja',
            })
          }
        }

        // Crear la caja principal con el desplieguePagoId si existe
        const response = await cajaPrincipalApi.create({
          user_id: values.user_id,
          nombre: values.nombre,
          metodo_pago_id: desplieguePagoId,
        })

        console.log('=== Creando caja principal ===', {
          user_id: values.user_id,
          nombre: values.nombre,
          metodo_pago_id: desplieguePagoId,
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
