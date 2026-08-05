import { ColDef } from 'ag-grid-community'
import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd'
import { CheckCircle, Trash2, XCircle } from 'lucide-react'
import { formatFechaPeru } from '~/utils/fechas'

export interface SolicitudEfectivo {
    id: string
    vendedor_solicitante: {
        id: string
        name: string
    }
    vendedor_prestamista: {
        id: string
        name: string
    }
    monto_solicitado: number | string
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'anulada'
    motivo?: string
    created_at: string
}

const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `S/ ${numAmount.toFixed(2)}`
}

export const useColumnsPrestamosVendedores = ({
    onAprobar,
    onRechazar,
    onAnular,
}: {
    onAprobar: (solicitud: SolicitudEfectivo) => void
    onRechazar: (id: string) => void
    onAnular: (id: string) => void
}): ColDef<SolicitudEfectivo>[] => {
    return [
        {
            colId: 'solicitante',
            headerName: 'Solicitante',
            field: 'vendedor_solicitante',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params: any) => (
                <span className='font-medium text-slate-700'>{params.value?.name}</span>
            ),
        },
        {
            colId: 'prestamista',
            headerName: 'Prestamista',
            field: 'vendedor_prestamista',
            width: 220,
            minWidth: 200,
            cellRenderer: (params: any) => (
                <span className='font-medium text-slate-700'>{params.value?.name}</span>
            ),
        },
        {
            colId: 'monto',
            headerName: 'Monto',
            field: 'monto_solicitado',
            width: 150,
            cellRenderer: (params: any) => (
                <div className='text-right font-bold text-emerald-600'>
                    {formatCurrency(params.value)}
                </div>
            ),
        },
        {
            colId: 'estado',
            headerName: 'Estado',
            field: 'estado',
            width: 130,
            cellRenderer: (params: any) => {
                const colors = {
                    pendiente: 'orange',
                    aprobada: 'green',
                    rechazada: 'red',
                    anulada: 'default',
                }
                return (
                    <div className='flex justify-center'>
                        <Tag color={colors[params.value as keyof typeof colors]}>
                            {params.value.toUpperCase()}
                        </Tag>
                    </div>
                )
            },
        },
        {
            colId: 'motivo',
            headerName: 'Motivo',
            field: 'motivo',
            width: 220,
            minWidth: 200,
            cellRenderer: (params: any) => (
                <span className='text-sm text-slate-600'>{params.value || '-'}</span>
            ),
        },
        {
            colId: 'fecha',
            headerName: 'Fecha',
            field: 'created_at',
            width: 200,
            valueFormatter: (params) => params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
        },
        {
            colId: 'acciones',
            headerName: 'Acciones',
            field: 'id',
            width: 180,
            cellRenderer: (params: any) => {
                if (params.data.estado === 'pendiente') {
                    return (
                        <Space size='small'>
                            <Tooltip title='Aprobar'>
                                <Button
                                    type='primary'
                                    icon={<CheckCircle className='h-4 w-4' />}
                                    size='small'
                                    onClick={() => onAprobar(params.data)}
                                >
                                    Aprobar
                                </Button>
                            </Tooltip>
                            <Tooltip title='Rechazar'>
                                <Button
                                    danger
                                    icon={<XCircle className='h-4 w-4' />}
                                    size='small'
                                    onClick={() => onRechazar(params.data.id)}
                                />
                            </Tooltip>
                        </Space>
                    )
                }

                if (params.data.estado === 'aprobada') {
                    return (
                        <Tooltip title='Anular préstamo'>
                            <Popconfirm
                                title='¿Anular este préstamo?'
                                description='El monto se revertirá: volverá a la caja del prestamista y se descontará de la del solicitante.'
                                onConfirm={() => onAnular(params.data.id)}
                                okText='Sí, anular'
                                cancelText='Cancelar'
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    danger
                                    type='text'
                                    icon={<Trash2 className='h-4 w-4' />}
                                    size='small'
                                >
                                    Anular
                                </Button>
                            </Popconfirm>
                        </Tooltip>
                    )
                }

                return null
            },
        },
    ]
}
