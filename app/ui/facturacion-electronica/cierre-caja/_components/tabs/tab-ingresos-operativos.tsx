'use client'

import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '~/lib/api'
import { Spin } from 'antd'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'

interface TabIngresosOperativosProps {
  fecha: string
  fecha_fin?: string
  user_id?: string
}

const columnas: ColDef[] = [
  { headerName: 'Concepto', field: 'concepto', flex: 1 },
  {
    headerName: 'Método de Pago / Caja',
    width: 200,
    valueGetter: (p) => {
      const dp = p.data?.despliegue_pago
      if (!dp) return 'N/A'
      const subcaja = dp.subcaja_nombre || ''
      const metodo = dp.metodo_de_pago?.name || ''
      return [subcaja, metodo].filter(Boolean).join(' / ') || dp.name || 'N/A'
    },
  },
  {
    headerName: 'Usuario',
    width: 160,
    valueGetter: (p) => p.data?.user?.name || 'N/A',
  },
  {
    headerName: 'Monto',
    field: 'monto',
    width: 130,
    valueFormatter: (params) => `S/. ${Number(params.value).toFixed(2)}`,
    cellStyle: { fontWeight: 'bold', textAlign: 'right' },
  },
  {
    headerName: 'Fecha',
    field: 'created_at',
    width: 180,
    valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY HH:mm'),
  },
]

export default function TabIngresosOperativos({ fecha, fecha_fin, user_id }: TabIngresosOperativosProps) {
  const gridRef = useRef<AgGridReact<any>>(null)
  const fechaInicio = dayjs(fecha).format('YYYY-MM-DD')
  const fechaHasta = dayjs(fecha_fin || fecha).format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['tab-ingresos-operativos', fechaInicio, fechaHasta, user_id],
    queryFn: async () => {
      const params = new URLSearchParams({ fechaDesde: fechaInicio, fechaHasta, per_page: '500' })
      if (user_id) params.append('user_id', user_id)
      const res = await apiRequest<{ data: any[] }>(`/gastos-extras?${params.toString()}`)
      return res.data?.data || []
    },
    enabled: !!fecha && !!user_id,
  })

  const gastos = data || []
  const total = gastos.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0)

  if (!user_id) {
    return <div className='flex justify-center items-center py-20 text-slate-400'>Selecciona un usuario de la tabla para ver sus ingresos operativos.</div>
  }

  if (isLoading) {
    return <div className='flex justify-center items-center py-20'><Spin tip='Cargando ingresos operativos...' /></div>
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
      <div className='mt-3 p-3 bg-green-50 rounded flex justify-between items-center'>
        <span className='font-semibold text-slate-700'>Total Ingresos Operativos:</span>
        <span className='text-lg font-bold text-green-700'>S/. {total.toFixed(2)}</span>
      </div>
    </div>
  )
}
