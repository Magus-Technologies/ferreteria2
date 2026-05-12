'use client'

import { Modal, Table, Tag, DatePicker } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { clienteApi, type Cliente } from '~/lib/api/cliente'
import { apiRequest } from '~/lib/api'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'

const { RangePicker } = DatePicker

interface ModalRecomendacionesClienteProps {
  open: boolean
  onClose: () => void
  cliente: Cliente | null
}

export default function ModalRecomendacionesCliente({ open, onClose, cliente }: ModalRecomendacionesClienteProps) {
  const [rango, setRango] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const fechaDesde = rango?.[0]?.format('YYYY-MM-DD')
  const fechaHasta = rango?.[1]?.format('YYYY-MM-DD')

  const { data, isLoading } = useQuery({
    queryKey: ['recomendaciones-cliente', cliente?.id, fechaDesde, fechaHasta],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)
      const qs = params.toString()
      const res = await apiRequest<{ data: { total_ventas: number; monto_total: number; ganancia_total: number; ventas: any[] } }>(
        `/clientes/${cliente!.id}/recomendaciones${qs ? `?${qs}` : ''}`
      )
      return res.data?.data
    },
    enabled: open && !!cliente?.id,
  })

  const nombre = cliente?.razon_social || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`Ventas recomendadas por: ${nombre}`}
      width={820}
      centered
    >
      {/* Filtro por fecha */}
      <div className='mb-4 flex items-center gap-3'>
        <span className='text-sm text-gray-600'>Filtrar por fecha:</span>
        <RangePicker
          format='DD/MM/YYYY'
          onChange={(v) => setRango(v as [Dayjs | null, Dayjs | null] | null)}
          allowClear
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

      <Table
        loading={isLoading}
        dataSource={data?.ventas ?? []}
        rowKey='id'
        size='small'
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: 'Comprobante',
            render: (_, r) => `${r.serie}-${String(r.numero).padStart(8, '0')}`,
            width: 130,
          },
          {
            title: 'Fecha',
            dataIndex: 'fecha',
            render: (v) => dayjs(v).format('DD/MM/YYYY'),
            width: 100,
          },
          {
            title: 'Cliente',
            render: (_, r) => r.cliente
              ? r.cliente.razon_social || `${r.cliente.nombres} ${r.cliente.apellidos}`.trim()
              : '-',
          },
          {
            title: 'Total',
            dataIndex: 'total',
            render: (v, r) => (
              <Tag color='green'>{r.tipo_moneda === 's' ? 'S/.' : '$.'} {Number(v).toFixed(2)}</Tag>
            ),
            width: 110,
            align: 'right',
          },
          {
            title: 'Ganancia',
            dataIndex: 'ganancia',
            render: (v) => (
              <Tag color={Number(v) >= 0 ? 'purple' : 'red'}>S/. {Number(v).toFixed(2)}</Tag>
            ),
            width: 110,
            align: 'right',
          },
        ]}
      />
    </Modal>
  )
}
