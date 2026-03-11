'use client'

// Hook para validar apertura diaria
import { Form, Input, Select, message } from 'antd'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { aprobarIngresoExtra } from '~/lib/api/ingreso-extra'
import { usuariosApi } from '~/lib/api/usuarios'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { useCheckAperturaDiaria } from '~/app/ui/gestion-contable-y-financiera/mis-ingresos/_hooks/use-check-apertura-diaria'
import ModalAperturarCaja from '~/app/ui/facturacion-electronica/_components/modals/modal-aperturar-caja'

interface ModalAprobarIngresoExtraProps {
    open: boolean
    onClose: () => void
    IngresoId: string | null
}

export default function ModalAprobarIngresoExtra({ open, onClose, IngresoId }: ModalAprobarIngresoExtraProps) {
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
        mutationFn: (data: any) => aprobarIngresoExtra(IngresoId!, data),
        onSuccess: () => {
            message.success('Ingreso aprobado y debitado de caja con éxito')
            queryClient.invalidateQueries({ queryKey: ['ingresos-extras'] })
            queryClient.invalidateQueries({ queryKey: ['ingresos-extras-resumen'] })
            handleClose()
        },
        onError: (error: Error) => {
            message.error(error.message || 'Error al aprobar el Ingreso')
        }
    })

    const handleClose = () => {
        form.resetFields()
        onClose()
    }

    const handleFinish = (values: any) => {
        if (!IngresoId) return
        
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
                    title: <TitleForm><span className="text-emerald-700">Aprobar Ingreso Extra</span></TitleForm>,
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
                            Estás a punto de aprobar este Ingreso Extra.
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

