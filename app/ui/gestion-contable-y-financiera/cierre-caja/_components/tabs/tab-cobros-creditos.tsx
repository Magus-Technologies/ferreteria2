'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useQuery } from '@tanstack/react-query'
import { ventaApi } from '~/lib/api/venta'
import { Spin } from 'antd'
import dayjs from 'dayjs'

interface TabCobrosCreditsProps {
  fecha: string
  fecha_fin?: string
  user_id?: string
}

const columnas: ColDef[] = [
  {
    headerName: 'Cliente',
    field: 'cliente',
    flex: 1,
    valueGetter: (p) => p.data.cliente?.nombre || p.data.cliente?.razon_social || 'Sin cliente',
  },
  {
    headerName: 'Serie-Número',
    valueGetter: (p) => p.data.serie && p.data.numero ? `${p.data.serie}-${p.data.numero}` : 'S/N',
    width: 140,
  },
  {
    headerName: 'Tipo Doc.',
    field: 'tipo_documento',
    width: 100,
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
    headerName: 'Cobrado',
    field: 'total_cobrado',
    width: 120,
    valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    cellStyle: { textAlign: 'right', color: 'green' },
  },
  {
    headerName: 'Saldo',
    field: 'saldo_pendiente',
    width: 120,
    valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right', color: 'red' },
  },
]

export default function TabCobrosCreditos({ fecha, fecha_fin, user_id }: TabCobrosCreditsProps) {
  const gridRef = useRef<AgGridReact<any>>(null)
  const fechaInicio = dayjs(fecha).format('YYYY-MM-DD')
  const fechaHasta = dayjs(fecha_fin || fecha).format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['tab-cobros-creditos', fechaInicio, fechaHasta, user_id],
    queryFn: () => ventaApi.getVentasPorCobrar({ desde: fechaInicio, hasta: fechaHasta, user_id, per_page: 200 }),
    enabled: !!fecha && !!user_id,
  })

  const ventas = (data?.data as any)?.data || []
  const totalSaldo = ventas.reduce((acc: number, v: any) => acc + Number(v.saldo_pendiente || 0), 0)

  if (!user_id) {
    return <div className='flex justify-center items-center py-20 text-slate-400'>Selecciona un usuario de la tabla para ver sus cobros de créditos.</div>
  }

  if (isLoading) {
    return <div className='flex justify-center items-center py-20'><Spin tip='Cargando cobros de créditos...' /></div>
  }

  return (
    <div className='w-full'>
      <div className='h-[400px] w-full'>
        <TableWithTitle<any>
          id='cierre-caja-tab-cobros-creditos'
          title='Cobros de Créditos'
          tableRef={gridRef}
          rowData={ventas}
          columnDefs={columnas}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>
      <div className='mt-3 p-3 bg-blue-50 rounded flex justify-between items-center'>
        <span className='font-semibold text-slate-700'>Total Saldo por Cobrar:</span>
        <span className='text-lg font-bold text-blue-700'>S/. {totalSaldo.toFixed(2)}</span>
      </div>
    </div>
  )
}
