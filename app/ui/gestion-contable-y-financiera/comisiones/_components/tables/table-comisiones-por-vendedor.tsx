'use client'

import { useMemo, useState } from 'react'
import { ColDef } from 'ag-grid-community'
import { Button, Space, Tag } from 'antd'
import { FaEye, FaMoneyBillWave } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { useComisionesPorVendedor } from '../../_hooks/use-comisiones'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'
import { ComisionVendedor } from '~/lib/api/comision'
import ModalDetalleVendedor from '../modals/modal-detalle-vendedor'
import ModalRegistrarPago from '../modals/modal-registrar-pago'

function formatPEN(n: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(n)
}

export default function TableComisionesPorVendedor() {
  const filtros = useStoreFiltrosComisiones(s => s.filtros)
  const { data, isLoading } = useComisionesPorVendedor(filtros)

  const [vendedorDetalle, setVendedorDetalle] = useState<ComisionVendedor | null>(null)
  const [vendedorPago, setVendedorPago] = useState<ComisionVendedor | null>(null)

  const rowData = data?.data ?? []

  const columns = useMemo<ColDef<ComisionVendedor>[]>(
    () => [
      {
        headerName: 'Vendedor',
        field: 'vendedor',
        flex: 2,
        minWidth: 200,
        cellRenderer: (p: { data: ComisionVendedor }) => (
          <div className='flex flex-col leading-tight'>
            <span className='font-medium'>{p.data.vendedor ?? '—'}</span>
            <span className='text-xs text-gray-500'>{p.data.email}</span>
          </div>
        ),
      },
      {
        headerName: 'Ventas',
        field: 'total_ventas',
        width: 100,
        cellClass: 'text-right',
      },
      {
        headerName: 'Generado',
        field: 'comision_generada',
        width: 140,
        cellClass: 'text-right font-mono',
        valueFormatter: p => formatPEN(p.value ?? 0),
      },
      {
        headerName: 'Pagado',
        field: 'comision_pagada',
        width: 140,
        cellClass: 'text-right font-mono text-green-700',
        valueFormatter: p => formatPEN(p.value ?? 0),
      },
      {
        headerName: 'Pendiente',
        field: 'comision_pendiente',
        width: 150,
        cellClass: 'text-right font-mono',
        cellRenderer: (p: { value: number }) => {
          const value = p.value ?? 0
          return (
            <Tag color={value > 0 ? 'orange' : 'default'} className='font-mono'>
              {formatPEN(value)}
            </Tag>
          )
        },
      },
      {
        headerName: 'Acciones',
        field: 'user_id',
        width: 220,
        pinned: 'right',
        cellRenderer: (p: { data: ComisionVendedor }) => (
          <Space size='small'>
            <Button
              type='default'
              size='small'
              icon={<FaEye />}
              onClick={() => setVendedorDetalle(p.data)}
            >
              Detalle
            </Button>
            <Button
              type='primary'
              size='small'
              icon={<FaMoneyBillWave />}
              onClick={() => setVendedorPago(p.data)}
              disabled={p.data.comision_pendiente <= 0}
            >
              Pagar
            </Button>
          </Space>
        ),
      },
    ],
    []
  )

  return (
    <>
      <TableWithTitle
        id='table-comisiones-por-vendedor'
        title={`Comisiones por Vendedor${rowData.length ? ` (${rowData.length})` : ''}`}
        columnDefs={columns}
        rowData={rowData}
        className='h-full w-full'
        headerColor='var(--color-orange-600)'
        selectionColor='#fed7aa'
        loading={isLoading}
        noRowsOverlayComponent={() => (
          <div className='flex flex-col items-center justify-center py-8'>
            <p className='text-gray-500 mb-2'>Sin comisiones en el rango seleccionado</p>
            <p className='text-gray-400 text-sm'>Ajuste los filtros o verifique las ventas</p>
          </div>
        )}
      />

      <ModalDetalleVendedor
        vendedor={vendedorDetalle}
        open={!!vendedorDetalle}
        onClose={() => setVendedorDetalle(null)}
      />
      <ModalRegistrarPago
        vendedor={vendedorPago}
        open={!!vendedorPago}
        onClose={() => setVendedorPago(null)}
      />
    </>
  )
}
