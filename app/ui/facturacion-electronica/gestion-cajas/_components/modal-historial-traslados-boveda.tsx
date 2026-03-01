'use client'

import { Modal, App, DatePicker } from 'antd'
const { RangePicker } = DatePicker;
import { useState, useEffect, useRef, useMemo } from 'react'
import dayjs from 'dayjs'
import { FaWarehouse } from 'react-icons/fa'
import { DollarOutlined } from '@ant-design/icons'
import type { SubCaja } from '~/lib/api/caja-principal'
import { trasladoBovedaApi, type TrasladoBoveda } from '~/lib/api/traslado-boveda'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useColumnsHistorialTraslados } from '~/app/ui/facturacion-electronica/gestion-cajas/_components/columns-historial-traslados'

interface ModalHistorialTrasladosBovedaProps {
    open: boolean
    onClose: () => void
    subCaja: SubCaja
    cajaPrincipalId: number
    onSuccess?: () => void
}

export default function ModalHistorialTrasladosBoveda({
    open,
    onClose,
    subCaja,
    cajaPrincipalId,
    onSuccess,
}: ModalHistorialTrasladosBovedaProps) {
    const { modal, message } = App.useApp()
    const [traslados, setTraslados] = useState<TrasladoBoveda[]>([])
    const [loading, setLoading] = useState(false)
    const [rangoFechas, setRangoFechas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
    const gridRef = useRef<AgGridReact<TrasladoBoveda>>(null)

    // Obtener caja activa para sacar su ID
    const { data: cajaActiva } = useQuery({
        queryKey: [QueryKeys.CAJA_ACTIVA],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/cierre/activa`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json',
                },
            })
            const json = await response.json()
            return json.data || null
        },
        enabled: open,
    })

    const cargarTraslados = async () => {
        if (!cajaActiva?.id) return;

        try {
            setLoading(true)
            const response = await trasladoBovedaApi.obtenerTrasladosPorCaja(cajaActiva.id)
            setTraslados(Array.isArray(response) ? response : (response as any)?.data || [])
        } catch (error) {
            message.error('Error al cargar traslados')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && cajaActiva?.id) {
            cargarTraslados()
        }
    }, [open, cajaActiva?.id])

    const handleAnular = async (traslado: TrasladoBoveda) => {
        modal.confirm({
            title: '¿Anular traslado a bóveda?',
            content: (
                <div>
                    <p>¿Estás seguro de que deseas anular este traslado?</p>
                    <p className='mt-2 text-sm text-slate-600'>
                        Monto: <span className='font-semibold'>S/ {parseFloat(traslado.monto).toFixed(2)}</span>
                    </p>
                </div>
            ),
            okText: 'Continuar',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    await trasladoBovedaApi.anularTraslado(traslado.id, {
                        supervisor_id: '',
                        supervisor_password: '',
                    })
                    message.success('Traslado anulado exitosamente')
                    cargarTraslados()
                    onSuccess?.()
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Error al anular traslado')
                }
            },
        })
    }

    const columns = useColumnsHistorialTraslados({
        onAnular: handleAnular,
    })

    const filteredTraslados = useMemo(() => {
        if (!rangoFechas || !rangoFechas[0] || !rangoFechas[1]) return traslados;
        const [start, end] = rangoFechas;
        return traslados.filter(t => {
            const fecha = dayjs(t.fecha_traslado);
            return (fecha.isAfter(start, 'day') || fecha.isSame(start, 'day')) &&
                (fecha.isBefore(end, 'day') || fecha.isSame(end, 'day'));
        });
    }, [traslados, rangoFechas]);

    const totalTrasladado = filteredTraslados.reduce((sum, t) => sum + parseFloat(t.monto), 0)

    return (
        <Modal
            title={
                <div className='flex items-center gap-3'>
                    <FaWarehouse className='text-amber-600' />
                    <span className='text-lg font-bold'>Historial de Traslados a Bóveda</span>
                    <span className='px-2 py-1 bg-amber-100 text-amber-700 rounded font-mono text-sm'>
                        {subCaja.nombre}
                    </span>
                </div>
            }
            open={open}
            onCancel={onClose}
            width={1100}
            footer={null}
            centered
        >
            <div className='mt-4 flex flex-col gap-4'>
                <div className='flex justify-between items-end'>
                    <div className='flex flex-col gap-1'>
                        <span className='text-xs text-slate-500 font-medium'>Rango de fechas:</span>
                        <RangePicker
                            className='w-64'
                            placeholder={['Inicio', 'Fin']}
                            value={rangoFechas}
                            onChange={(val) => setRangoFechas(val as any)}
                            allowClear
                        />
                    </div>

                    <div className='p-2 px-4 bg-amber-50 border border-amber-200 rounded-lg inline-block text-right'>
                        <div className='flex items-center gap-4 justify-end'>
                            <span className='text-xs text-slate-500 font-medium uppercase tracking-wider'>
                                Total Trasladado:
                            </span>
                            <span className='text-lg font-bold text-amber-600'>
                                <DollarOutlined className='mr-1' />
                                S/ {totalTrasladado.toFixed(2)}
                            </span>
                        </div>
                        <p className='text-[10px] text-slate-400 leading-none mt-1'>
                            {filteredTraslados.length} traslado{filteredTraslados.length !== 1 ? 's' : ''} filtrado{filteredTraslados.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className='h-[400px] w-full'>
                    <TableBase<TrasladoBoveda>
                        ref={gridRef}
                        rowData={filteredTraslados}
                        columnDefs={columns}
                        rowSelection={false}
                        withNumberColumn={true}
                        headerColor='var(--color-amber-600)'
                        loading={loading}
                        suppressDragLeaveHidesColumns={true}
                        suppressMovableColumns={true}
                    />
                </div>
            </div>
        </Modal>
    )
}
