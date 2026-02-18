'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useGetGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_hooks/use-get-ganancias'
import { useStoreFiltrosMisGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias'
import { Spin } from 'antd'

export default function TableMisGanancias() {
  const filtros = useStoreFiltrosMisGanancias((state) => state.filtros)
  const { data, isLoading, error } = useGetGanancias(filtros)

  const rowData = data?.data?.data || []

  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'F.VENCE',
      field: 'fecha',
      width: 90,
    },
    {
      headerName: 'HORA',
      field: 'hora_emision',
      width: 80,
      // Siempre visible, sin condición
    },
    {
      headerName: 'T.DOC',
      field: 'tipo_doc',
      width: 70,
    },
    {
      headerName: 'NUMERO',
      field: 'numero',
      width: 130,
      cellClass: 'font-mono',
    },
    {
      headerName: 'F.PAGO',
      field: 'f_pago',
      width: 100,
    },
    {
      headerName: 'CLIENTE',
      field: 'cliente',
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'VENDEDOR',
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
      width: 120,
    },
    {
      headerName: 'CANT',
      field: 'cant',
      width: 70,
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellClass: 'text-right',
    },
    {
      headerName: 'P.UNIT',
      field: 'p_unit',
      width: 80,
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellClass: 'text-right',
    },
    {
      headerName: 'SUBTOT',
      field: 'subtot',
      width: 90,
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellClass: 'text-right font-semibold',
      pinned: 'right',
    },
    {
      headerName: 'CC',
      field: 'cc',
      width: 50,
      pinned: 'right',
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
