'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import dayjs from 'dayjs'

interface TabMovimientosProps {
  data: any[]
}

const columnasMovimientos: ColDef[] = [
  { headerName: 'Origen', field: 'sub_caja_origen', width: 180 },
  { headerName: 'Destino', field: 'sub_caja_destino', width: 180 },
  { headerName: 'Justificación', field: 'justificacion', flex: 1 },
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

export default function TabMovimientos({ data }: TabMovimientosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='w-full'>
      <div className='h-[400px] w-full'>
        <TableBase<any>
          ref={gridRef}
          rowData={data}
          columnDefs={columnasMovimientos}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
    </div>
  )
}
