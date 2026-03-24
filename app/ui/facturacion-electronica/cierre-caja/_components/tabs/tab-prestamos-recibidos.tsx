'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import TabResumenCards from './tab-resumen-cards'
import dayjs from 'dayjs'

interface TabPrestamosRecibidosProps {
  data: any[]
  total: number
}

const columnasPrestamosRecibidos: ColDef[] = [
  { headerName: 'De Vendedor', field: 'vendedor_origen', width: 200 },
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

export default function TabPrestamosRecibidos({ data, total }: TabPrestamosRecibidosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)

  return (
    <div className='flex gap-4 w-full'>
      <div className='flex-1 h-[420px]'>
        <TableBase<any>
          ref={gridRef}
          rowData={data}
          columnDefs={columnasPrestamosRecibidos}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
      <TabResumenCards items={[
        { label: 'Cantidad', value: data.length, color: 'blue' },
        { label: 'Total Recibido', value: `S/. ${Number(total || 0).toFixed(2)}`, color: 'green' },
      ]} />
    </div>
  )
}
