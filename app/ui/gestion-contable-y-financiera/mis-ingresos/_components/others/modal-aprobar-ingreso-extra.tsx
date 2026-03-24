'use client'

import { Form, Input, Select, message } from 'antd'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { aprobarIngresoExtra, type AprobarIngresoExtraData } from '~/lib/api/ingreso-extra'
import { usuariosApi } from '~/lib/api/usuarios'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { useCheckAperturaDiaria } from '~/app/ui/gestion-contable-y-financiera/mis-ingresos/_hooks/use-check-apertura-diaria'
import AperturaGuard from '~/app/ui/_components/apertura-auto-check'

interface ModalAprobarIngresoExtraProps {
    open: boolean
    onClose: () => void
    IngresoId: string | null
}

export default function ModalAprobarIngresoExtra({ open, onClose, IngresoId }: ModalAprobarIngresoExtraProps) {
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    useCheckAperturaDiaria()

    const { data: supervisoresRes, isLoading: loadingSupervisores } = useQuery({
        queryKey: ['supervisores'],
        queryFn: () => usuariosApi.getSupervisores(),
        enabled: open
    })

    const supervisores = supervisoresRes?.data?.data || []

    const aprobarMutation = useMutation({
        mutationFn: (data: AprobarIngresoExtraData) => aprobarIngresoExtra(IngresoId!, data),
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

    const handleFinish = (values: AprobarIngresoExtraData) => {
        if (!IngresoId) return
        aprobarMutation.mutate(values)
    }

    return (
        <>
        <AperturaGuard />
        <ModalForm
            open={open}
            setOpen={(val) => { if (!val) handleClose() }}
            modalProps={{
                width: 500,
                centered: true,
                title: <TitleForm><span className="text-emerald-700">Aprobar Ingreso Extra</span></TitleForm>,
                okText: 'Validar y Aprobar',
                cancelText: 'Cancelar',
                destroyOnHidden: true,
                okButtonProps: {
                    loading: aprobarMutation.isPending,
                    className: 'bg-emerald-600 hover:bg-emerald-700'
                }
            }}
            formProps={{ form, layout: 'vertical', onFinish: handleFinish }}
        >
            <div className='py-4'>
                <Form.Item name="supervisor_id" label="Autorizado por (Supervisor)" rules={[{ required: true, message: 'Seleccione un supervisor' }]}>
                    <Select loading={loadingSupervisores} placeholder="Seleccione supervisor...">
                        {supervisores.map((sup: { id: string; name: string }) => (
                            <Select.Option key={sup.id} value={sup.id}>{sup.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item name="supervisor_password" label="Contraseña" rules={[{ required: true, message: 'La contraseña es requerida' }]}>
                    <Input.Password placeholder="Ingrese contraseña de autorización" />
                </Form.Item>
            </div>
        </ModalForm>
        </>
    )
}
