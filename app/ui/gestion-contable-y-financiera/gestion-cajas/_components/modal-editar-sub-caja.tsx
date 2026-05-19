'use client'

import { Form, Checkbox } from 'antd'
import { useEffect, useState } from 'react'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import type { SubCaja, UpdateSubCajaRequest } from '~/lib/api/caja-principal'
import useEditarSubCaja from '../_hooks/use-editar-sub-caja'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { despliegueDePagoApi } from '~/lib/api/despliegue-de-pago'
import { cajaPrincipalApi } from '~/lib/api/caja-principal'

type ModalEditarSubCajaProps = {
    open: boolean
    setOpen: (open: boolean) => void
    subCaja: SubCaja
    cajaPrincipalId: number
    onSuccess?: () => void
}

export default function ModalEditarSubCaja({
    open,
    setOpen,
    subCaja,
    cajaPrincipalId,
    onSuccess,
}: ModalEditarSubCajaProps) {
    const [form] = Form.useForm<UpdateSubCajaRequest>()
    const [aceptaTodos, setAceptaTodos] = useState(subCaja.acepta_todos_metodos)
    const [metodosSeleccionados, setMetodosSeleccionados] = useState<string[]>([])

    // Cargar despliegues de pago excluyendo los ya usados por otras sub-cajas
    const { data: desplieguesDisponibles } = useQuery({
        queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO, cajaPrincipalId, subCaja.id],
        queryFn: async () => {
            const result = await despliegueDePagoApi.getAll({
                mostrar: true,
                exclude_used_by_caja_principal_id: cajaPrincipalId,
                except_sub_caja_id: subCaja.id // Pasar el ID de la sub-caja siendo editada
            })
            return result.data?.data || []
        },
        enabled: open && !!cajaPrincipalId,
    })

    // Cargar todos los despliegues para poder mostrar los ya asignados a esta sub-caja
    const { data: todosLosDespliegues } = useQuery({
        queryKey: [QueryKeys.DESPLIEGUE_DE_PAGO, 'all'],
        queryFn: async () => {
            const result = await despliegueDePagoApi.getAll({ mostrar: true })
            return result.data?.data || []
        },
        enabled: open,
    })

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

    // Crear opciones: despliegues disponibles (ya filtrados por el backend)
    // más los ya asignados a esta sub-caja
    const desplieguesActualesIds = new Set(subCaja.despliegues_pago_ids || [])
    const opcionesDespliegues = [
        ...(desplieguesDisponibles || []),
        ...(todosLosDespliegues || []).filter(d => desplieguesActualesIds.has(d.id))
    ]
        .filter((d, index, self) => self.findIndex(item => item.id === d.id) === index) // Eliminar duplicados
        .map((d: any) => ({
            value: d.id,
            label: d.label || d.name || d.id, // Usar label que incluye banco/método
        }))

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
                            <>
                                <SelectBase
                                    mode='multiple'
                                    placeholder='Selecciona los métodos de pago'
                                    value={metodosSeleccionados}
                                    onChange={(value) => {
                                        setMetodosSeleccionados(value as string[])
                                        form.setFieldValue('despliegues_pago_ids', value)
                                    }}
                                    options={opcionesDespliegues}
                                    showSearch
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
                                {(desplieguesDisponibles?.length || 0) < (todosLosDespliegues?.length || 0) && (
                                    <p className='text-xs text-amber-600 mt-1'>
                                        ℹ️ Algunos métodos están siendo usados por otras sub-cajas activas y no aparecen en la lista
                                    </p>
                                )}
                            </>
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
