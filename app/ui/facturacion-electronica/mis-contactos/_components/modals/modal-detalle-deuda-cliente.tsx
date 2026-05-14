'use client'

import { Modal, Progress, Tag, Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { ventaApi, type CobroVenta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import dayjs from 'dayjs'

export interface DeudaClienteDetalle {
  id: string
  cliente_nombre: string
  numero_documento?: string
  documento: string
  serie_numero: string
  fecha_emision: string
  fecha_vencimiento: string
  monto_total: number
  monto_pagado: number
  deuda: number
  tipo_moneda: string
}

interface ModalDetalleDeudaClienteProps {
  open: boolean
  setOpen: (open: boolean) => void
  deuda: DeudaClienteDetalle | null
}

export default function ModalDetalleDeudaCliente({
  open,
  setOpen,
  deuda,
}: ModalDetalleDeudaClienteProps) {
  const { data: cobros = [], isLoading } = useQuery({
    queryKey: [QueryKeys.COBROS_VENTA, 'detalle', deuda?.id],
    queryFn: () => ventaApi.getCobros(deuda!.id),
    enabled: open && !!deuda?.id,
    select: r => r.data?.data ?? [],
  })

  if (!deuda) return null

  const moneda = deuda.tipo_moneda?.toLowerCase() === 'd' ? '$.' : 'S/.'
  const porcentaje = deuda.monto_total > 0
    ? Math.min(100, Math.round((deuda.monto_pagado / deuda.monto_total) * 100))
    : 0

  const statusTag =
    deuda.deuda <= 0
      ? <Tag color='success' className='text-sm font-bold px-3 py-0.5'>PAGADO</Tag>
      : deuda.monto_pagado > 0
        ? <Tag color='warning' className='text-sm font-bold px-3 py-0.5'>PARCIAL</Tag>
        : <Tag color='error' className='text-sm font-bold px-3 py-0.5'>PENDIENTE</Tag>

  const cobrosActivos = cobros.filter(c => c.estado !== false)

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      width: 110,
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Método',
      width: 140,
      render: (_: any, r: CobroVenta) =>
        r.despliegue_de_pago?.metodo_de_pago?.name ?? 'efectivo',
    },
    {
      title: 'N° Operación',
      dataIndex: 'numero_operacion',
      width: 130,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      width: 110,
      render: (v: number) => `${moneda} ${Number(v).toFixed(2)}`,
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'Activo' : 'Anulado'}</Tag>
      ),
    },
    {
      title: 'Observación',
      dataIndex: 'observacion',
      render: (v: string | null) => v ?? '—',
    },
  ]

  return (
    <Modal
      title={
        <div>
          <div className='font-bold text-base'>{deuda.documento} {deuda.serie_numero}</div>
          <div className='text-xs text-gray-500 font-normal'>Detalle de deuda y pagos</div>
        </div>
      }
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={820}
      destroyOnHidden
      loading={isLoading}
    >
      <div className='flex flex-col gap-4 pt-1'>
        {/* Cliente */}
        <div className='bg-gray-50 rounded-lg px-4 py-3'>
          <div className='font-bold text-base'>{deuda.cliente_nombre}</div>
          {deuda.numero_documento && (
            <div className='text-sm text-gray-500'>Doc: {deuda.numero_documento}</div>
          )}
          <div className='flex gap-8 mt-2 text-sm text-gray-600'>
            <div>
              <span className='font-medium'>Fecha:</span>{' '}
              {deuda.fecha_emision ? dayjs(deuda.fecha_emision).format('DD/MM/YYYY') : '—'}
            </div>
            {deuda.fecha_vencimiento && deuda.fecha_vencimiento !== deuda.fecha_emision && (
              <div>
                <span className='font-medium'>Vencimiento:</span>{' '}
                {dayjs(deuda.fecha_vencimiento).format('DD/MM/YYYY')}
              </div>
            )}
          </div>
        </div>

        {/* Resumen numérico */}
        <div className='grid grid-cols-3 gap-3'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-center'>
            <div className='text-xs text-blue-600 font-medium mb-1'>Total Venta</div>
            <div className='text-xl font-bold text-blue-700'>{moneda} {deuda.monto_total.toFixed(2)}</div>
          </div>
          <div className='bg-green-50 border border-green-200 rounded-lg p-3 text-center'>
            <div className='text-xs text-green-600 font-medium mb-1'>Total Pagado</div>
            <div className='text-xl font-bold text-green-700'>{moneda} {deuda.monto_pagado.toFixed(2)}</div>
          </div>
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-center'>
            <div className='text-xs text-red-600 font-medium mb-1'>Saldo Pendiente</div>
            <div className='text-xl font-bold text-red-700'>{moneda} {deuda.deuda.toFixed(2)}</div>
          </div>
        </div>

        {/* Estado + barra */}
        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            {statusTag}
            <span className='text-sm text-gray-500'>Progreso de pago: {porcentaje}%</span>
          </div>
          <Progress
            percent={porcentaje}
            status={deuda.deuda <= 0 ? 'success' : 'active'}
            strokeColor={deuda.deuda <= 0 ? '#52c41a' : '#3b82f6'}
            showInfo={false}
          />
        </div>

        {/* Cobros */}
        <div>
          <div className='text-sm font-semibold text-gray-700 mb-2'>
            Pagos Realizados: {cobrosActivos.length}
          </div>
          <Table<CobroVenta>
            dataSource={cobros}
            columns={columns}
            rowKey='id'
            size='small'
            pagination={false}
            rowClassName={r => (r.estado === false ? 'opacity-50' : '')}
            locale={{ emptyText: 'Sin pagos registrados' }}
          />
        </div>
      </div>
    </Modal>
  )
}
