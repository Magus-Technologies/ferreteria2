'use client'

import { useRef } from 'react'
import { Tabs } from 'antd'
import TableBase from '~/components/tables/table-base'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'

interface ResumenDetalleCierreProps {
  resumen: any
  montoEsperado: number
}

export default function ResumenDetalleCierre({ resumen, montoEsperado }: ResumenDetalleCierreProps) {
  const gridVentasRef = useRef<AgGridReact<any>>(null)
  const gridMetodosRef = useRef<AgGridReact<any>>(null)
  const gridIngresosRef = useRef<AgGridReact<any>>(null)
  const gridPrestamosRecibidosRef = useRef<AgGridReact<any>>(null)
  const gridGastosRef = useRef<AgGridReact<any>>(null)
  const gridPrestamosDadosRef = useRef<AgGridReact<any>>(null)
  const gridMovimientosRef = useRef<AgGridReact<any>>(null)

  // Columnas para Ventas
  const columnasVentas: ColDef[] = [
    {
      headerName: 'Serie-Número',
      valueGetter: (params) => `${params.data.serie}-${params.data.numero}`,
      width: 150,
    },
    {
      headerName: 'Cliente',
      field: 'cliente_nombre',
      valueFormatter: (params) => params.value || 'Sin cliente',
      flex: 1,
    },
    {
      headerName: 'Pagos (Sub-Caja/Método)',
      field: 'pagos',
      flex: 2,
      cellRenderer: (params: any) => {
        if (!params.value || params.value.length === 0) {
          return 'Sin pagos registrados'
        }
        return (
          <div className='space-y-1'>
            {params.value.map((pago: any, index: number) => (
              <div key={index} className='text-xs'>
                <span className='font-semibold'>{pago.sub_caja || 'N/A'}</span> - 
                <span className='text-blue-600'> {pago.metodo_pago}</span>: 
                <span className='font-bold'> S/. {Number(pago.monto).toFixed(2)}</span>
                {pago.numero_operacion && (
                  <span className='text-gray-500'> (Op: {pago.numero_operacion})</span>
                )}
              </div>
            ))}
          </div>
        )
      },
    },
    {
      headerName: 'Monto',
      field: 'total',
      width: 120,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
    {
      headerName: 'Fecha',
      field: 'created_at',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
  ]

  // Columnas para Métodos de Pago
  const columnasMetodosPago: ColDef[] = [
    {
      headerName: 'Método de Pago',
      field: 'label',
      flex: 1,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad_transacciones',
      width: 120,
      cellStyle: { textAlign: 'center' },
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 150,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
  ]

  // Columnas para Otros Ingresos
  const columnasOtrosIngresos: ColDef[] = [
    {
      headerName: 'Concepto',
      field: 'concepto',
      flex: 1,
    },
    {
      headerName: 'Sub-Caja',
      field: 'sub_caja',
      width: 180,
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
    {
      headerName: 'Fecha',
      field: 'created_at',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
  ]

  // Columnas para Préstamos Recibidos
  const columnasPrestamosRecibidos: ColDef[] = [
    {
      headerName: 'De Vendedor',
      field: 'vendedor_origen',
      width: 200,
    },
    {
      headerName: 'Motivo',
      field: 'motivo',
      flex: 1,
      valueFormatter: (params) => params.value || 'Sin motivo',
    },
    {
      headerName: 'Sub-Caja',
      field: 'sub_caja_destino',
      width: 180,
      valueFormatter: (params) => params.value || 'N/A',
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
    {
      headerName: 'Fecha',
      field: 'fecha_transferencia',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
  ]

  // Columnas para Gastos
  const columnasGastos: ColDef[] = [
    {
      headerName: 'Concepto',
      field: 'concepto',
      flex: 1,
    },
    {
      headerName: 'Sub-Caja',
      field: 'sub_caja',
      width: 180,
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
    {
      headerName: 'Fecha',
      field: 'created_at',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
  ]

  // Columnas para Préstamos Dados
  const columnasPrestamosDados: ColDef[] = [
    {
      headerName: 'A Vendedor',
      field: 'vendedor_destino',
      width: 200,
    },
    {
      headerName: 'Motivo',
      field: 'motivo',
      flex: 1,
      valueFormatter: (params) => params.value || 'Sin motivo',
    },
    {
      headerName: 'Sub-Caja',
      field: 'sub_caja_origen',
      width: 180,
      valueFormatter: (params) => params.value || 'N/A',
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
    {
      headerName: 'Fecha',
      field: 'fecha_transferencia',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
  ]

  // Columnas para Movimientos Internos
  const columnasMovimientos: ColDef[] = [
    {
      headerName: 'Origen',
      field: 'sub_caja_origen',
      width: 180,
    },
    {
      headerName: 'Destino',
      field: 'sub_caja_destino',
      width: 180,
    },
    {
      headerName: 'Justificación',
      field: 'justificacion',
      flex: 1,
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 120,
      valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
      cellStyle: { fontWeight: 'bold', textAlign: 'right' },
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
    },
  ]

  // Preparar datos
  const ventasData = resumen.detalle_ventas || []
  const metodosPagoData = resumen.detalle_metodos_pago || []
  const otrosIngresosData = resumen.detalle_ingresos ? Object.values(resumen.detalle_ingresos) : []
  const prestamosRecibidosData = resumen.prestamos_recibidos || []
  const gastosData = resumen.detalle_egresos ? Object.values(resumen.detalle_egresos) : []
  const prestamosDadosData = resumen.prestamos_dados || []
  const movimientosData = resumen.movimientos_internos || []

  const items = [
    {
      key: '1',
      label: `Ventas del Día (${ventasData.length})`,
      children: (
        <div className='w-full'>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridVentasRef}
              rowData={ventasData}
              columnDefs={columnasVentas}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
              getRowHeight={(params) => {
                // Calcular altura dinámica basada en cantidad de pagos
                const pagosCount = params.data?.pagos?.length || 0
                return pagosCount > 1 ? 30 + (pagosCount * 25) : 50
              }}
            />
          </div>
          <div className='mt-3 p-3 bg-blue-50 rounded flex justify-between items-center'>
            <span className='font-semibold text-slate-700'>Total Ventas:</span>
            <span className='text-lg font-bold text-slate-800'>S/. {Number(resumen?.total_ventas || 0).toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: `Cobros por Método de Pago (${metodosPagoData.length})`,
      children: (
        <div className='w-full'>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridMetodosRef}
              rowData={metodosPagoData}
              columnDefs={columnasMetodosPago}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
            />
          </div>
          <div className='mt-3 p-3 bg-blue-50 rounded space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='font-semibold text-slate-700'>Total Transacciones:</span>
              <span className='text-lg font-bold text-slate-800'>
                {metodosPagoData.reduce((sum: number, m: any) => sum + m.cantidad_transacciones, 0)}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='font-semibold text-slate-700'>Total Cobros:</span>
              <span className='text-lg font-bold text-slate-800'>S/. {Number(resumen?.total_ventas || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: '3',
      label: `Otros Ingresos (${otrosIngresosData.length})`,
      children: (
        <div className='w-full'>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridIngresosRef}
              rowData={otrosIngresosData}
              columnDefs={columnasOtrosIngresos}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
            />
          </div>
          <div className='mt-3 p-3 bg-green-50 rounded flex justify-between items-center'>
            <span className='font-semibold text-slate-700'>Total Otros Ingresos:</span>
            <span className='text-lg font-bold text-slate-800'>
              S/. {((resumen.total_ingresos || 0) - (resumen.total_ventas || 0) - (resumen.total_prestamos_recibidos || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: `Préstamos Recibidos (${prestamosRecibidosData.length})`,
      children: (
        <div className='w-full'>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridPrestamosRecibidosRef}
              rowData={prestamosRecibidosData}
              columnDefs={columnasPrestamosRecibidos}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
            />
          </div>
          <div className='mt-3 p-3 bg-green-50 rounded flex justify-between items-center'>
            <span className='font-semibold text-slate-700'>Total Préstamos Recibidos:</span>
            <span className='text-lg font-bold text-slate-800'>S/. {(resumen.total_prestamos_recibidos || 0).toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      key: '5',
      label: `Gastos (${gastosData.length})`,
      children: (
        <div className='w-full'>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridGastosRef}
              rowData={gastosData}
              columnDefs={columnasGastos}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
            />
          </div>
          <div className='mt-3 p-3 bg-red-50 rounded flex justify-between items-center'>
            <span className='font-semibold text-slate-700'>Total Gastos:</span>
            <span className='text-lg font-bold text-slate-800'>
              S/. {((resumen.total_egresos || 0) - (resumen.total_prestamos_dados || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: '6',
      label: `Préstamos Dados (${prestamosDadosData.length})`,
      children: (
        <div className='w-full'>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridPrestamosDadosRef}
              rowData={prestamosDadosData}
              columnDefs={columnasPrestamosDados}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
            />
          </div>
          <div className='mt-3 p-3 bg-red-50 rounded flex justify-between items-center'>
            <span className='font-semibold text-slate-700'>Total Préstamos Dados:</span>
            <span className='text-lg font-bold text-slate-800'>S/. {(resumen.total_prestamos_dados || 0).toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      key: '7',
      label: `Movimientos Internos (${movimientosData.length})`,
      children: (
        <div className='w-full'>
          <div className='text-sm text-blue-600 mb-3 p-2 bg-blue-50 rounded'>
            ℹ️ Estos movimientos NO afectan el total en caja (solo traslados entre sub-cajas)
          </div>
          <div className='h-[400px] w-full'>
            <TableBase<any>
              ref={gridMovimientosRef}
              rowData={movimientosData}
              columnDefs={columnasMovimientos}
              rowSelection={false}
              withNumberColumn={true}
              headerColor='var(--color-amber-600)'
            />
          </div>
        </div>
      ),
    },
    {
      key: '8',
      label: 'Resumen Final',
      children: (
        <div className='bg-slate-50 p-6 rounded-lg'>
          <div className='max-w-2xl mx-auto space-y-4'>
            <div className='text-2xl font-bold text-slate-800 mb-6 text-center'>Resumen Final del Cierre</div>
            
            <div className='bg-white p-4 rounded-lg shadow-sm space-y-3'>
              <div className='flex justify-between items-center text-lg border-b pb-2'>
                <span className='font-semibold text-slate-700'>Efectivo Inicial:</span>
                <span className='font-bold text-slate-800'>S/. {(resumen.efectivo_inicial || 0).toFixed(2)}</span>
              </div>
              
              <div className='flex justify-between items-center text-lg border-b pb-2'>
                <span className='font-semibold text-slate-700'>Total Ingresos:</span>
                <span className='font-bold text-green-600'>+ S/. {Number(resumen?.total_ingresos || 0).toFixed(2)}</span>
              </div>
              
              <div className='flex justify-between items-center text-lg border-b pb-2'>
                <span className='font-semibold text-slate-700'>Total Egresos:</span>
                <span className='font-bold text-red-600'>- S/. {Number(resumen?.total_egresos || 0).toFixed(2)}</span>
              </div>
              
              <div className='h-px bg-slate-300 my-4'></div>
              
              <div className='flex justify-between items-center text-2xl bg-slate-100 p-4 rounded-lg'>
                <span className='font-bold text-slate-900'>Total en Caja:</span>
                <span className='font-bold text-slate-900'>S/. {montoEsperado.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className='p-4'>
      <Tabs
        defaultActiveKey='1'
        items={items}
      />
    </div>
  )
}
