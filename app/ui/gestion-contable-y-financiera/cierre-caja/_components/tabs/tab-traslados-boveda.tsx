'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { formatFechaPeru } from '~/utils/fechas'
import type { TrasladoBoveda } from '~/lib/api/traslado-boveda'

interface TabTrasladosBovedaProps {
  data: TrasladoBoveda[]
}

const columnas: ColDef[] = [
  {
    headerName: 'Fecha',
    field: 'fecha_traslado',
    width: 160,
    valueFormatter: (p) => formatFechaPeru(p.value, 'DD/MM/YYYY hh:mm:ss A'),
  },
  {
    headerName: 'Sub Caja',
    width: 160,
    valueGetter: (p) => p.data?.sub_caja?.nombre ?? '-',
  },
  {
    headerName: 'Vendedor',
    flex: 1,
    minWidth: 140,
    valueGetter: (p) => p.data?.vendedor?.name ?? '-',
  },
  {
    headerName: 'Supervisor',
    flex: 1,
    minWidth: 140,
    valueGetter: (p) => p.data?.supervisor?.name ?? '-',
  },
  {
    headerName: 'Justificación',
    field: 'justificacion',
    flex: 2,
    minWidth: 180,
    valueFormatter: (p) => p.value ?? '-',
  },
  {
    headerName: 'Monto',
    field: 'monto',
    width: 130,
    type: 'numericColumn',
    valueFormatter: (p) => `S/. ${Number(p.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right' },
  },
]

export default function TabTrasladosBoveda({ data }: TabTrasladosBovedaProps) {
  const gridRef = useRef<AgGridReact<any>>(null)
  const total = data.reduce((sum, t) => sum + Number(t.monto), 0)

  return (
    <div className='w-full space-y-2'>
      <div className='flex items-center justify-between px-1'>
        <span className='text-xs text-slate-500 italic'>
          Los traslados a bóveda no afectan el total del cierre de caja.
        </span>
        <span className='text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded'>
          Total trasladado: S/. {total.toFixed(2)}
        </span>
      </div>
      <div className='h-[400px] w-full'>
        <TableWithTitle<any>
          id='cierre-caja-tab-traslados-boveda'
          title='Traslados a Bóveda'
          tableRef={gridRef}
          rowData={data}
          columnDefs={columnas}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
    </div>
  )
}
