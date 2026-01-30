import { useState } from 'react'
import { message, Modal } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { cierreCajaApi, type CerrarCajaRequest } from '../../../../../lib/api/cierre-caja'

export function useCerrarCaja() {
    const [loading, setLoading] = useState(false)

    const cerrarCaja = async (
        aperturaId: string,
        data: CerrarCajaRequest
    ): Promise<boolean> => {
        try {
            setLoading(true)
            const response = await cierreCajaApi.cerrarCaja(aperturaId, data)

            if (response.success) {
                // Mostrar modal de éxito
                Modal.success({
                    title: '¡Caja Cerrada Exitosamente!',
                    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                    content: (
                        <div className='space-y-2'>
                            <p className='text-base'>La caja se ha cerrado correctamente.</p>
                            <div className='bg-gray-50 p-3 rounded mt-3'>
                                <p className='text-sm text-gray-600'>
                                    <strong>Fecha de cierre:</strong> {new Date().toLocaleString('es-PE')}
                                </p>
                                {data.comentarios && (
                                    <p className='text-sm text-gray-600 mt-1'>
                                        <strong>Comentarios:</strong> {data.comentarios}
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
                message.error('No se pudo cerrar la caja')
                return false
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Error al cerrar caja'
            message.error(errorMsg)
            console.error('Error al cerrar caja:', err)
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
