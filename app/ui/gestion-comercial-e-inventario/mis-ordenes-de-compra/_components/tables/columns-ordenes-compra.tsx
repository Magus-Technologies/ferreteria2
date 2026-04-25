'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'
import { Tag, Tooltip } from 'antd'
import { FaEye, FaCheck } from 'react-icons/fa'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import { IoIosCopy } from 'react-icons/io'
import { HiDocumentText } from 'react-icons/hi2'
import { type OrdenCompra } from '~/lib/api/orden-compra'
import dayjs from 'dayjs'

type EstadoOC = 'pendiente' | 'en_proceso' | 'completada' | 'anulada'

const ESTADO_LABELS: Record<string, string> = {
    pendiente: 'Pendiente',
    completada: 'Aprobado',
    anulada: 'Anulado',
}

const ESTADO_COLORS: Record<string, string> = {
    pendiente: 'gold',
    completada: 'success',
    anulada: 'error',
}

export function useColumnsOrdenesCompra({
    onAnular,
    onView,
    onViewDoc,
    onAprobar,
    onEditar,
    onDuplicar,
}: {
    onAnular: (orden: OrdenCompra) => void
    onView: (orden: OrdenCompra) => void
    onViewDoc: (orden: OrdenCompra) => void
    onAprobar?: (orden: OrdenCompra) => void
    onEditar?: (orden: OrdenCompra) => void
    onDuplicar?: (orden: OrdenCompra) => void
}) {
    const columns: ColDef<OrdenCompra>[] = [
        {
            headerName: 'N° OC',
            field: 'codigo',
            minWidth: 120,
            width: 130,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full font-semibold text-cyan-700'>
                    {data?.codigo}
                </div>
            ),
        },
        {
            headerName: 'Fecha',
            field: 'fecha',
            minWidth: 140,
            width: 160,
            sort: 'desc',
            valueFormatter: (params) =>
                params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
        },
        {
            headerName: 'Requerimiento',
            field: 'requerimiento',
            minWidth: 120,
            width: 140,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full'>
                    {data?.requerimiento?.codigo
                        ? <Tag color='blue'>{data.requerimiento.codigo}</Tag>
                        : <span className='text-slate-400'>—</span>
                    }
                </div>
            ),
        },
        {
            headerName: 'Proveedor',
            field: 'proveedor',
            minWidth: 200,
            flex: 1,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full'>
                    <Tooltip title={data?.proveedor?.razon_social}>
                        <div className='overflow-hidden text-ellipsis whitespace-nowrap'>{data?.proveedor?.razon_social || '—'}</div>
                    </Tooltip>
                </div>
            ),
        },
        {
            headerName: 'RUC',
            field: 'ruc',
            minWidth: 110,
            width: 120,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full'>
                    {data?.proveedor?.ruc || data?.ruc || '—'}
                </div>
            ),
        },
        {
            headerName: 'Solicitante',
            field: 'user',
            minWidth: 120,
            width: 130,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full'>
                    {data?.user?.name || '—'}
                </div>
            ),
        },
        {
            headerName: 'Items',
            field: 'productos_count' as any,
            minWidth: 60,
            width: 70,
            cellStyle: { textAlign: 'center' },
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => {
                const count = data?.productos_count ?? data?.productos?.length ?? 0
                return (
                    <div className='flex items-center justify-center h-full'>
                        {count}
                    </div>
                )
            },
        },
        {
            headerName: 'Total',
            field: 'total' as any,
            minWidth: 100,
            width: 110,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full font-bold text-slate-800'>
                    S/. {(Number(data?.total ?? 0)).toFixed(2)}
                </div>
            ),
        },
        {
            headerName: 'Estado',
            field: 'estado',
            minWidth: 110,
            width: 120,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center h-full'>
                    <Tag color={ESTADO_COLORS[data?.estado as string] || 'default'}>
                        {ESTADO_LABELS[data?.estado as string] || data?.estado}
                    </Tag>
                </div>
            ),
        },
        {
            headerName: 'Acciones',
            field: 'id',
            width: 200,
            minWidth: 200,
            cellRenderer: ({ data }: ICellRendererParams<OrdenCompra>) => (
                <div className='flex items-center gap-3 h-full'>
                    <Tooltip title='Ver Documento'>
                        <HiDocumentText
                            onClick={() => data && onViewDoc(data)}
                            className='cursor-pointer hover:scale-110 transition-all text-amber-600'
                            size={17}
                        />
                    </Tooltip>
                    <Tooltip title='Ver Detalle'>
                        <FaEye
                            onClick={() => data && onView(data)}
                            className='cursor-pointer hover:scale-110 transition-all text-blue-600'
                            size={16}
                        />
                    </Tooltip>
                    {data?.estado === 'pendiente' && (
                        <Tooltip title='Editar'>
                            <MdEditSquare
                                onClick={() => data && onEditar?.(data)}
                                className='cursor-pointer hover:scale-110 transition-all text-cyan-600'
                                size={17}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title='Duplicar'>
                        <IoIosCopy
                            onClick={() => data && onDuplicar?.(data)}
                            className='cursor-pointer hover:scale-110 transition-all text-violet-600'
                            size={17}
                        />
                    </Tooltip>
                    {data?.estado === 'pendiente' && (
                        <Tooltip title='Aprobar'>
                            <FaCheck
                                onClick={() => data && onAprobar?.(data)}
                                className='cursor-pointer hover:scale-110 transition-all text-green-600'
                                size={16}
                            />
                        </Tooltip>
                    )}
                    {data?.estado === 'pendiente' && (
                        <Tooltip title='Anular'>
                            <MdDelete
                                onClick={() => data && onAnular(data)}
                                size={18}
                                className='cursor-pointer text-rose-700 hover:scale-110 transition-all'
                            />
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ]

    return columns
}

