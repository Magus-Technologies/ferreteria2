'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { useQuery } from '@tanstack/react-query'
import { getGastos } from '~/lib/api/gastos'
import { Spin } from 'antd'
import dayjs from 'dayjs'

interface TabGastosOperativosProps {
  fecha: string
}

const columnas: ColDef[] = [
  { headerName: 'Motivo / Destino', valueGetter: (p) => p.data.motivo || p.data.destino || 'N/A', flex: 1 },
  { headerName: 'Comprobante', field: 'comprobante', width: 150, valueFormatter: (p) => p.value || 'N/A' },
  { headerName: 'Método de Pago', field: 'metodo_pago', width: 180, valueFormatter: (p) => p.value || 'N/A' },
  { headerName: 'Cajero', field: 'cajero', width: 160, valueFormatter: (p) => p.value || 'N/A' },
  {
    headerName: 'Monto',
    field: 'monto',
    width: 130,
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

export default function TabGastosOperativos({ fecha }: TabGastosOperativosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)
  const fechaFormateada = dayjs(fecha).format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['tab-gastos-operativos', fechaFormateada],
    queryFn: () => getGastos({ fechaDesde: fechaFormateada, fechaHasta: fechaFormateada, per_page: 500 } as any),
    enabled: !!fecha,
  })

  const gastos = data?.data || []
  const total = gastos.filter(g => !g.anulado).reduce((acc, g) => acc + Number(g.monto), 0)

  if (isLoading) {
    return <div className='flex justify-center items-center py-20'><Spin tip='Cargando gastos...' /></div>
  }

  return (
    <div className='w-full'>
      <div className='h-[400px] w-full'>
        <TableBase<any>
          ref={gridRef}
          rowData={gastos}
          columnDefs={columnas}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
      <div className='mt-3 p-3 bg-red-50 rounded flex justify-between items-center'>
        <span className='font-semibold text-slate-700'>Total Gastos Operativos:</span>
        <span className='text-lg font-bold text-red-700'>S/. {total.toFixed(2)}</span>
      </div>
    </div>
  )
}
