'use client'

import { Modal } from 'antd'
import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { ComisionDetalle, ComisionVendedor } from '~/lib/api/comision'
import { useComisionDetalleVendedor } from '../../_hooks/use-comisiones'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'

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
        width: 120,
        valueFormatter: p =>
          p.value ? new Date(p.value).toLocaleDateString('es-PE') : '',
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
        <div className='flex items-center justify-between pr-6'>
          <span>
            Detalle de Comisiones — {vendedor?.vendedor ?? ''}
          </span>
          {data && (
            <span className='text-sm text-gray-600 font-normal'>
              Total: <span className='font-mono font-semibold text-blue-700'>
                {formatPEN(data.total_comision)}
              </span>
            </span>
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
