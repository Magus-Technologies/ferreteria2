'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import { App, Button, Popconfirm, Tag } from 'antd'
import { FaTrash } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { ComisionPago } from '~/lib/api/comision'
import {
  useEliminarPagoComision,
  useHistorialPagosComision,
} from '../../_hooks/use-comisiones'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'

function formatPEN(n: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(n)
}

export default function TableHistorialPagos() {
  const filtros = useStoreFiltrosComisiones(s => s.filtros)
  const { data, isLoading } = useHistorialPagosComision(filtros)
  const { mutate: eliminar, isPending: eliminando } = useEliminarPagoComision()
  const { message } = App.useApp()

  const rowData = data?.data ?? []

  const columns = useMemo<ColDef<ComisionPago>[]>(
    () => [
      {
        headerName: 'Fecha Pago',
        field: 'fecha_pago',
        width: 120,
        valueFormatter: p =>
          p.value ? new Date(p.value).toLocaleDateString('es-PE') : '',
      },
      {
        headerName: 'Vendedor',
        width: 220,
        valueGetter: p => p.data?.vendedor?.name ?? '—',
      },
      {
        headerName: 'Periodo',
        width: 230,
        valueGetter: p => {
          const d = p.data
          if (!d) return ''
          const desde = new Date(d.periodo_desde).toLocaleDateString('es-PE')
          const hasta = new Date(d.periodo_hasta).toLocaleDateString('es-PE')
          return `${desde} → ${hasta}`
        },
      },
      {
        headerName: 'Monto',
        field: 'monto_pagado',
        width: 140,
        cellClass: 'text-right font-mono font-semibold text-green-700',
        valueFormatter: p => formatPEN(Number(p.value ?? 0)),
      },
      {
        headerName: 'Método',
        field: 'metodo_pago',
        width: 130,
        cellRenderer: (p: { value: string | null }) =>
          p.value ? <Tag color='blue'>{p.value.toUpperCase()}</Tag> : <span>—</span>,
      },
      {
        headerName: 'Registrado por',
        width: 180,
        valueGetter: p => p.data?.pagado_por_usuario?.name ?? '—',
      },
      {
        headerName: 'Observación',
        field: 'observacion',
        flex: 1,
        minWidth: 180,
      },
      {
        headerName: '',
        width: 80,
        pinned: 'right',
        cellRenderer: (p: { data: ComisionPago }) => (
          <Popconfirm
            title='¿Eliminar este pago?'
            okText='Sí'
            cancelText='No'
            onConfirm={() =>
              eliminar(p.data.id, {
                onSuccess: () => message.success('Pago eliminado'),
                onError: err =>
                  message.error(err instanceof Error ? err.message : 'Error al eliminar'),
              })
            }
          >
            <Button danger size='small' icon={<FaTrash />} loading={eliminando} />
          </Popconfirm>
        ),
      },
    ],
    [eliminar, eliminando, message]
  )

  return (
    <TableWithTitle<ComisionPago>
      id='table-historial-pagos-comision'
      title={`Historial de Pagos${rowData.length ? ` (${rowData.length})` : ''}`}
      columnDefs={columns}
      rowData={rowData}
      className='h-full w-full'
      headerColor='var(--color-green-600)'
      selectionColor='#dcfce7'
      loading={isLoading}
      noRowsOverlayComponent={() => (
        <div className='flex flex-col items-center justify-center py-8'>
          <p className='text-gray-500 mb-2'>Sin pagos registrados</p>
          <p className='text-gray-400 text-sm'>
            Los pagos realizados aparecerán aquí
          </p>
        </div>
      )}
    />
  )
}
