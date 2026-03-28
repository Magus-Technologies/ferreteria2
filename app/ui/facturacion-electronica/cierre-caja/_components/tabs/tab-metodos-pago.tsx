'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'

interface TabMetodosPagoProps {
  data: any[]
  totalVentas: number
}

const columnasMetodosPago: ColDef[] = [
  { headerName: 'Método de Pago', field: 'label', flex: 1 },
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

export default function TabMetodosPago({ data, totalVentas }: TabMetodosPagoProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='h-[420px] w-full'>
      <TableBase<any>
        ref={gridRef}
        rowData={data}
        columnDefs={columnasMetodosPago}
        rowSelection={false}
        withNumberColumn={true}
        headerColor='var(--color-amber-600)'
      />
    </div>
  )
}
