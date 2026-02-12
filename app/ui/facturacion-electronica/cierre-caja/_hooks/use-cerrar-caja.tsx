import React, { useState } from 'react'
import { message, Modal } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { cierreCajaApi, type CerrarCajaRequest } from '../../../../../lib/api/cierre-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCerrarCaja() {
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()

    const cerrarCaja = async (
        aperturaId: string,
        data: CerrarCajaRequest,
        cajaActiva?: any,
        empresaData?: any
    ): Promise<boolean> => {
        try {
            setLoading(true)
            const response = await cierreCajaApi.cerrarCaja(aperturaId, data)

            if (response.success) {
                // Invalidar cachés relacionadas
                queryClient.invalidateQueries({ queryKey: [QueryKeys.CAJA_ACTIVA] })
                queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS] })
                queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS] })
                
                // Si hay email, enviar el ticket automáticamente
                if (data.email_reporte && empresaData) {
                    try {
                        // IMPORTANTE: Obtener los datos ACTUALIZADOS desde el backend
                        console.log('📥 Obteniendo datos actualizados del cierre...')
                        const cajaActualizada = await cierreCajaApi.obtenerCajaActiva()
                        
                        if (!cajaActualizada.success || !cajaActualizada.data) {
                            throw new Error('No se pudieron obtener los datos actualizados del cierre')
                        }
                        
                        console.log('✅ Datos actualizados obtenidos:', {
                            monto_cierre_efectivo: cajaActualizada.data.monto_cierre_efectivo,
                            monto_cierre_cuentas: cajaActualizada.data.monto_cierre_cuentas,
                            conteo_billetes_monedas: cajaActualizada.data.conteo_billetes_monedas
                        })
                        
                        // Generar el PDF usando react-pdf con los datos ACTUALIZADOS
                        const { pdf } = await import('@react-pdf/renderer')
                        const { default: DocCierreCajaTicket } = await import('../_components/docs/doc-cierre-caja-ticket')
                        
                        // Crear el documento PDF con datos actualizados
                        const doc = <DocCierreCajaTicket
                            data={cajaActualizada.data as any}
                            nro_doc={cajaActualizada.data.id}
                            empresa={empresaData}
                            show_logo_html={false}
                        />
                        
                        // Generar el blob del PDF
                        const pdfBlob = await pdf(doc).toBlob()
                        
                        // Enviar el PDF al backend
                        await cierreCajaApi.enviarTicketEmail(aperturaId, data.email_reporte, pdfBlob)
                        
                        console.log('✅ Ticket enviado automáticamente a:', data.email_reporte)
                    } catch (emailError) {
                        console.error('⚠️ Error al enviar ticket automáticamente:', emailError)
                        // No fallar el cierre si falla el envío del email
                    }
                }
                
                // Mostrar modal de éxito
                Modal.success({
                    title: '¡Arqueo Diario Registrado Exitosamente!',
                    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                    content: (
                        <div className='space-y-2'>
                            <p className='text-base'>El arqueo diario se ha registrado correctamente.</p>
                            {data.email_reporte && (
                                <p className='text-sm text-green-600'>
                                    ✓ Ticket enviado automáticamente a: <strong>{data.email_reporte}</strong>
                                </p>
                            )}
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
            console.error('Error al registrar arqueo:', err)
            
            // Extraer mensaje de error detallado
            const errorData = err.response?.data
            let errorMsg = 'Error al registrar arqueo'
            
            if (errorData) {
                // Si hay errores de validación específicos
                if (errorData.errors) {
                    const firstError = Object.values(errorData.errors)[0]
                    errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError)
                } 
                // Si hay mensaje general
                else if (errorData.message) {
                    errorMsg = errorData.message
                }
            }
            
            // Mostrar modal de error con más detalles
            Modal.error({
                title: 'Error al Registrar Arqueo',
                icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                content: (
                    <div className='space-y-2'>
                        <p className='text-base'>{errorMsg}</p>
                        {errorData?.errors && (
                            <div className='bg-red-50 p-3 rounded mt-3'>
                                <p className='text-sm font-semibold text-red-800 mb-2'>Detalles:</p>
                                {Object.entries(errorData.errors).map(([field, errors]: [string, any]) => (
                                    <p key={field} className='text-sm text-red-600'>
                                        • {Array.isArray(errors) ? errors.join(', ') : errors}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                ),
                okText: 'Entendido',
                width: 500,
            })
            
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
