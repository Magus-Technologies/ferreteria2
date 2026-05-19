'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { formatFechaPeru } from '~/utils/fechas'

interface TabGastosProps {
  data: any[]
  total: number
}

const columnasGastos: ColDef[] = [
  { headerName: 'Concepto', field: 'concepto', flex: 1 },
  { headerName: 'Sub-Caja', field: 'sub_caja', width: 180 },
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
    valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A'),
  },
]

export default function TabGastos({ data, total }: TabGastosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='h-[420px] w-full'>
      <TableWithTitle<any>
        id='cierre-caja-tab-gastos'
        title='Gastos Extras'
        tableRef={gridRef}
        rowData={data}
        columnDefs={columnasGastos}
        rowSelection={false}
        withNumberColumn={true}
        headerColor='var(--color-amber-600)'
      />
    </div>
  )
}
