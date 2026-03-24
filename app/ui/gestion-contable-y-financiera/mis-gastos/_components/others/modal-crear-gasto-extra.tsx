'use client'

import { Form, Input, InputNumber } from 'antd'
import { useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useApp from 'antd/es/app/useApp'
import { crearGastoExtra, updateGastoExtra, type CrearGastoExtraData, type GastoExtra } from '~/lib/api/gasto-extra'
import ModalForm from '~/components/modals/modal-form'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import LabelBase from '~/components/form/label-base'
import TitleForm from '~/components/form/title-form'

interface ModalCrearGastoExtraProps {
    open: boolean
    onClose: () => void
    gastoEdit?: GastoExtra
}

export default function ModalCrearGastoExtra({ open, onClose, gastoEdit }: ModalCrearGastoExtraProps) {
    const [form] = Form.useForm<CrearGastoExtraData>()
    const queryClient = useQueryClient()
    const { message } = useApp()
    const isEditing = !!gastoEdit

    const crearMutation = useMutation({
        mutationFn: crearGastoExtra,
        onSuccess: () => {
            message.success('Gasto registrado con éxito')
            queryClient.invalidateQueries({ queryKey: ['gastos-extras'] })
            queryClient.invalidateQueries({ queryKey: ['gastos-extras-resumen'] })
            handleClose()
        },
        onError: (error: Error) => {
            message.error(error.message || 'Error al registrar el gasto')
        }
    })

    const updateMutation = useMutation({
        mutationFn: updateGastoExtra,
        onSuccess: () => {
            message.success('Gasto actualizado con éxito')
            queryClient.invalidateQueries({ queryKey: ['gastos-extras'] })
            queryClient.invalidateQueries({ queryKey: ['gastos-extras-resumen'] })
            handleClose()
        },
        onError: (error: Error) => {
            message.error(error.message || 'Error al actualizar el gasto')
        }
    })

    useEffect(() => {
        if (open && gastoEdit) {
            form.setFieldsValue({
                monto: gastoEdit.monto,
                concepto: gastoEdit.concepto,
                despliegue_pago_id: gastoEdit.despliegue_pago_id || undefined,
            })
        }
    }, [open, gastoEdit, form])

    const handleClose = () => {
        form.resetFields()
        onClose()
    }

    const handleFinish = useCallback((values: CrearGastoExtraData) => {
        const desplieguePagoId = values.despliegue_pago_id?.includes('-')
            ? values.despliegue_pago_id.split('-')[1]
            : values.despliegue_pago_id

        if (isEditing) {
            updateMutation.mutate({
                id: gastoEdit!.id,
                data: {
                    monto: values.monto,
                    concepto: values.concepto,
                    despliegue_pago_id: desplieguePagoId
                }
            })
        } else {
            crearMutation.mutate({
                ...values,
                despliegue_pago_id: desplieguePagoId
            })
        }
    }, [isEditing, gastoEdit, updateMutation, crearMutation])

    return (
        <ModalForm
            open={open}
            setOpen={(val) => { if (!val) handleClose() }}
            modalProps={{
                width: 700,
                centered: true,
                title: <TitleForm>{isEditing ? 'Editar Gasto Operativo' : 'Registrar Nuevo Gasto Operativo'}</TitleForm>,
                okText: isEditing ? 'Guardar Cambios' : 'Guardar',
                cancelText: 'Cancelar',
                destroyOnHidden: true,
                okButtonProps: {
                    loading: isEditing ? updateMutation.isPending : crearMutation.isPending,
                    className: 'bg-rose-600 hover:bg-rose-700'
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
                        <Form.Item
                            name="monto"
                            rules={[{ required: true, message: 'Ingrese el monto' }]}
                            className="mb-0 w-full"
                        >
                            <InputNumber
                                className="!w-full"
                                min={0.01}
                                step={0.1}
                                precision={2}
                                placeholder="0.00"
                                prefix="S/"
                            />
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

                <LabelBase label="Concepto o Motivo del Gasto" orientation="column" className="w-full">
                    <Form.Item
                        name="concepto"
                        rules={[{ required: true, message: 'El concepto es obligatorio' }]}
                        className="mb-0 w-full"
                    >
                        <Input.TextArea rows={3} className="!w-full" placeholder="Detalle el motivo del gasto..." />
                    </Form.Item>
                </LabelBase>
            </div>
        </ModalForm>
    )
}
