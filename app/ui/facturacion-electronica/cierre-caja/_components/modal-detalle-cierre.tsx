'use client'

import { Modal, Button } from 'antd'
import TableBase from '~/components/tables/table-base'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { FaFileInvoiceDollar, FaMoneyBillWave, FaExchangeAlt, FaArrowCircleDown, FaArrowCircleUp, FaSearch } from 'react-icons/fa'

interface ModalDetalleCierreProps {
    open: boolean
    onClose: () => void
    tipo: string | null
    resumen: any
}

export default function ModalDetalleCierre({ open, onClose, tipo, resumen }: ModalDetalleCierreProps) {
    if (!resumen) return null

    let columns: ColDef[] = []
    let rowData: any[] = []
    let title = 'Detalle'
    let icon = <FaFileInvoiceDollar />
    let footer = null

    // Reutilizar lógica de columnas de ResumenDetalleCierre
    const columnasVentas: ColDef[] = [
        { headerName: 'Serie-Número', valueGetter: (params) => `${params.data.serie}-${params.data.numero}`, width: 130 },
        { headerName: 'Cliente', field: 'cliente_nombre', valueFormatter: (params) => params.value || 'Sin cliente', flex: 1 },
        {
            headerName: 'Pagos',
            field: 'pagos',
            flex: 1.5,
            cellRenderer: (params: any) => (
                <div className='flex flex-wrap gap-1'>
                    {(params.value || []).map((p: any, i: number) => (
                        <span key={i} className='text-[10px] bg-blue-50 text-blue-700 px-1 rounded border border-blue-100'>
                            {p.metodo_pago}: <strong>{Number(p.monto).toFixed(2)}</strong>
                        </span>
                    ))}
                </div>
            )
        },
        { headerName: 'Total', field: 'total', width: 100, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Fecha', field: 'created_at', width: 140, valueFormatter: (params) => dayjs(params.value).format('DD/MM HH:mm') },
    ]

    const columnasMovimientosTransacciones: ColDef[] = [
        { headerName: 'Concepto / Motivo', field: 'concepto', flex: 1, valueGetter: (params) => params.data.concepto || params.data.motivo || 'N/A' },
        { headerName: 'Sub-Caja', field: 'sub_caja', width: 150, valueGetter: (params) => params.data.sub_caja || params.data.sub_caja_origen || params.data.sub_caja_destino || 'N/A' },
        { headerName: 'Monto', field: 'monto', width: 110, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Fecha', field: 'created_at', width: 140, valueFormatter: (params) => dayjs(params.data.created_at || params.data.fecha_transferencia || params.data.fecha).format('DD/MM HH:mm') },
    ]

    const columnasMovimientosInternos: ColDef[] = [
        { headerName: 'Origen', field: 'sub_caja_origen', width: 140 },
        { headerName: 'Destino', field: 'sub_caja_destino', width: 140 },
        { headerName: 'Justificación', field: 'justificacion', flex: 1 },
        { headerName: 'Monto', field: 'monto', width: 110, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Fecha', field: 'fecha', width: 140, valueFormatter: (params) => dayjs(params.value).format('DD/MM HH:mm') },
    ]

    switch (tipo) {
        case 'apertura':
            title = 'Detalle de Apertura'
            icon = <FaMoneyBillWave className='text-amber-500' />
            // No suele haber tabla para apertura, pero podemos mostrar el historial si existiera. 
            // Por ahora mostramos un resumen simple.
            rowData = []
            break
        case 'ventas':
        case 'metodo_pago':
            title = 'Detalle de Ventas / Cobros'
            icon = <FaFileInvoiceDollar className='text-green-500' />
            columns = columnasVentas
            // Si es un método específico, filtramos las ventas que incluyen ese método
            // Pero el resumen ya trae 'detalle_ventas'. 
            // NOTA: Si es 'metodo_pago' (desde una fila específica), podríamos filtrar.
            rowData = resumen.detalle_ventas || []
            break
        case 'otros_ingresos':
            title = 'Detalle de Otros Ingresos'
            icon = <FaArrowCircleUp className='text-amber-500' />
            columns = columnasMovimientosTransacciones
            rowData = resumen.detalle_ingresos ? Object.values(resumen.detalle_ingresos) : []
            break
        case 'prestamos_recibidos':
            title = 'Detalle de Préstamos Recibidos'
            icon = <FaArrowCircleUp className='text-amber-500' />
            columns = columnasMovimientosTransacciones
            rowData = resumen.prestamos_recibidos || []
            break
        case 'gastos':
            title = 'Detalle de Gastos'
            icon = <FaArrowCircleDown className='text-red-500' />
            columns = columnasMovimientosTransacciones
            rowData = resumen.detalle_egresos ? Object.values(resumen.detalle_egresos) : []
            break
        case 'prestamos_dados':
            title = 'Detalle de Préstamos Dados'
            icon = <FaArrowCircleDown className='text-orange-500' />
            columns = columnasMovimientosTransacciones
            rowData = resumen.prestamos_dados || []
            break
        case 'movimientos_internos':
            title = 'Detalle de Movimientos Internos'
            icon = <FaExchangeAlt className='text-purple-500' />
            columns = columnasMovimientosInternos
            rowData = resumen.movimientos_internos || []
            break
    }

    // Si es un método de pago específico (el tipo vendría como 'metodo_pago:ID' o similar)
    if (tipo?.startsWith('metodo:')) {
        const labelBusqueda = tipo.split(':')[1]
        title = `Detalle de Cobros: ${labelBusqueda}`
        icon = <FaFileInvoiceDollar className='text-amber-500' />
        columns = columnasVentas
        // Filtrar ventas que tengan al menos un pago con este método
        rowData = (resumen.detalle_ventas || []).filter((v: any) =>
            v.pagos?.some((p: any) => p.metodo_pago === labelBusqueda)
        )

        const totalMetodo = rowData.reduce((sum, v) => {
            const pago = v.pagos?.find((p: any) => p.metodo_pago === labelBusqueda)
            return sum + (Number(pago?.monto) || 0)
        }, 0)

        footer = (
            <div className='p-3 bg-amber-50 rounded flex justify-between items-center mt-2 border border-amber-100'>
                <span className='font-semibold text-amber-700'>Total {labelBusqueda}:</span>
                <span className='text-lg font-bold text-amber-800'>S/. {totalMetodo.toFixed(2)}</span>
            </div>
        )
    }

    return (
        <Modal
            title={
                <div className='flex items-center gap-2 text-lg'>
                    {icon}
                    <span>{title}</span>
                </div>
            }
            open={open}
            onCancel={onClose}
            width={900}
            footer={[
                <Button key='close' onClick={onClose} type='primary'>
                    Cerrar
                </Button>
            ]}
            centered
        >
            <div className='space-y-4 py-2' style={{ minHeight: '300px' }}>
                {rowData.length > 0 ? (
                    <>
                        <div className='h-[450px] w-full border rounded overflow-hidden'>
                            <TableBase
                                rowData={rowData}
                                columnDefs={columns}
                                withNumberColumn={true}
                                headerColor='var(--color-amber-600)'
                            />
                        </div>
                        {footer}
                    </>
                ) : (
                    <div className='flex flex-col items-center justify-center h-64 text-slate-400'>
                        <FaSearch className='text-4xl mb-2 opacity-20' />
                        <p>No se encontraron registros detallados para esta categoría.</p>
                        {tipo === 'apertura' && (
                            <div className='mt-4 p-4 bg-blue-50 rounded border border-blue-100 text-blue-700 w-full max-w-md'>
                                <div className='flex justify-between mb-1'>
                                    <span>Monto de Apertura:</span>
                                    <strong className='text-lg'>S/. {Number(resumen.efectivo_inicial || 0).toFixed(2)}</strong>
                                </div>
                                <div className='text-xs opacity-70 italic'>
                                    * El monto de apertura corresponde al efectivo inicial declarado al abrir la caja.
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    )
}
