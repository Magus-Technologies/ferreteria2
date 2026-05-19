'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { Popover } from 'antd'
import { FaEye } from 'react-icons/fa'
import { formatFechaPeru } from '~/utils/fechas'

interface TabVentasProps {
  data: any[]
  totalVentas: number
}

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
    headerName: 'Total Pagos',
    field: 'pagos',
    width: 130,
    valueFormatter: (params) => {
      const total = (params.value || []).reduce((acc: number, p: { monto?: number | string }) => acc + Number(p.monto || 0), 0)
      return `S/. ${total.toFixed(2)}`
    },
    cellStyle: { fontWeight: 'bold', textAlign: 'right' },
  },
  {
    headerName: 'Detalle',
    field: 'pagos',
    width: 80,
    cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 0, paddingBottom: 0 },
    cellRenderer: (params: any) => (
      <Popover
        content={
          <div className='space-y-1 min-w-[260px]'>
            {(!params.value || params.value.length === 0)
              ? <span className='text-gray-400 text-xs'>Sin pagos registrados</span>
              : params.value.map((pago: { sub_caja?: string; metodo_pago?: string; numero_operacion?: string; monto?: number | string }, i: number) => (
                <div key={i} className='text-xs flex justify-between gap-4'>
                  <span>
                    <span className='font-semibold'>{pago.sub_caja || 'N/A'}</span>
                    {' · '}
                    <span className='text-blue-600'>{pago.metodo_pago}</span>
                    {pago.numero_operacion && <span className='text-gray-500'> (Op: {pago.numero_operacion})</span>}
                  </span>
                  <span className='font-bold whitespace-nowrap'>S/. {Number(pago.monto).toFixed(2)}</span>
                </div>
              ))
            }
          </div>
        }
        title='Detalle de Pagos'
        trigger='click'
        placement='left'
      >
        <button className='text-amber-600 hover:text-amber-800 cursor-pointer'>
          <FaEye size={16} />
        </button>
      </Popover>
    ),
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
    valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A'),
  },
]

export default function TabVentas({ data, totalVentas }: TabVentasProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='h-[420px] w-full'>
      <TableWithTitle<any>
        id='cierre-caja-tab-ventas'
        title='Ventas del Día'
        tableRef={gridRef}
        rowData={data}
        columnDefs={columnasVentas}
        rowSelection={false}
        withNumberColumn={true}
        headerColor='var(--color-amber-600)'
      />
    </div>
  )
}
