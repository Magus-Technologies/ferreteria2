'use client'

import { Form, Input, InputNumber, Select, Switch, message } from 'antd'
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { crearGastoExtra, updateGastoExtra, type CrearGastoExtraData, type GastoExtra } from '~/lib/api/gasto-extra'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { usuariosApi } from '~/lib/api/usuarios'
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
    const [form] = Form.useForm<CrearGastoExtraData & { requiereAprobacion?: boolean }>()
    const queryClient = useQueryClient()
    const [requiereAprobacion, setRequiereAprobacion] = useState(false)
    const isEditing = !!gastoEdit

    // Consultas

    const { data: supervisoresRes, isLoading: loadingSupervisores } = useQuery({
        queryKey: ['supervisores'],
        queryFn: () => usuariosApi.getSupervisores(),
        enabled: open && requiereAprobacion
    })

    // Mutación de creación
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

    // Mutación de actualización
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

    const supervisores = supervisoresRes?.data?.data || []

    useEffect(() => {
        if (open && gastoEdit) {
            form.setFieldsValue({
                monto: gastoEdit.monto,
                concepto: gastoEdit.concepto,
                despliegue_pago_id: gastoEdit.despliegue_pago_id || undefined,
            })
        }
    }, [open, gastoEdit, form])

    // Manejo de modal
    const handleClose = () => {
        form.resetFields()
        setRequiereAprobacion(false)
        onClose()
    }

    const handleFinish = (values: CrearGastoExtraData & { requiereAprobacion?: boolean }) => {
        // En modo edición no se puede aprobar
        if (!values.requiereAprobacion || isEditing) {
            delete values.supervisor_id
            delete values.supervisor_password
        }

        // Extraer el despliegue_pago_id (UUID) del valor compuesto "subCajaId-desplieguePagoId" emitido por el Select
        const desplieguePagoId = values.despliegue_pago_id?.includes('-')
            ? values.despliegue_pago_id.split('-')[1]
            : values.despliegue_pago_id;

        if (isEditing) {
            updateMutation.mutate({
                id: gastoEdit.id,
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
    }

    return (
        <ModalForm
            open={open}
            setOpen={(val) => { if (!val) handleClose() }}
            modalProps={{
                width: 600,
                centered: true,
                title: <TitleForm>{isEditing ? 'Editar Gasto Operativo' : 'Registrar Nuevo Gasto Operativo'}</TitleForm>,
                okText: isEditing ? 'Guardar Cambios' : (requiereAprobacion ? 'Guardar y Aprobar' : 'Guardar como Pendiente'),
                cancelText: "Cancelar",
                destroyOnClose: true,
                okButtonProps: {
                    loading: isEditing ? updateMutation.isPending : crearMutation.isPending,
                    className: 'bg-rose-600 hover:bg-rose-700'
                }
            }}
            formProps={{
                form,
                layout: "vertical",
                onFinish: handleFinish,
                className: "mt-4",
                initialValues: {
                    requiereAprobacion: false
                },
                onValuesChange: (changed) => {
                    if (changed.requiereAprobacion !== undefined) {
                        setRequiereAprobacion(changed.requiereAprobacion)
                    }
                }
            }}
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <LabelBase label="Monto (S/.)" orientation="column">
                        <Form.Item
                            name="monto"
                            rules={[{ required: true, message: 'Ingrese el monto' }]}
                            className="mb-0"
                        >
                            <InputNumber
                                className="w-full"
                                min={0.01}
                                step={0.1}
                                precision={2}
                                placeholder="0.00"
                                prefix="S/"
                            />
                        </Form.Item>
                    </LabelBase>

                    <LabelBase label="Método de Pago" orientation="column">
                        <SelectDespliegueDePago
                            placeholder="Selecciona el método de pago"
                            propsForm={{
                                name: 'despliegue_pago_id',
                                rules: [{ required: true, message: 'Selecciona un método de pago' }],
                            }}
                        />
                    </LabelBase>
                </div>

                <LabelBase label="Concepto o Motivo del Gasto" orientation="column">
                    <Form.Item
                        name="concepto"
                        rules={[{ required: true, message: 'El concepto es obligatorio' }]}
                        className="mb-0"
                    >
                        <Input.TextArea rows={3} placeholder="Detalle el motivo del gasto..." />
                    </Form.Item>
                </LabelBase>

                {!isEditing && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3">
                        <Form.Item
                            name="requiereAprobacion"
                            label="¿Aprobar inmediatamente?"
                            valuePropName="checked"
                            className="mb-1"
                        >
                            <Switch />
                        </Form.Item>

                        {requiereAprobacion && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 mt-2">
                                <Form.Item
                                    name="supervisor_id"
                                    label="Supervisor"
                                    rules={[{ required: true, message: 'Seleccione un supervisor' }]}
                                    className="mb-2 md:mb-0"
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
                                    rules={[{ required: true, message: 'Ingrese contraseña' }]}
                                    className="mb-2 md:mb-0"
                                >
                                    <Input.Password placeholder="Contraseña de supervisor" />
                                </Form.Item>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mb-0 mt-1">
                            {requiereAprobacion
                                ? 'El dinero saldrá de caja inmediatamente y formará parte del cálculo del cierre de caja.'
                                : 'Se guardará como Pendiente. No afectará a la caja hasta que sea aprobado por un supervisor.'}
                        </p>
                    </div>
                )}
            </div>
        </ModalForm>
    )
}
