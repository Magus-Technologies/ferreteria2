'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import dayjs from 'dayjs'

interface TabOtrosIngresosProps {
  data: any[]
  total: number
}

const columnasOtrosIngresos: ColDef[] = [
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
    valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm'),
  },
]

export default function TabOtrosIngresos({ data, total }: TabOtrosIngresosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='h-[420px] w-full'>
      <TableBase<any>
        ref={gridRef}
        rowData={data}
        columnDefs={columnasOtrosIngresos}
        rowSelection={false}
        withNumberColumn={true}
        headerColor='var(--color-amber-600)'
      />
    </div>
  )
}
