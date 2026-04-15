'use client'

import { Modal, Tag, Table, Spin, Empty } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { compraApi, type Compra, type PagoDeCompra } from '~/lib/api/compra'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { formatFechaPeru } from '~/utils/fechas'
import { FaMoneyBillWave, FaFileInvoice, FaBuilding, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa'

interface ModalDetalleDeudaCompraProps {
  compra: Compra | null
  open: boolean
  onClose: () => void
}

function calcularTotalCompra(compra: Compra): number {
  return (compra.productos_por_almacen || []).reduce((acc, item) => {
    const costo = Number(item.costo ?? 0)
    for (const u of item.unidades_derivadas ?? []) {
      const cantidad = Number(u.cantidad ?? 0)
      const factor = Number(u.factor ?? 0)
      const flete = Number(u.flete ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += (bonificacion ? 0 : costo * cantidad * factor) + flete
    }
    return acc
  }, 0)
}

const tipoDocLabel: Record<string, string> = {
  '01': 'Factura', '03': 'Boleta', 'nv': 'Nota de Venta',
}

export default function ModalDetalleDeudaCompra({ compra, open, onClose }: ModalDetalleDeudaCompraProps) {
  const { data: pagosData, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS, compra?.id, 'pagos'],
    queryFn: async () => {
      const result = await compraApi.getPagos(compra!.id)
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    enabled: open && !!compra?.id,
    staleTime: 30 * 1000,
  })

  if (!compra) return null

  const total = calcularTotalCompra(compra)
  const totalPagado = Number(compra.total_pagado ?? 0)
  const saldo = total - totalPagado
  const pagos: PagoDeCompra[] = Array.isArray(pagosData?.data) ? pagosData.data : []
  const vencido = compra.fecha_vencimiento && new Date(compra.fecha_vencimiento) < new Date()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={
        <div className='flex items-center gap-2 py-1'>
          <div className='bg-blue-100 p-2 rounded-lg'>
            <FaFileInvoice className='text-blue-600' size={16} />
          </div>
          <div>
            <div className='font-bold text-gray-800'>
              {tipoDocLabel[compra.tipo_documento] ?? compra.tipo_documento} {compra.serie}-{String(compra.numero).padStart(4, '0')}
            </div>
            <div className='text-xs text-gray-500 font-normal'>Detalle de deuda y pagos</div>
          </div>
        </div>
      }
    >
      {/* Info del proveedor y fechas */}
      <div className='bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100'>
        <div className='flex items-center gap-2 mb-3'>
          <FaBuilding className='text-gray-500' size={13} />
          <span className='font-semibold text-gray-700'>{compra.proveedor?.razon_social ?? '-'}</span>
          <span className='text-gray-400 text-xs'>RUC: {compra.proveedor?.ruc ?? '-'}</span>
        </div>
        <div className='flex gap-6 text-sm'>
          <div className='flex items-center gap-1.5 text-gray-600'>
            <FaCalendarAlt size={12} className='text-gray-400' />
            <span className='text-gray-500'>Fecha:</span>
            <span className='font-medium'>{formatFechaPeru(compra.fecha, 'DD/MM/YYYY')}</span>
          </div>
          <div className='flex items-center gap-1.5 text-gray-600'>
            <FaCalendarAlt size={12} className={vencido ? 'text-red-400' : 'text-gray-400'} />
            <span className='text-gray-500'>Vencimiento:</span>
            {compra.fecha_vencimiento ? (
              <span className={`font-medium flex items-center gap-1 ${vencido ? 'text-red-600' : ''}`}>
                {vencido && <FaExclamationTriangle size={11} />}
                {formatFechaPeru(compra.fecha_vencimiento, 'DD/MM/YYYY')}
              </span>
            ) : (
              <span className='text-gray-400'>—</span>
            )}
          </div>
        </div>
      </div>

      {/* Tarjetas de montos */}
      <div className='grid grid-cols-3 gap-3 mb-5'>
        <div className='bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm'>
          <div className='text-xs text-gray-500 mb-1'>Total Compra</div>
          <div className='text-lg font-bold text-gray-800'>S/. {total.toFixed(2)}</div>
        </div>
        <div className='bg-green-50 border border-green-200 rounded-xl p-3 text-center shadow-sm'>
          <div className='text-xs text-green-600 mb-1'>Total Pagado</div>
          <div className='text-lg font-bold text-green-600'>S/. {totalPagado.toFixed(2)}</div>
        </div>
        <div className={`rounded-xl p-3 text-center shadow-sm border ${saldo > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className={`text-xs mb-1 ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>Saldo Pendiente</div>
          <div className={`text-lg font-bold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            S/. {saldo.toFixed(2)}
          </div>
          <Tag color={saldo <= 0 ? 'green' : 'red'} className='mt-1 text-xs'>
            {saldo <= 0 ? 'PAGADO' : 'PENDIENTE'}
          </Tag>
        </div>
      </div>

      {/* Barra de progreso de pago */}
      {total > 0 && (
        <div className='mb-5'>
          <div className='flex justify-between text-xs text-gray-500 mb-1'>
            <span>Progreso de pago</span>
            <span>{Math.min(100, (totalPagado / total) * 100).toFixed(0)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-green-500 h-2 rounded-full transition-all'
              style={{ width: `${Math.min(100, (totalPagado / total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabla de pagos */}
      <div className='flex items-center gap-2 mb-3'>
        <div className='bg-green-100 p-1.5 rounded-lg'>
          <FaMoneyBillWave className='text-green-600' size={13} />
        </div>
        <span className='font-semibold text-gray-700'>Pagos Realizados</span>
        <Tag color='blue' className='ml-1'>{pagos.length}</Tag>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-8'><Spin /></div>
      ) : pagos.length === 0 ? (
        <Empty description='Sin pagos registrados' className='py-6' />
      ) : (
        <Table<PagoDeCompra>
          dataSource={pagos}
          rowKey='id'
          size='small'
          pagination={false}
          className='rounded-lg overflow-hidden border border-gray-100'
          columns={[
            {
              title: 'Fecha',
              dataIndex: 'fecha',
              render: (v) => <span className='text-gray-600'>{formatFechaPeru(v, 'DD/MM/YYYY')}</span>,
              width: 95,
            },
            {
              title: 'Método',
              render: (_, r) => (
                <span className='font-medium text-gray-700'>
                  {r.despliegue_de_pago?.metodo_de_pago?.name ?? '-'}
                </span>
              ),
              width: 120,
            },
            {
              title: 'N° Operación',
              dataIndex: 'numero_operacion',
              render: (v) => <span className='text-gray-500 text-xs'>{v ?? '—'}</span>,
              width: 110,
            },
            {
              title: 'Monto',
              dataIndex: 'monto',
              render: (v) => (
                <span className='font-bold text-green-600'>S/. {Number(v).toFixed(2)}</span>
              ),
              width: 95,
              align: 'right',
            },
            {
              title: 'Estado',
              dataIndex: 'estado',
              render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Activo' : 'Anulado'}</Tag>,
              width: 75,
              align: 'center',
            },
            {
              title: 'Observación',
              dataIndex: 'observacion',
              render: (v) => <span className='text-gray-500 text-xs'>{v ?? '—'}</span>,
            },
          ]}
        />
      )}
    </Modal>
  )
}
