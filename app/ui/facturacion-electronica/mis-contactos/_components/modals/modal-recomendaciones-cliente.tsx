'use client'

import { Modal, Tag, DatePicker } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { clienteApi, type Cliente } from '~/lib/api/cliente'
import { apiRequest } from '~/lib/api'
import TableWithTitle from '~/components/tables/table-with-title'
import dayjs, { type Dayjs } from 'dayjs'
import { useState, useMemo } from 'react'
import type { ColDef } from 'ag-grid-community'

const { RangePicker } = DatePicker

interface ModalRecomendacionesClienteProps {
  open: boolean
  onClose: () => void
  cliente: Cliente | null
}

type VentaRec = {
  id: string
  serie: string
  numero: number
  fecha: string
  tipo_moneda: string
  total: number
  ganancia: number
  cliente: { id: number; numero_documento: string; nombres: string; apellidos: string; razon_social: string | null } | null
}

export default function ModalRecomendacionesCliente({ open, onClose, cliente }: ModalRecomendacionesClienteProps) {
  const hoy = dayjs()
  const [rango, setRango] = useState<[Dayjs, Dayjs]>([hoy.startOf('day'), hoy.endOf('day')])

  const columns = useMemo<ColDef<VentaRec>[]>(() => [
    {
      colId: 'comprobante',
      headerName: 'Comprobante',
      valueGetter: (p) => `${p.data?.serie}-${String(p.data?.numero).padStart(8, '0')}`,
      width: 140,
    },
    {
      colId: 'fecha',
      headerName: 'Fecha',
      field: 'fecha',
      valueFormatter: (p) => p.value ? dayjs(p.value).format('DD/MM/YYYY') : '-',
      width: 110,
    },
    {
      colId: 'cliente',
      headerName: 'Cliente',
      valueGetter: (p) => {
        const c = p.data?.cliente
        if (!c) return '-'
        return c.razon_social || `${c.nombres} ${c.apellidos}`.trim()
      },
      flex: 1,
      minWidth: 150,
    },
    {
      colId: 'total',
      headerName: 'Total',
      field: 'total',
      valueFormatter: (p) => `S/. ${Number(p.value).toFixed(2)}`,
      width: 110,
      type: 'numericColumn',
    },
    {
      colId: 'ganancia',
      headerName: 'Ganancia',
      field: 'ganancia',
      valueFormatter: (p) => `S/. ${Number(p.value).toFixed(2)}`,
      width: 110,
      type: 'numericColumn',
      cellStyle: (p) => ({ color: Number(p.value) >= 0 ? '#7c3aed' : '#dc2626', fontWeight: 'bold' }),
    },
  ], [])

  const fechaDesde = rango[0].format('YYYY-MM-DD')
  const fechaHasta = rango[1].format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['recomendaciones-cliente', cliente?.id, fechaDesde, fechaHasta],
    queryFn: async () => {
      const res = await apiRequest<{ data: { total_ventas: number; monto_total: number; ganancia_total: number; ventas: VentaRec[] } }>(
        `/clientes/${cliente!.id}/recomendaciones?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
      )
      return res.data?.data
    },
    enabled: open && !!cliente?.id,
  })

  const nombre = cliente?.razon_social || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim()

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={`Ventas recomendadas por: ${nombre}`} width={860} centered destroyOnHidden={false}>
      {/* Filtro por fecha */}
      <div className='mb-4 flex items-center gap-3'>
        <span className='text-sm text-gray-600'>Período:</span>
        <RangePicker
          value={rango}
          format='DD/MM/YYYY'
          onChange={(v) => { if (v?.[0] && v?.[1]) setRango([v[0], v[1]]) }}
          allowClear={false}
          size='small'
        />
      </div>

      {/* Resumen */}
      <div className='flex gap-4 mb-4'>
        <div className='bg-blue-50 rounded-lg px-5 py-3 text-center'>
          <div className='text-2xl font-bold text-blue-700'>{data?.total_ventas ?? 0}</div>
          <div className='text-xs text-blue-500'>Ventas</div>
        </div>
        <div className='bg-green-50 rounded-lg px-5 py-3 text-center'>
          <div className='text-xl font-bold text-green-700'>S/. {(data?.monto_total ?? 0).toFixed(2)}</div>
          <div className='text-xs text-green-500'>Monto Total</div>
        </div>
        <div className='bg-purple-50 rounded-lg px-5 py-3 text-center'>
          <div className='text-xl font-bold text-purple-700'>S/. {(data?.ganancia_total ?? 0).toFixed(2)}</div>
          <div className='text-xs text-purple-500'>Ganancia Total</div>
        </div>
      </div>

      <div className='h-[320px]'>
        <TableWithTitle<VentaRec>
          id='recomendaciones-cliente-modal'
          title='Ventas'
          loading={isLoading}
          columnDefs={columns}
          rowData={data?.ventas ?? []}
          isVisible={open}
          selectionColor='#7c3aed22'
          persistColumnState={false}
        />
      </div>
    </Modal>
  )
}
