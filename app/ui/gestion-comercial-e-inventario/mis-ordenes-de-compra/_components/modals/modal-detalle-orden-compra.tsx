'use client'

import React, { useEffect, useState } from 'react'
import { Modal, Table, Tag, Divider, Spin, Empty, Button, Descriptions } from 'antd'
import { PrinterOutlined, FilePdfOutlined } from '@ant-design/icons'
import { ordenCompraApi, type OrdenCompra, type OrdenCompraProducto } from '~/lib/api/orden-compra'
import TitleForm from '~/components/form/title-form'

interface ModalDetalleOrdenCompraProps {
    open: boolean
    onClose: () => void
    ordenId?: number
    ordenData?: OrdenCompra
}

export default function ModalDetalleOrdenCompra({
    open,
    onClose,
    ordenId,
    ordenData: initialData,
}: ModalDetalleOrdenCompraProps) {
    const [loading, setLoading] = useState(false)
    const [orden, setOrden] = useState<OrdenCompra | undefined>(initialData)

    useEffect(() => {
        if (open && ordenId && !initialData) {
            fetchDetalle(ordenId)
        } else if (open && initialData) {
            setOrden(initialData)
        }
    }, [open, ordenId, initialData])

    const fetchDetalle = async (id: number) => {
        setLoading(true)
        try {
            const res = await ordenCompraApi.getById(id)
            if (res.data?.data) {
                setOrden(res.data.data)
            }
        } catch (error) {
            console.error('Error fetching orden detail:', error)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Producto',
            dataIndex: 'nombre',
            key: 'nombre',
            render: (text: string, record: OrdenCompraProducto) => (
                <div>
                    <div className='font-semibold text-slate-800'>{text || record.codigo || '—'}</div>
                    {record.marca && <div className='text-xs text-slate-500'>{record.marca}</div>}
                </div>
            )
        },
        {
            title: 'Unidad',
            dataIndex: 'unidad',
            key: 'unidad',
            width: 80,
            align: 'center' as const,
            render: (text: string) => <Tag color='green'>{text || 'UND'}</Tag>
        },
        {
            title: 'Cantidad',
            dataIndex: 'cantidad',
            key: 'cantidad',
            width: 90,
            align: 'right' as const,
            render: (val: number) => <span className='font-semibold'>{val}</span>
        },
        {
            title: 'P. Unitario',
            dataIndex: 'precio',
            key: 'precio',
            width: 110,
            align: 'right' as const,
            render: (val: number) => <span>S/. {(Number(val)).toFixed(2)}</span>
        },
        {
            title: 'Subtotal',
            dataIndex: 'subtotal',
            key: 'subtotal',
            width: 120,
            align: 'right' as const,
            render: (val: number) => <span className='font-semibold text-emerald-700'>S/. {(Number(val)).toFixed(2)}</span>
        }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendiente': return 'warning'
            case 'en_proceso': return 'processing'
            case 'completada': return 'success'
            case 'anulada': return 'error'
            default: return 'default'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En Proceso',
            'completada': 'Completada',
            'anulada': 'Anulada'
        }
        return labels[status] || status
    }

    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={1000}
            centered
            title={
                <div className='flex items-center justify-between'>
                    <div>
                        <TitleForm className='!pb-0'>Detalle de Orden de Compra</TitleForm>
                        <span className='text-xs text-slate-500 font-mono'>{orden?.codigo || 'OC-XXXXXX'}</span>
                    </div>
                    {orden && (
                        <Tag color={getStatusColor(orden.estado)} className='!font-semibold'>
                            {getStatusLabel(orden.estado)}
                        </Tag>
                    )}
                </div>
            }
            footer={[
                <Button key='print' icon={<PrinterOutlined />} onClick={() => window.print()}>
                    Imprimir
                </Button>,
                <Button key='pdf' icon={<FilePdfOutlined />} className='!border-emerald-600 !text-emerald-600'>
                    Exportar PDF
                </Button>,
                <Button key='close' type='primary' onClick={onClose} className='!bg-emerald-600 hover:!bg-emerald-700 !border-none'>
                    Cerrar
                </Button>
            ]}
            destroyOnClose
        >
            <div className='py-4'>
                {loading ? (
                    <div className='flex flex-col items-center justify-center py-20 gap-4'>
                        <Spin size='large' />
                        <span className='text-slate-400 text-sm'>Cargando información...</span>
                    </div>
                ) : orden ? (
                    <div className='space-y-6'>
                        {/* Información General */}
                        <div>
                            <h3 className='text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide'>Información General</h3>
                            <Descriptions column={2} size='small' bordered>
                                <Descriptions.Item label='Fecha'>{orden.fecha}</Descriptions.Item>
                                <Descriptions.Item label='Solicitante'>{orden.user?.name || '—'}</Descriptions.Item>
                                <Descriptions.Item label='Almacén'>Almacén Principal</Descriptions.Item>
                                <Descriptions.Item label='Moneda'>{orden.tipo_moneda === 's' ? 'Soles (S/.)' : 'Dólares ($)'}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        {/* Proveedor */}
                        <div>
                            <h3 className='text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide'>Proveedor</h3>
                            <Descriptions column={1} size='small' bordered>
                                <Descriptions.Item label='Razón Social'>{orden.proveedor?.razon_social || '—'}</Descriptions.Item>
                                <Descriptions.Item label='RUC'>{orden.proveedor?.ruc || orden.ruc || '—'}</Descriptions.Item>
                            </Descriptions>
                        </div>

                        {/* Requerimiento */}
                        {orden.requerimiento && (
                            <div>
                                <h3 className='text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide'>Requerimiento Origen</h3>
                                <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                    <div className='flex justify-between items-start'>
                                        <div>
                                            <p className='text-xs text-slate-600 font-semibold'>Código: <span className='text-blue-600'>{orden.requerimiento.codigo}</span></p>
                                            <p className='text-xs text-slate-600 mt-1'>Título: {orden.requerimiento.titulo}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Productos */}
                        <div>
                            <h3 className='text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide'>Productos</h3>
                            <Table
                                columns={columns}
                                dataSource={orden.productos || []}
                                pagination={false}
                                rowKey='id'
                                size='small'
                                bordered
                                summary={() => (
                                    <Table.Summary.Row className='bg-slate-50'>
                                        <Table.Summary.Cell index={0} colSpan={4} className='text-right font-semibold'>
                                            Total
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} className='text-right'>
                                            <span className='font-bold text-emerald-700'>S/. {(Number(orden.total ?? 0)).toFixed(2)}</span>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )}
                            />
                        </div>

                        {/* Forma de Pago */}
                        <div>
                            <h3 className='text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide'>Forma de Pago</h3>
                            <Descriptions column={1} size='small' bordered>
                                <Descriptions.Item label='Tipo'>
                                    <Tag color={orden.forma_de_pago === 'co' ? 'green' : 'blue'}>
                                        {orden.forma_de_pago === 'co' ? 'Contado' : 'Crédito'}
                                    </Tag>
                                </Descriptions.Item>
                                {orden.forma_de_pago === 'cr' && (
                                    <>
                                        <Descriptions.Item label='Días de Crédito'>{orden.numero_dias} días</Descriptions.Item>
                                        <Descriptions.Item label='Fecha de Vencimiento'>{orden.fecha_vencimiento}</Descriptions.Item>
                                    </>
                                )}
                            </Descriptions>
                        </div>
                    </div>
                ) : (
                    <Empty description='No se pudo cargar la información de la orden' />
                )}
            </div>
        </Modal>
    )
}
