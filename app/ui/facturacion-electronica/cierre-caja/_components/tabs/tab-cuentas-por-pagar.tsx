'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { useQuery } from '@tanstack/react-query'
import { compraApi } from '~/lib/api/compra'
import { Spin } from 'antd'
import dayjs from 'dayjs'

const columnas: ColDef[] = [
  {
    headerName: 'Proveedor',
    field: 'proveedor',
    flex: 1,
    valueGetter: (p) => p.data.proveedor?.razon_social || 'N/A',
  },
  {
    headerName: 'Tipo Doc.',
    field: 'tipo_documento',
    width: 100,
  },
  {
    headerName: 'Serie-Número',
    valueGetter: (p) => p.data.serie && p.data.numero ? `${p.data.serie}-${p.data.numero}` : 'S/N',
    width: 140,
  },
  {
    headerName: 'Fecha',
    field: 'fecha',
    width: 120,
    valueFormatter: (params) => dayjs(params.value).format('DD/MM/YYYY'),
  },
  {
    headerName: 'Vencimiento',
    field: 'fecha_vencimiento',
    width: 120,
    valueFormatter: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : 'N/A',
    cellStyle: (params) => {
      if (!params.value) return null
      const venc = dayjs(params.value)
      if (venc.isBefore(dayjs(), 'day')) return { color: 'red', fontWeight: 'bold' }
      if (venc.isBefore(dayjs().add(7, 'day'), 'day')) return { color: 'orange', fontWeight: 'bold' }
      return null
    },
  },
  {
    headerName: 'Total',
    field: 'total',
    width: 120,
    valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right' },
  },
  {
    headerName: 'Pagado',
    field: 'total_pagado',
    width: 120,
    valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    cellStyle: { textAlign: 'right', color: 'green' },
  },
  {
    headerName: 'Saldo',
    valueGetter: (p) => Number(p.data.total || 0) - Number(p.data.total_pagado || 0),
    width: 120,
    valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right', color: 'red' },
  },
]

export default function TabCuentasPorPagar() {
  const gridRef = useRef<AgGridReact<any>>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tab-cuentas-por-pagar'],
    queryFn: () => compraApi.getComprasPorPagar({ per_page: 100 }),
  })

  const compras = (data?.data as any)?.data || data?.data || []
  const totalSaldo = compras.reduce((acc: number, c: any) => {
    return acc + (Number(c.total || 0) - Number(c.total_pagado || 0))
  }, 0)

  if (isLoading) {
    return <div className='flex justify-center items-center py-20'><Spin tip='Cargando cuentas por pagar...' /></div>
  }

  return (
    <div className='w-full'>
      <div className='h-[400px] w-full'>
        <TableBase<any>
          ref={gridRef}
          rowData={compras}
          columnDefs={columnas}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
      <div className='mt-3 p-3 bg-red-50 rounded flex justify-between items-center'>
        <span className='font-semibold text-slate-700'>Total Saldo Pendiente:</span>
        <span className='text-lg font-bold text-red-700'>S/. {totalSaldo.toFixed(2)}</span>
      </div>
    </div>
  )
}
