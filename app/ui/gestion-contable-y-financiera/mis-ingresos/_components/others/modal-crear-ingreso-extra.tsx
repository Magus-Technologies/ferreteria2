'use client'

import { Form, Input, InputNumber } from 'antd'
import { useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { crearIngresoExtra, updateIngresoExtra, type CrearIngresoExtraData, type IngresoExtra } from '~/lib/api/ingreso-extra'
import ModalForm from '~/components/modals/modal-form'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import LabelBase from '~/components/form/label-base'
import TitleForm from '~/components/form/title-form'

interface ModalCrearIngresoExtraProps {
    open: boolean
    onClose: () => void
    ingresoEdit?: IngresoExtra
}

export default function ModalCrearIngresoExtra({ open, onClose, ingresoEdit }: ModalCrearIngresoExtraProps) {
    const [form] = Form.useForm<CrearIngresoExtraData>()
    const queryClient = useQueryClient()
    const { message } = useApp()
    const isEditing = !!ingresoEdit

    const crearMutation = useMutation({
        mutationFn: crearIngresoExtra,
        onSuccess: () => {
            message.success('Ingreso registrado con éxito')
            queryClient.invalidateQueries({ queryKey: ['ingresos-extras'] })
            queryClient.invalidateQueries({ queryKey: ['ingresos-extras-resumen'] })
            handleClose()
        },
        onError: (error: Error) => {
            message.error(error.message || 'Error al registrar el Ingreso')
        }
    })

    const updateMutation = useMutation({
        mutationFn: updateIngresoExtra,
        onSuccess: () => {
            message.success('Ingreso actualizado con éxito')
            queryClient.invalidateQueries({ queryKey: ['ingresos-extras'] })
            queryClient.invalidateQueries({ queryKey: ['ingresos-extras-resumen'] })
            handleClose()
        },
        onError: (error: Error) => {
            message.error(error.message || 'Error al actualizar el Ingreso')
        }
    })

    useEffect(() => {
        if (open && ingresoEdit) {
            form.setFieldsValue({
                monto: ingresoEdit.monto,
                concepto: ingresoEdit.concepto,
                despliegue_pago_id: ingresoEdit.despliegue_pago_id || undefined,
            })
        }
    }, [open, ingresoEdit, form])

    const handleClose = () => {
        form.resetFields()
        onClose()
    }

    const handleFinish = useCallback((values: CrearIngresoExtraData) => {
        const desplieguePagoId = values.despliegue_pago_id?.includes('-')
            ? values.despliegue_pago_id.split('-')[1]
            : values.despliegue_pago_id

        if (isEditing) {
            updateMutation.mutate({
                id: ingresoEdit!.id,
                data: { monto: values.monto, concepto: values.concepto, despliegue_pago_id: desplieguePagoId }
            })
        } else {
            crearMutation.mutate({ ...values, despliegue_pago_id: desplieguePagoId })
        }
    }, [isEditing, ingresoEdit, updateMutation, crearMutation])

    return (
        <ModalForm
            open={open}
            setOpen={(val) => { if (!val) handleClose() }}
            modalProps={{
                width: 700,
                centered: true,
                title: <TitleForm>{isEditing ? 'Editar Ingreso Operativo' : 'Registrar Nuevo Ingreso Operativo'}</TitleForm>,
                okText: isEditing ? 'Guardar Cambios' : 'Guardar',
                cancelText: 'Cancelar',
                destroyOnHidden: true,
                okButtonProps: {
                    loading: isEditing ? updateMutation.isPending : crearMutation.isPending,
                    className: 'bg-emerald-600 hover:bg-emerald-700'
                }
            }}
            formProps={{
                form,
                layout: 'vertical',
                onFinish: handleFinish,
                className: 'mt-4',
            }}
        >
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                    <LabelBase label="Monto (S/.)" orientation="column" className="w-full">
                        <Form.Item name="monto" rules={[{ required: true, message: 'Ingrese el monto' }]} className="mb-0 w-full">
                            <InputNumber className="!w-full" min={0.01} step={0.1} precision={2} placeholder="0.00" prefix="S/" />
                        </Form.Item>
                    </LabelBase>

                    <div className="col-span-2">
                        <LabelBase label="Método de Pago" orientation="column" className="w-full">
                            <SelectDespliegueDePago
                                placeholder="Selecciona el método de pago"
                                className="!w-full"
                                propsForm={{
                                    name: 'despliegue_pago_id',
                                    rules: [{ required: true, message: 'Selecciona un método de pago' }],
                                }}
                            />
                        </LabelBase>
                    </div>
                </div>

                <LabelBase label="Concepto o Motivo del Ingreso" orientation="column" className="w-full">
                    <Form.Item name="concepto" rules={[{ required: true, message: 'El concepto es obligatorio' }]} className="mb-0 w-full">
                        <Input.TextArea rows={3} className="!w-full" placeholder="Detalle el motivo del ingreso..." />
                    </Form.Item>
                </LabelBase>
            </div>
        </ModalForm>
    )
}
