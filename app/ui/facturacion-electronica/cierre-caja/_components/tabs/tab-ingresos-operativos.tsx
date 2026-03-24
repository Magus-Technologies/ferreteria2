'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { useQuery } from '@tanstack/react-query'
import { getIngresos } from '~/lib/api/ingresos'
import { Spin } from 'antd'
import dayjs from 'dayjs'

interface TabIngresosOperativosProps {
  fecha: string
}

const columnas: ColDef[] = [
  { headerName: 'Concepto', field: 'concepto', flex: 1 },
  {
    headerName: 'Método de Pago',
    field: 'metodo_pago',
    width: 180,
    valueFormatter: (params) => params.value || 'N/A',
  },
  { headerName: 'Cajero', field: 'cajero', width: 160, valueFormatter: (params) => params.value || 'N/A' },
  { headerName: 'Autoriza', field: 'autoriza', width: 160, valueFormatter: (params) => params.value || 'N/A' },
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

export default function TabIngresosOperativos({ fecha }: TabIngresosOperativosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)
  const fechaFormateada = dayjs(fecha).format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['tab-ingresos-operativos', fechaFormateada],
    queryFn: () => getIngresos({ desde: fechaFormateada, hasta: fechaFormateada, per_page: 500 }),
    enabled: !!fecha,
  })

  const ingresos = data?.data || []
  const total = ingresos.filter(i => !i.anulado).reduce((acc, i) => acc + Number(i.monto), 0)

  if (isLoading) {
    return <div className='flex justify-center items-center py-20'><Spin tip='Cargando ingresos...' /></div>
  }

  return (
    <div className='w-full'>
      <div className='h-[400px] w-full'>
        <TableBase<any>
          ref={gridRef}
          rowData={ingresos}
          columnDefs={columnas}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
      <div className='mt-3 p-3 bg-green-50 rounded flex justify-between items-center'>
        <span className='font-semibold text-slate-700'>Total Ingresos Operativos:</span>
        <span className='text-lg font-bold text-green-700'>S/. {total.toFixed(2)}</span>
      </div>
    </div>
  )
}
