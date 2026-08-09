'use client'

import { Modal, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import TableWithTitle from '~/components/tables/table-with-title'
import type { ColDef } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'
import { FaFileInvoiceDollar, FaMoneyBillWave, FaExchangeAlt, FaArrowCircleDown, FaArrowCircleUp, FaSearch } from 'react-icons/fa'
import { trasladoBovedaApi } from '~/lib/api/traslado-boveda'

interface ModalDetalleCierreProps {
    open: boolean
    onClose: () => void
    tipo: string | null
    resumen: any
    aperturaId?: string
}

export default function ModalDetalleCierre({ open, onClose, tipo, resumen, aperturaId }: ModalDetalleCierreProps) {
    if (!resumen) return null

    const { data: trasladosQueryData } = useQuery({
        queryKey: ['traslados-boveda-modal', aperturaId],
        queryFn: () => trasladoBovedaApi.obtenerTrasladosPorCaja(aperturaId!),
        enabled: !!aperturaId && tipo === 'traslados_boveda' && open,
    })

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
            // autoHeight: una venta puede tener VARIOS pagos del mismo método
            // (cobro inicial + diferencia de una edición). Sin esto la fila
            // conservaba su alto fijo y el segundo chip quedaba cortado por debajo,
            // dando la impresión de que la diferencia no se había registrado.
            autoHeight: true,
            wrapText: true,
            cellRenderer: (params: any) => (
                <div className='flex flex-wrap gap-1 py-1.5 leading-tight'>
                    {(params.value || []).map((p: any, i: number) => (
                        <span key={i} className='text-[10px] bg-blue-50 text-blue-700 px-1 rounded border border-blue-100'>
                            {p.metodo_pago}: <strong>{Number(p.monto).toFixed(2)}</strong>
                        </span>
                    ))}
                </div>
            )
        },
        { headerName: 'Total', field: 'total', width: 100, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Fecha', field: 'created_at', width: 140, valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM HH:mm') },
    ]

    // Detalle de cobros de UN método: una fila por cobro. Una venta editada con
    // cobro diferencial aporta varias filas (inicial + diferencia), cada una con
    // su monto y su fecha.
    const columnasCobros: ColDef[] = [
        { headerName: 'Serie-Número', valueGetter: (params) => `${params.data.serie}-${params.data.numero}`, width: 130 },
        { headerName: 'Cliente', field: 'cliente_nombre', valueFormatter: (params) => params.value || 'Sin cliente', flex: 1 },
        { headerName: 'Sub-Caja', field: 'sub_caja', width: 130, valueFormatter: (params) => params.value || '-' },
        // Despliegue de pago con el que se cobró, en formato "banco/despliegue"
        // (ej. "efectivo/efectivo", "bcp/transferencia"). Aunque el modal ya está
        // filtrado por método, se muestra para que la fila se entienda sola al
        // exportarla a Excel o PDF.
        { headerName: 'Despliegue de Pago', field: 'metodo_pago', width: 190, valueFormatter: (params) => params.value || '-' },
        {
            headerName: 'Tipo Cobro',
            field: 'tipo',
            width: 120,
            valueFormatter: (params) => ({
                inicial: 'Inicial',
                diferencia: 'Diferencia',
                devolucion: 'Devolución',
            } as Record<string, string>)[params.value] ?? (params.value || '-'),
        },
        { headerName: 'N° Operación', field: 'numero_operacion', width: 130, valueFormatter: (params) => params.value || '-' },
        {
            headerName: 'Monto Cobrado',
            field: 'monto',
            width: 140,
            valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
            cellStyle: (params: any) => ({
                fontWeight: 'bold',
                // Una devolución llega en negativo — se distingue en rojo.
                color: Number(params.value) < 0 ? '#dc2626' : '#047857',
            }),
        },
        { headerName: 'Total Venta', field: 'total_venta', width: 120, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}` },
        { headerName: 'Fecha', field: 'created_at', width: 140, valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM HH:mm') },
    ]

    const columnasMovimientosTransacciones: ColDef[] = [
        { headerName: 'Concepto / Motivo', field: 'concepto', flex: 1, valueGetter: (params) => params.data.concepto || params.data.motivo || 'N/A' },
        { headerName: 'Sub-Caja', field: 'sub_caja', width: 150, valueGetter: (params) => params.data.sub_caja || params.data.sub_caja_origen || params.data.sub_caja_destino || 'N/A' },
        { headerName: 'Método', field: 'despliegue', width: 140, valueGetter: (params) => params.data.despliegue || params.data.metodo || '-' },
        {
            headerName: 'Efectivo', field: 'es_efectivo', width: 90,
            valueGetter: (params) => (params.data.es_efectivo ? 'Sí' : 'No'),
            cellStyle: (params: any) => ({ color: params.data?.es_efectivo ? '#059669' : '#64748b', fontWeight: 600 }),
        },
        { headerName: 'Monto', field: 'monto', width: 110, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Fecha', field: 'created_at', width: 140, valueFormatter: (params) => formatFechaPeru(params.data.created_at || params.data.fecha_transferencia || params.data.fecha, 'DD/MM HH:mm') },
    ]

    const columnasMovimientosInternos: ColDef[] = [
        { headerName: 'Origen', field: 'sub_caja_origen', width: 140 },
        { headerName: 'Destino', field: 'sub_caja_destino', width: 140 },
        { headerName: 'Justificación', field: 'justificacion', flex: 1 },
        { headerName: 'Monto', field: 'monto', width: 110, valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Fecha', field: 'fecha', width: 140, valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM HH:mm') },
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
            // Solo gastos reales: el traslado a bóveda tiene su propia línea.
            rowData = resumen.detalle_egresos
                ? Object.values(resumen.detalle_egresos).filter(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (e: any) => e?.tipo !== 'traslado_boveda'
                )
                : []
            break
        case 'ingreso_extra':
            title = 'Detalle de Ingresos Extras'
            icon = <FaArrowCircleUp className='text-green-600' />
            columns = columnasMovimientosTransacciones
            rowData = resumen.detalle_ingresos_extras ? Object.values(resumen.detalle_ingresos_extras) : []
            break
        case 'gasto_extra':
            title = 'Detalle de Gastos Extras'
            icon = <FaArrowCircleDown className='text-orange-600' />
            columns = columnasMovimientosTransacciones
            rowData = resumen.detalle_gastos_extras ? Object.values(resumen.detalle_gastos_extras) : []
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
        case 'traslados_boveda':
            title = 'Traslados a Bóveda (no afecta total)'
            icon = <FaExchangeAlt className='text-amber-500' />
            columns = [
                { headerName: 'Fecha', field: 'fecha_traslado', width: 160, valueFormatter: (p) => formatFechaPeru(p.value, 'DD/MM HH:mm') },
                { headerName: 'Sub Caja', width: 150, valueGetter: (p) => p.data?.sub_caja?.nombre ?? '-' },
                { headerName: 'Vendedor', flex: 1, minWidth: 130, valueGetter: (p) => p.data?.vendedor?.name ?? '-' },
                { headerName: 'Supervisor', flex: 1, minWidth: 130, valueGetter: (p) => p.data?.supervisor?.name ?? '-' },
                { headerName: 'Justificación', field: 'justificacion', flex: 2, valueFormatter: (p) => p.value ?? '-' },
                { headerName: 'Monto', field: 'monto', width: 120, valueFormatter: (p) => `S/. ${Number(p.value).toFixed(2)}`, cellStyle: { fontWeight: 'bold' } },
            ]
            rowData = (trasladosQueryData as any)?.data ?? []
            break
    }

    // Si es un método de pago específico (el tipo vendría como 'metodo_pago:ID' o similar)
    if (tipo?.startsWith('metodo:')) {
        const labelBusqueda = tipo.split(':')[1]
        title = `Detalle de Cobros: ${labelBusqueda}`
        icon = <FaFileInvoiceDollar className='text-amber-500' />
        columns = columnasCobros
        // UNA FILA POR COBRO, no por venta: una venta editada con cobro
        // diferencial tiene varios pagos del mismo método (el inicial y la
        // diferencia) y cada uno debe verse por separado, con su propio monto y
        // su propia fecha. Antes se listaba una fila por venta con los pagos
        // apilados como chips dentro de la celda, así que los cobros de una misma
        // venta quedaban escondidos y la fecha mostrada era la de la venta, no la
        // del cobro.
        rowData = (resumen.detalle_ventas || []).flatMap((v: any) =>
            (v.pagos || [])
                .filter((p: any) => p.metodo_pago === labelBusqueda)
                .map((p: any) => ({
                    serie: v.serie,
                    numero: v.numero,
                    cliente_nombre: v.cliente_nombre,
                    created_at: p.fecha ?? v.created_at,
                    metodo_pago: p.metodo_pago,
                    sub_caja: p.sub_caja,
                    tipo: p.tipo,
                    numero_operacion: p.numero_operacion,
                    monto: p.monto,
                    total_venta: v.total,
                }))
        )

        const totalMetodo = rowData.reduce(
            (sum: number, p: any) => sum + (Number(p.monto) || 0),
            0
        )

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
                            <TableWithTitle
                                id={`modal-detalle-cierre-${tipo || 'default'}`}
                                title={title}
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
