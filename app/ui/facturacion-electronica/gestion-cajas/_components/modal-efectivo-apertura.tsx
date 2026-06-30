'use client'

import { Modal, Table, Button, App, Empty, Spin } from 'antd'
import { DollarOutlined, WalletOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import SelectVendedor from '../../_components/selects/select-vendedor'

interface EfectivoDisponible {
    id: string
    monto_efectivo: number
    fecha_cierre: string
    fecha_apertura: string
    usuario: {
        id: string
        name: string
    } | null
}

interface ModalEfectivoAperturaProps {
    open: boolean
    setOpen: (open: boolean) => void
    aperturaId?: string
    onSuccess?: () => void
}

export default function ModalEfectivoApertura({
    open,
    setOpen,
    aperturaId,
    onSuccess,
}: ModalEfectivoAperturaProps) {
    const { message } = App.useApp()
    const queryClient = useQueryClient()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [vendedorId, setVendedorId] = useState<string | undefined>(undefined)
    const [asignando, setAsignando] = useState(false)

    const { data: efectivos = [], isLoading } = useQuery({
        queryKey: ['efectivo-disponible-apertura'],
        queryFn: async () => {
            const result = await apiRequest<{ success: boolean; data: EfectivoDisponible[] }>(
                '/cajas/cierre/efectivo-disponible',
            )
            return result.data?.data || []
        },
        enabled: open,
    })

    const selected = efectivos.find((e) => e.id === selectedId)

    const totalDisponible = efectivos.reduce(
        (sum, e) => sum + (e.monto_efectivo || 0), 0
    )

    const handleAsignar = async () => {
        if (!selectedId || !vendedorId) return

        setAsignando(true)
        try {
            const res = await apiRequest<{ success: boolean; message: string }>(
                `/cajas/cierre/${selectedId}/asignar-efectivo-apertura`,
                { method: 'POST', data: { user_id: vendedorId } }
            )

            if (res.data?.success) {
                message.success('Efectivo asignado correctamente')
                setSelectedId(null)
                setVendedorId(undefined)
                queryClient.invalidateQueries({ queryKey: ['efectivo-disponible-apertura'] })
            } else {
                message.error(res.data?.message || 'Error al asignar')
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Error al asignar efectivo')
        } finally {
            setAsignando(false)
        }
    }

    const resetSelection = () => {
        setSelectedId(null)
        setVendedorId(undefined)
    }

    return (
        <Modal
            title={
                <div className='flex items-center gap-3'>
                    <WalletOutlined className='text-emerald-600 text-lg' />
                    <span className='text-lg font-bold'>Efectivo de Apertura</span>
                </div>
            }
            open={open}
            onCancel={() => {
                resetSelection()
                setOpen(false)
            }}
            width={700}
            footer={null}
            centered
        >
            <div className='mt-2 flex flex-col gap-4'>
                <div className='p-3 bg-emerald-50 rounded-lg border border-emerald-200'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-sm text-slate-600'>
                            <DollarOutlined className='text-emerald-600' />
                            <span>Total de efectivo disponible de cierres:</span>
                        </div>
                        <span className='text-lg font-bold text-emerald-600'>
                            S/ {totalDisponible.toFixed(2)}
                        </span>
                    </div>
                    <p className='text-xs text-slate-500 mt-1'>
                        Efectivo dejado por usuarios al cerrar su caja, disponible para prximas aperturas.
                    </p>
                </div>

                <div className='border border-slate-200 rounded-lg overflow-hidden'>
                    <Table
                        dataSource={efectivos}
                        rowKey={(r) => r.id}
                        loading={isLoading}
                        size='small'
                        pagination={false}
                        locale={{ emptyText: <Empty description='No hay efectivo disponible de cierres anteriores' /> }}
                        onRow={(record) => ({
                            onClick: () => {
                                setSelectedId(record.id)
                                setVendedorId(undefined)
                            },
                            className: selectedId === record.id
                                ? 'bg-emerald-50 cursor-pointer'
                                : 'cursor-pointer',
                        })}
                        columns={[
                            {
                                title: 'Cerrado por',
                                key: 'usuario',
                                render: (_, record) => (
                                    <div className='flex items-center gap-2'>
                                        <UserOutlined className='text-slate-400' />
                                        <span className='font-medium'>
                                            {record.usuario?.name || 'Usuario'}
                                        </span>
                                    </div>
                                ),
                            },
                            {
                                title: 'Monto dejado',
                                dataIndex: 'monto_efectivo',
                                key: 'monto_efectivo',
                                align: 'right',
                                render: (monto: number) => (
                                    <span className='font-semibold text-emerald-600'>
                                        S/ {monto.toFixed(2)}
                                    </span>
                                ),
                            },
                            {
                                title: 'Cerrado el',
                                dataIndex: 'fecha_cierre',
                                key: 'fecha_cierre',
                                render: (fecha: string) => (
                                    <span className='text-xs text-slate-500'>
                                        {fecha ? new Date(fecha).toLocaleDateString('es-PE', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }) : '-'}
                                    </span>
                                ),
                            },
                        ]}
                    />
                </div>

                {selected && (
                    <div className='p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3'>
                        <h4 className='font-semibold text-slate-700 text-sm'>
                            Asignar efectivo de <strong>{selected.usuario?.name}</strong>
                            {' '}(S/ {selected.monto_efectivo.toFixed(2)})
                        </h4>
                        <div className='flex items-center gap-2'>
                            <div className='flex-1'>
                                <SelectVendedor
                                    value={vendedorId}
                                    onChange={(val) => setVendedorId(val)}
                                    placeholder='Seleccionar usuario'
                                    soloVendedores={false}
                                    size='small'
                                />
                            </div>
                            <Button
                                type='primary'
                                className='bg-emerald-600 hover:bg-emerald-700'
                                size='small'
                                loading={asignando}
                                disabled={!vendedorId}
                                onClick={handleAsignar}
                                icon={<CheckCircleOutlined />}
                            >
                                Asignar
                            </Button>
                        </div>
                        <p className='text-xs text-slate-400'>
                            Al asignar, este efectivo aparecer como disponible en la apertura de caja del vendedor seleccionado.
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    )
}
