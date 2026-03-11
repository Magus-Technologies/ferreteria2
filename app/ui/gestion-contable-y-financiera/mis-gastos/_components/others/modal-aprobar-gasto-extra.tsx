'use client'

import { Form, Input, Select, message } from 'antd'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { aprobarGastoExtra } from '~/lib/api/gasto-extra'
import { usuariosApi } from '~/lib/api/usuarios'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { useCheckAperturaDiaria } from '../../_hooks/use-check-apertura-diaria'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'

interface ModalAprobarGastoExtraProps {
    open: boolean
    onClose: () => void
    gastoId: string | null
}

export default function ModalAprobarGastoExtra({ open, onClose, gastoId }: ModalAprobarGastoExtraProps) {
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    const [openAperturaModal, setOpenAperturaModal] = useState(false)
    const { hasApertura, refetchApertura } = useCheckAperturaDiaria()

    // Consultar supervisores
    const { data: supervisoresRes, isLoading: loadingSupervisores } = useQuery({
        queryKey: ['supervisores'],
        queryFn: () => usuariosApi.getSupervisores(),
        enabled: open
    })

    const supervisores = supervisoresRes?.data?.data || []

    // Mutación
    const aprobarMutation = useMutation({
        mutationFn: (data: any) => aprobarGastoExtra(gastoId!, data),
        onSuccess: () => {
            message.success('Gasto aprobado y debitado de caja con éxito')
            queryClient.invalidateQueries({ queryKey: ['gastos-extras'] })
            queryClient.invalidateQueries({ queryKey: ['gastos-extras-resumen'] })
            handleClose()
        },
        onError: (error: Error) => {
            const errorMsg = error.message || 'Error al aprobar el gasto'
            if (errorMsg.includes('No hay apertura de caja')) {
                message.error('No hay apertura de caja para hoy. No se puede aprobar el gasto.')
            } else {
                message.error(errorMsg)
            }
        }
    })

    const handleClose = () => {
        form.resetFields()
        onClose()
    }

    const handleFinish = (values: any) => {
        if (!gastoId) return
        
        // Validar apertura antes de aprobar
        if (!hasApertura) {
            console.log('🔴 No hay apertura de hoy - abriendo modal')
            setOpenAperturaModal(true)
            return
        }
        
        aprobarMutation.mutate(values)
    }

    return (
        <>
            <ModalForm
                open={open}
                setOpen={(val) => { if (!val) handleClose() }}
                modalProps={{
                    width: 500,
                    centered: true,
                    title: <TitleForm><span className="text-emerald-700">Aprobar Gasto Extra</span></TitleForm>,
                    okText: "Validar y Aprobar",
                    cancelText: "Cancelar",
                    destroyOnClose: true,
                    okButtonProps: {
                        loading: aprobarMutation.isPending,
                        className: 'bg-emerald-600 hover:bg-emerald-700'
                    }
                }}
                formProps={{
                    form,
                    layout: 'vertical',
                    onFinish: handleFinish
                }}
            >
                <div className='py-4'>
                    <div className='mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded'>
                        <p className='text-sm text-slate-700 font-medium'>
                            Estás a punto de aprobar este Gasto Extra.
                        </p>
                        <p className='text-xs text-slate-600 mt-1'>
                            Al aprobarlo, el dinero se descontará inmediatamente del saldo de caja y pasará a formar parte del cálculo de cierre.
                        </p>
                    </div>
                    <Form.Item
                        name="supervisor_id"
                        label="Autorizado por (Supervisor)"
                        rules={[{ required: true, message: 'Seleccione un supervisor' }]}
                    >
                        <Select loading={loadingSupervisores} placeholder="Seleccione supervisor...">
                            {supervisores.map((sup: any) => (
                                <Select.Option key={sup.id} value={sup.id}>
                                    {sup.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="supervisor_password"
                        label="Contraseña"
                        rules={[{ required: true, message: 'La contraseña es requerida' }]}
                    >
                        <Input.Password placeholder="Ingrese contraseña de autorización" />
                    </Form.Item>
                </div>
            </ModalForm>

            {/* Modal de Apertura - se abre si intenta aprobar sin apertura */}
            <ModalAperturarCaja
                open={openAperturaModal}
                setOpen={setOpenAperturaModal}
                onSuccess={async () => {
                    setOpenAperturaModal(false)
                    await refetchApertura()
                }}
            />
        </>
    )
}
