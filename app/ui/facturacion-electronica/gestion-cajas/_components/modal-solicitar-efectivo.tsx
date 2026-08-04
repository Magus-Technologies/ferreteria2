'use client'

import { useEffect, useRef } from 'react'
import { Form, InputNumber, Select } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import useSolicitarEfectivo from '../_hooks/use-solicitar-efectivo'
import { useQuery } from '@tanstack/react-query'
import { subscribeModelChanged } from '~/lib/realtime-bus'

interface ModalSolicitarEfectivoProps {
    open: boolean
    setOpen: (open: boolean) => void
    aperturaId: string
    onSuccess?: () => void
}

interface FormValues {
    vendedor_prestamista_id: string
    monto_solicitado: number
    motivo?: string
}

// Módulos cuyos movimientos cambian el efectivo disponible de un vendedor —
// mismo criterio que usa el resumen de Cierre de Caja (ver cierre-caja-view.tsx).
const MODULOS_EFECTIVO_VENDEDORES = ['ventas', 'gastos', 'ingresos', 'prestamos', 'prestamos-vendedores', 'cajas']

export default function ModalSolicitarEfectivo({
    open,
    setOpen,
    aperturaId,
    onSuccess,
}: ModalSolicitarEfectivoProps) {
    const [form] = Form.useForm<FormValues>()
    const { solicitarEfectivo, loading } = useSolicitarEfectivo(() => {
        setOpen(false)
        form.resetFields()
        onSuccess?.()
    })

    // Tiempo real: el canal WebSocket ya está conectado globalmente
    // (RealtimeProvider, ver providers-auth.tsx) — acá solo nos suscribimos al
    // bus interno para refrescar la lista de vendedores cuando ocurra un
    // movimiento que afecte el efectivo disponible de alguno, sin tener que
    // cerrar y reabrir el modal (mismo criterio que usa Cierre de Caja).
    // No se vuelve a llamar useRealtime() acá: abriría un segundo listener
    // sobre el mismo canal "model-changes" (ver lib/realtime-bus.ts).

    // Obtener vendedores con efectivo disponible
    const { data: vendedoresData, isLoading: loadingVendedores, refetch: refetchVendedores } = useQuery({
        queryKey: ['vendedores-con-efectivo-real-time'],
        queryFn: async () => {
            // Usar el nuevo endpoint que calcula en tiempo real
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/sub-cajas/vendedores-con-efectivo`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            })
            const data = await response.json()
            return data
        },
        enabled: open,
    })

    const refetchVendedoresRef = useRef(refetchVendedores)
    refetchVendedoresRef.current = refetchVendedores
    useEffect(() => {
        if (!open) return
        const unsub = subscribeModelChanged((ev) => {
            if (MODULOS_EFECTIVO_VENDEDORES.includes(ev.module)) {
                refetchVendedoresRef.current()
            }
        })
        return unsub
    }, [open])

    const vendedores = Array.isArray(vendedoresData?.data) ? vendedoresData.data : []

    const handleSubmit = (values: FormValues) => {
        console.log('📤 Enviando solicitud:', {
            aperturaId,
            values,
        })
        
        if (!aperturaId) {
            console.error('❌ No hay apertura ID disponible')
            return
        }
        
        solicitarEfectivo({
            apertura_cierre_caja_id: aperturaId,
            vendedor_prestamista_id: values.vendedor_prestamista_id,
            monto_solicitado: values.monto_solicitado,
            motivo: values.motivo,
        })
    }

    // Validar que haya apertura ID
    if (open && !aperturaId) {
        return (
            <ModalForm
                modalProps={{
                    width: 600,
                    title: <TitleForm>Solicitar Préstamo</TitleForm>,
                    centered: true,
                }}
                open={open}
                setOpen={setOpen}
                formProps={{
                    form,
                    onFinish: () => {},
                    layout: 'vertical',
                }}
            >
                <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                    <p className='text-sm text-red-700'>
                        ⚠️ No hay una caja abierta. Por favor, apertura una caja primero.
                    </p>
                </div>
            </ModalForm>
        )
    }

    return (
        <ModalForm
            modalProps={{
                width: 600,
                title: <TitleForm>Solicitar Préstamo</TitleForm>,
                centered: true,
                okButtonProps: {
                    loading,
                    className: 'bg-red-500 hover:bg-red-600'
                },
                okText: 'Enviar Solicitud',
            }}
            onCancel={() => {
                form.resetFields()
            }}
            open={open}
            setOpen={setOpen}
            formProps={{
                form,
                onFinish: handleSubmit,
                layout: 'vertical',
            }}
        >
            <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <p className='text-sm text-blue-700'>
                    💡 Solicita un préstamo a otro vendedor indicando cuánto necesitas. El vendedor decidirá de qué caja darte al aprobar.
                </p>
                <p className='text-xs text-blue-600 mt-2'>
                    ℹ️ Tu caja debe estar abierta para poder solicitar préstamos.
                </p>
            </div>

            <LabelBase label='Vendedor con Efectivo' orientation='column' className='w-full'>
                <Form.Item
                    name='vendedor_prestamista_id'
                    rules={[{ required: true, message: 'Selecciona un vendedor' }]}
                    className='w-full'
                >
                    <Select
                        placeholder='Selecciona el vendedor'
                        size='large'
                        className='w-full'
                        style={{ width: '100%', height: 40 }}
                        loading={loadingVendedores}
                        showSearch
                        filterOption={(input, option) =>
                            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={vendedores.map((v: any) => ({
                            value: v.vendedor_id,
                            label: `${v.vendedor_nombre} — S/. ${v.efectivo_disponible}`,
                        }))}
                        labelRender={(option) => (
                            <div className='flex items-center justify-between gap-4'>
                                <span className='text-sm font-semibold'>{String(option?.label ?? '').split(' — ')[0]}</span>
                                <span className='text-sm font-bold text-green-600 whitespace-nowrap'>
                                    {String(option?.label ?? '').split(' — ')[1] ?? ''}
                                </span>
                            </div>
                        )}
                        optionRender={(option) => (
                            <div className='flex items-center justify-between gap-4 px-2'>
                                <span className='text-sm font-semibold'>{String(option.data.label ?? '').split(' — ')[0]}</span>
                                <span className='text-sm font-bold text-green-600 whitespace-nowrap'>
                                    {String(option.data.label ?? '').split(' — ')[1]}
                                </span>
                            </div>
                        )}
                        notFoundContent={
                            loadingVendedores 
                                ? 'Cargando...' 
                                : vendedores.length === 0 
                                    ? 'No hay vendedores con efectivo disponible. Asegúrate de que otros vendedores hayan aperturado caja con efectivo.'
                                    : 'No se encontraron resultados'
                        }
                    />
                </Form.Item>
                {vendedores.length === 0 && !loadingVendedores && (
                    <div className='mt-2 p-2 bg-yellow-50 rounded border border-yellow-200'>
                        <p className='text-xs text-yellow-700'>
                            ℹ️ Para solicitar un préstamo, otros vendedores deben tener una caja abierta con efectivo disponible.
                        </p>
                    </div>
                )}
            </LabelBase>

            <LabelBase label='Monto que Necesitas' orientation='column'>
                <Form.Item
                    name='monto_solicitado'
                    rules={[
                        { required: true, message: 'Ingresa el monto que necesitas' },
                        { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
                    ]}
                >
                    <InputNumber
                        placeholder='0.00'
                        className='w-full'
                        prefix='S/.'
                        min={0}
                        step={0.01}
                        precision={2}
                    />
                </Form.Item>
            </LabelBase>

            <LabelBase label='Motivo (Opcional)' orientation='column'>
                <InputBase
                    placeholder='Ej: Necesito dar vuelto'
                    uppercase={false}
                    propsForm={{
                        name: 'motivo',
                        rules: [{ max: 500, message: 'Máximo 500 caracteres' }],
                    }}
                />
            </LabelBase>
        </ModalForm>
    )
}
