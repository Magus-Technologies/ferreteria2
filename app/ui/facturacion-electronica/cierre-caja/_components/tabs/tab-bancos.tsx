'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'

interface TabBancosProps {
  data: any[]
}

const columnasBancos: ColDef[] = [
  { headerName: 'Banco', field: 'banco', flex: 1, minWidth: 120 },
  { headerName: 'Titular', field: 'titular', flex: 1.2, minWidth: 150 },
  { headerName: 'Cuenta', field: 'cuenta', flex: 1, minWidth: 130 },
  {
    headerName: 'Monto Inicial',
    field: 'monto_inicial',
    flex: 0.9,
    minWidth: 120,
    valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right' },
  },
  {
    headerName: 'Ingresos',
    field: 'total_ingresos',
    flex: 0.9,
    minWidth: 120,
    valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right', color: 'green' },
  },
  {
    headerName: 'Egresos',
    field: 'total_egresos',
    flex: 0.9,
    minWidth: 120,
    valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right', color: 'red' },
  },
  {
    headerName: 'Saldo Final',
    field: 'saldo_final',
    flex: 1,
    minWidth: 130,
    valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right', backgroundColor: '#f0f9ff' },
  },
]

export default function TabBancos({ data }: TabBancosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='w-full'>
      <div className='h-[400px] w-full'>
        <TableWithTitle<any>
          id='cierre-caja-tab-bancos'
          title='Resumen de Bancos'
          tableRef={gridRef}
          rowData={data}
          columnDefs={columnasBancos}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
      <div className='mt-3 p-3 bg-blue-50 rounded space-y-2'>
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-slate-700'>Total Monto Inicial:</span>
          <span className='text-lg font-bold text-slate-800'>
            S/. {data.reduce((sum, b) => sum + Number(b.monto_inicial || 0), 0).toFixed(2)}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-slate-700'>Total Ingresos:</span>
          <span className='text-lg font-bold text-green-600'>
            S/. {data.reduce((sum, b) => sum + Number(b.total_ingresos || 0), 0).toFixed(2)}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='font-semibold text-slate-700'>Total Egresos:</span>
          <span className='text-lg font-bold text-red-600'>
            S/. {data.reduce((sum, b) => sum + Number(b.total_egresos || 0), 0).toFixed(2)}
          </span>
        </div>
        <div className='h-px bg-slate-300 my-2' />
        <div className='flex justify-between items-center'>
          <span className='font-bold text-slate-900'>Saldo Final Total:</span>
          <span className='text-xl font-bold text-slate-900'>
            S/. {data.reduce((sum, b) => sum + Number(b.saldo_final || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
