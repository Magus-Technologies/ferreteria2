'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useGetGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_hooks/use-get-ganancias'
import { useStoreFiltrosMisGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias'
import { Spin } from 'antd'
import type { GananciaDetalle } from '~/lib/api/ganancias'

export default function TableMisGanancias() {
  const filtros = useStoreFiltrosMisGanancias((state) => state.filtros)
  const { data, isLoading, error } = useGetGanancias(filtros)

  const rowData = data?.data?.data || []

  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'EMISION',
      field: 'fecha',
      width: 160,
      valueFormatter: (p) => {
        const row = p.data as GananciaDetalle
        if (!row?.fecha) return '-'
        return row.hora_emision ? `${row.fecha} ${row.hora_emision}` : row.fecha
      },
    },
    {
      headerName: 'F.VENCE',
      field: 'fecha_vencimiento',
      width: 95,
      valueFormatter: (p) => p.value || '-',
    },
    {
      headerName: 'T.DOC',
      field: 'tipo_doc',
      width: 70,
    },
    {
      headerName: 'NUMERO',
      field: 'numero',
      width: 155,
      cellClass: 'font-mono text-xs',
    },
    {
      headerName: 'F.PAGO',
      field: 'f_pago',
      width: 75,
    },
    {
      headerName: 'CLIENTE',
      field: 'cliente',
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'VENDED',
      field: 'vendedor',
      width: 100,
    },
    {
      headerName: 'PRODUCTO',
      field: 'producto',
      flex: 3,
      minWidth: 250,
    },
    {
      headerName: 'MARCA',
      field: 'marca',
      width: 110,
    },
    {
      headerName: 'CANT',
      field: 'cant',
      width: 65,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
    },
    {
      headerName: 'P.UNIT',
      field: 'p_unit',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
    },
    {
      headerName: 'SUBTOT',
      field: 'subtot',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: { fontWeight: 'bold' },
    },
    {
      headerName: 'C.CAJ',
      field: 'cc',
      width: 65,
    },
    {
      headerName: 'COSTO',
      field: 'costo_total',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: { color: '#dc2626', fontWeight: 'bold' },
    },
    {
      headerName: 'GANANC',
      field: 'ganancia',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: (p) => ({
        color: p.value >= 0 ? '#16a34a' : '#dc2626',
        fontWeight: 'bold',
        background: p.value >= 0 ? '#f0fdf4' : '#fef2f2',
      }),
    },
  ], [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error al cargar los datos</p>
          <p className="text-gray-500 text-sm">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <TableWithTitle
      id='table-mis-ganancias'
      title={`Detalle de Ganancias${rowData.length > 0 ? ` (${rowData.length} registros)` : ''}`}
      columnDefs={columns}
      rowData={rowData}
      className='h-full w-full'
      headerColor='var(--color-rose-600)'
      selectionColor="#fee2e2"
      withNumberColumn={false}
      noRowsOverlayComponent={() => (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-gray-500 mb-2">No hay datos de ganancias</p>
          <p className="text-gray-400 text-sm">
            {!filtros.almacen_id 
              ? 'Seleccione un almacén para ver los datos'
              : 'Ajuste los filtros para obtener resultados'
            }
          </p>
        </div>
      )}
    />
  )
}
