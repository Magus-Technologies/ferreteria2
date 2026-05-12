'use client'

import { Modal, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { clienteApi, type Cliente } from '~/lib/api/cliente'
import dayjs from 'dayjs'

interface ModalRecomendacionesClienteProps {
  open: boolean
  onClose: () => void
  cliente: Cliente | null
}

export default function ModalRecomendacionesCliente({ open, onClose, cliente }: ModalRecomendacionesClienteProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['recomendaciones-cliente', cliente?.id],
    queryFn: () => clienteApi.recomendaciones(cliente!.id),
    enabled: open && !!cliente?.id,
    select: (r) => r.data?.data,
  })

  const nombre = cliente?.razon_social || `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`Ventas recomendadas por: ${nombre}`}
      width={750}
      centered
    >
      <div className='flex gap-6 mb-4'>
        <div className='bg-blue-50 rounded-lg px-5 py-3 text-center'>
          <div className='text-2xl font-bold text-blue-700'>{data?.total_ventas ?? 0}</div>
          <div className='text-xs text-blue-500'>Ventas</div>
        </div>
        <div className='bg-green-50 rounded-lg px-5 py-3 text-center'>
          <div className='text-2xl font-bold text-green-700'>S/. {(data?.monto_total ?? 0).toFixed(2)}</div>
          <div className='text-xs text-green-500'>Monto Total</div>
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
        ]}
      />
    </Modal>
  )
}
