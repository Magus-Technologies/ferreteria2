import { useState } from 'react'
import { message, Modal } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { cierreCajaApi, type CerrarCajaRequest } from '../../../../../lib/api/cierre-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCerrarCaja() {
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()

    const cerrarCaja = async (
        aperturaId: string,
        data: CerrarCajaRequest
    ): Promise<boolean> => {
        try {
            setLoading(true)
            const response = await cierreCajaApi.cerrarCaja(aperturaId, data)

            if (response.success) {
                // Invalidar cachés relacionadas
                queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
                queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS] })
                queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS] })
                
                // Mostrar modal de éxito
                Modal.success({
                    title: '¡Arqueo Diario Registrado Exitosamente!',
                    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                    content: (
                        <div className='space-y-2'>
                            <p className='text-base'>El arqueo diario se ha registrado correctamente.</p>
                            <p className='text-sm text-blue-600'>Puede continuar operando normalmente. La caja se reiniciará automáticamente al día siguiente.</p>
                            <div className='bg-gray-50 p-3 rounded mt-3'>
                                <p className='text-sm text-gray-600'>
                                    <strong>Fecha de arqueo:</strong> {new Date().toLocaleString('es-PE')}
                                </p>
                                {data.comentarios && (
                                    <p className='text-sm text-gray-600 mt-1'>
                                        <strong>Comentarios:</strong> {data.comentarios}
                                    </p>
                                )}
                                {data.email_reporte && (
                                    <p className='text-sm text-gray-600 mt-1'>
                                        <strong>Reporte enviado a:</strong> {data.email_reporte}
                                    </p>
                                )}
                            </div>
                        </div>
                    ),
                    okText: 'Aceptar',
                    width: 500,
                })
                return true
            } else {
                message.error('No se pudo registrar el arqueo')
                return false
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Error al registrar arqueo'
            message.error(errorMsg)
            console.error('Error al registrar arqueo:', err)
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        cerrarCaja,
        loading,
    }
}
