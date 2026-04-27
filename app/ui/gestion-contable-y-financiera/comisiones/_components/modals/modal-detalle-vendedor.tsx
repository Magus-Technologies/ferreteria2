'use client'

import { Modal, Tag } from 'antd'
import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { ComisionDetalle, ComisionVendedor } from '~/lib/api/comision'
import { useComisionDetalleVendedor } from '../../_hooks/use-comisiones'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'
import { formatFechaPeru } from '~/utils/fechas'

const ESTADO_PAGO_TAG: Record<ComisionDetalle['estado_pago'], { color: string; label: string }> = {
  pagada: { color: 'green', label: 'Pagada' },
  parcial: { color: 'gold', label: 'Parcial' },
  pendiente: { color: 'red', label: 'Pendiente' },
}

interface Props {
  vendedor: ComisionVendedor | null
  open: boolean
  onClose: () => void
}

function formatPEN(n: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(n)
}

export default function ModalDetalleVendedor({ vendedor, open, onClose }: Props) {
  const filtros = useStoreFiltrosComisiones(s => s.filtros)
  const { desde, hasta, almacen_id } = filtros

  const { data, isLoading } = useComisionDetalleVendedor(vendedor?.user_id ?? null, {
    desde,
    hasta,
    almacen_id,
  })

  const rowData = data?.data ?? []

  const columns = useMemo<ColDef<ComisionDetalle>[]>(
    () => [
      {
        headerName: 'Fecha',
        field: 'fecha',
        width: 180,
        valueFormatter: p =>
          p.value ? formatFechaPeru(p.value, 'DD/MM/YYYY hh:mm:ss A') : '',
      },
      {
        headerName: 'Comprobante',
        field: 'comprobante',
        width: 130,
        cellClass: 'font-mono',
      },
      {
        headerName: 'Cliente',
        field: 'cliente',
        flex: 1.2,
        minWidth: 180,
      },
      {
        headerName: 'Cód. Producto',
        field: 'producto_codigo',
        width: 130,
        cellClass: 'font-mono text-xs',
        valueFormatter: p => p.value || '-',
      },
      {
        headerName: 'Producto',
        field: 'producto',
        flex: 2,
        minWidth: 220,
      },
      {
        headerName: 'Cant.',
        field: 'cantidad',
        width: 80,
        cellClass: 'text-right',
        valueFormatter: p => (p.value ?? 0).toFixed(2),
      },
      {
        headerName: 'Precio',
        field: 'precio',
        width: 100,
        cellClass: 'text-right font-mono',
        valueFormatter: p => formatPEN(p.value ?? 0),
      },
      {
        headerName: 'Comisión Unit.',
        field: 'comision',
        width: 130,
        cellClass: 'text-right font-mono',
        valueFormatter: p => formatPEN(p.value ?? 0),
      },
      {
        headerName: 'Comisión Total',
        field: 'comision_total',
        width: 140,
        cellClass: 'text-right font-mono text-blue-700 font-semibold',
        valueFormatter: p => formatPEN(p.value ?? 0),
      },
      {
        headerName: 'Pagado',
        field: 'monto_pagado',
        width: 110,
        cellClass: 'text-right font-mono text-green-700',
        valueFormatter: p => formatPEN(p.value ?? 0),
      },
      {
        headerName: 'Estado',
        field: 'estado_pago',
        width: 110,
        cellRenderer: (p: { value?: ComisionDetalle['estado_pago'] }) => {
          const cfg = p.value ? ESTADO_PAGO_TAG[p.value] : null
          if (!cfg) return null
          return <Tag color={cfg.color} className="!font-semibold">{cfg.label}</Tag>
        },
      },
    ],
    []
  )

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      title={
        <div className='flex items-center justify-between pr-6 gap-4 flex-wrap'>
          <span>
            Detalle de Comisiones — {vendedor?.vendedor ?? ''}
          </span>
          {data && (
            <div className='flex items-center gap-3 text-sm font-normal'>
              <span className='text-gray-600'>
                Total: <span className='font-mono font-semibold text-blue-700'>{formatPEN(data.total_comision)}</span>
              </span>
              <span className='text-gray-600'>
                Pagado: <span className='font-mono font-semibold text-green-700'>{formatPEN(data.total_pagado ?? 0)}</span>
              </span>
              <span className='text-gray-600'>
                Pendiente: <span className='font-mono font-semibold text-red-700'>{formatPEN(data.total_pendiente ?? 0)}</span>
              </span>
            </div>
          )}
        </div>
      }
      destroyOnHidden
    >
      <div className='h-[500px] w-full mt-3'>
        <TableWithTitle<ComisionDetalle>
          id='table-detalle-comision-vendedor'
          title={`${rowData.length} movimiento${rowData.length === 1 ? '' : 's'}`}
          columnDefs={columns}
          rowData={rowData}
          className='h-full w-full'
          headerColor='var(--color-blue-600)'
          selectionColor='#dbeafe'
          loading={isLoading}
        />
      </div>
    </Modal>
  )
}
