'use client'

import { Form, Checkbox } from 'antd'
import { useEffect, useState } from 'react'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import SelectDespliegueDePago from '~/app/_components/form/selects/select-despliegue-de-pago'
import type { SubCaja, UpdateSubCajaRequest } from '~/lib/api/caja-principal'
import useEditarSubCaja from '../_hooks/use-editar-sub-caja'

type ModalEditarSubCajaProps = {
    open: boolean
    setOpen: (open: boolean) => void
    subCaja: SubCaja
    onSuccess?: () => void
}

export default function ModalEditarSubCaja({
    open,
    setOpen,
    subCaja,
    onSuccess,
}: ModalEditarSubCajaProps) {
    const [form] = Form.useForm<UpdateSubCajaRequest>()
    const [aceptaTodos, setAceptaTodos] = useState(subCaja.acepta_todos_metodos)
    const [metodosSeleccionados, setMetodosSeleccionados] = useState<string[]>([])

    const { editarSubCaja, loading } = useEditarSubCaja({
        onSuccess: () => {
            setOpen(false)
            form.resetFields()
            onSuccess?.()
        },
    })

    useEffect(() => {
        if (open) {
            const desplieguesIds = subCaja.acepta_todos_metodos
                ? ['*']
                : subCaja.despliegues_pago_ids

            form.setFieldsValue({
                nombre: subCaja.nombre,
                despliegues_pago_ids: desplieguesIds,
                tipos_comprobante: subCaja.tipos_comprobante,
                proposito: subCaja.proposito,
            })
            setAceptaTodos(subCaja.acepta_todos_metodos)
            setMetodosSeleccionados(desplieguesIds)
        }
    }, [open, subCaja, form])

    const handleSubmit = (values: UpdateSubCajaRequest) => {
        const payload = {
            ...values,
            despliegues_pago_ids: aceptaTodos ? ['*'] : metodosSeleccionados,
        }
        editarSubCaja(subCaja.id, payload)
    }

    return (
        <ModalForm
            modalProps={{
                width: 700,
                title: <TitleForm>Editar Sub-Caja</TitleForm>,
                centered: true,
                okButtonProps: { loading, disabled: loading },
                okText: 'Guardar Cambios',
            }}
            onCancel={() => {
                form.resetFields()
                setAceptaTodos(subCaja.acepta_todos_metodos)
            }}
            open={open}
            setOpen={setOpen}
            formProps={{
                form,
                onFinish: handleSubmit,
                layout: 'vertical',
            }}
        >
            <div className='space-y-4'>
                <div className='p-3 bg-blue-50 rounded border border-blue-200'>
                    <p className='text-sm text-slate-700'>
                        <strong>Código:</strong> {subCaja.codigo}
                    </p>
                    <p className='text-sm text-slate-700'>
                        <strong>Tipo:</strong> {subCaja.tipo_caja_label}
                    </p>
                    {subCaja.es_caja_chica && (
                        <p className='text-xs text-amber-600 mt-1'>
                            <strong>Nota:</strong> La Caja Chica tiene restricciones especiales
                        </p>
                    )}
                </div>

                <LabelBase label='Nombre de la Sub-Caja' orientation='column'>
                    <InputBase
                        placeholder='Ej: Caja Ventas Principal'
                        propsForm={{
                            name: 'nombre',
                            rules: [
                                { required: true, message: 'Ingresa el nombre de la sub-caja' },
                                { min: 3, message: 'Mínimo 3 caracteres' },
                            ],
                        }}
                    />
                </LabelBase>

                <LabelBase label='Métodos de Pago Aceptados' orientation='column'>
                    <div className='space-y-2'>
                        <Checkbox
                            checked={aceptaTodos}
                            onChange={(e) => {
                                const checked = e.target.checked
                                setAceptaTodos(checked)
                                if (checked) {
                                    form.setFieldValue('despliegues_pago_ids', ['*'])
                                } else {
                                    form.setFieldValue('despliegues_pago_ids', [])
                                }
                            }}
                        >
                            Aceptar todos los métodos de pago
                        </Checkbox>

                        {!aceptaTodos && (
                            <SelectDespliegueDePago
                                mode='multiple'
                                placeholder='Selecciona los métodos de pago'
                                value={metodosSeleccionados}
                                onChange={(value) => {
                                    setMetodosSeleccionados(value as string[])
                                    form.setFieldValue('despliegues_pago_ids', value)
                                }}
                                propsForm={{
                                    name: 'despliegues_pago_ids',
                                    rules: [
                                        {
                                            required: true,
                                            message: 'Selecciona al menos un método de pago',
                                        },
                                    ],
                                }}
                            />
                        )}
                    </div>
                </LabelBase>

                <LabelBase label='Tipos de Comprobante' orientation='column'>
                    <Form.Item
                        name='tipos_comprobante'
                        rules={[
                            {
                                required: true,
                                message: 'Selecciona al menos un tipo de comprobante',
                            },
                        ]}
                    >
                        <Checkbox.Group
                            options={[
                                { label: 'Factura', value: '01' },
                                { label: 'Boleta', value: '03' },
                                { label: 'Nota de Venta', value: 'nv' },
                            ]}
                        />
                    </Form.Item>
                </LabelBase>

                <LabelBase label='Propósito (Opcional)' orientation='column'>
                    <InputBase
                        placeholder='Ej: Para ventas al por mayor'
                        propsForm={{
                            name: 'proposito',
                        }}
                    />
                </LabelBase>
            </div>
        </ModalForm>
    )
}
