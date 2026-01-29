import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'

interface DepositarSubCajaData {
    despliegue_pago_origen_id: string
    despliegue_pago_destino_id: string
    monto: number
    motivo: string
}

export function useDepositarSubCaja() {
    const { message, notification } = useApp()
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()

    const depositar = async (data: DepositarSubCajaData) => {
        setLoading(true)
        try {
            // Aquí iría la llamada al API
            // const response = await movimientoInternoApi.crear(data)

            message.success('Depósito de seguridad registrado exitosamente')

            queryClient.invalidateQueries({ queryKey: ['caja-activa'] })
            queryClient.invalidateQueries({ queryKey: ['movimientos-internos'] })

            return true
        } catch (error) {
            console.error('Error al depositar:', error)
            notification.error({
                message: 'Error inesperado',
                description: 'Ocurrió un error al registrar el depósito',
            })
            return false
        } finally {
            setLoading(false)
        }
    }

    return { depositar, loading }
}
