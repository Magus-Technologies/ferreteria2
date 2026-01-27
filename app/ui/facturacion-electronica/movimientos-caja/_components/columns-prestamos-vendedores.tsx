import { ColDef } from 'ag-grid-community'
import { Button, Space, Tag, Tooltip } from 'antd'
import { CheckCircle, XCircle } from 'lucide-react'

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
    estado: 'pendiente' | 'aprobada' | 'rechazada'
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
}: {
    onAprobar: (solicitud: SolicitudEfectivo) => void
    onRechazar: (id: string) => void
}): ColDef<SolicitudEfectivo>[] => {
    return [
        {
            headerName: 'Solicitante',
            field: 'vendedor_solicitante',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params: any) => (
                <span className='font-medium text-slate-700'>{params.value?.name}</span>
            ),
        },
        {
            headerName: 'Prestamista',
            field: 'vendedor_prestamista',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params: any) => (
                <span className='font-medium text-slate-700'>{params.value?.name}</span>
            ),
        },
        {
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
            headerName: 'Estado',
            field: 'estado',
            width: 130,
            cellRenderer: (params: any) => {
                const colors = {
                    pendiente: 'orange',
                    aprobada: 'green',
                    rechazada: 'red',
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
            headerName: 'Motivo',
            field: 'motivo',
            flex: 1,
            minWidth: 200,
            cellRenderer: (params: any) => (
                <span className='text-sm text-slate-600'>{params.value || '-'}</span>
            ),
        },
        {
            headerName: 'Fecha',
            field: 'created_at',
            width: 180,
            cellRenderer: (params: any) => (
                <span className='text-sm text-slate-600'>
                    {new Date(params.value).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            ),
        },
        {
            headerName: 'Acciones',
            field: 'id',
            width: 180,
            cellRenderer: (params: any) => {
                if (params.data.estado !== 'pendiente') return null

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
            },
        },
    ]
}
