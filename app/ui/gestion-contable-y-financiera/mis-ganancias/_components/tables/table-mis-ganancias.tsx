'use client'

import { useMemo } from 'react'
import { ColDef, CellStyle } from 'ag-grid-community' // Importamos CellStyle
import TableWithTitle from '~/components/tables/table-with-title'
import { useGetGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_hooks/use-get-ganancias'
import { useStoreFiltrosMisGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias'
import { Spin } from 'antd'
import type { GananciaDetalle } from '~/lib/api/ganancias'

export default function TableMisGanancias() {
  const filtros = useStoreFiltrosMisGanancias((state) => state.filtros)
  const { data, isLoading, error } = useGetGanancias(filtros)

  const rowData = data?.data?.data || []

  // Tipamos ColDef con GananciaDetalle para mejor soporte de TS
  const columns = useMemo<ColDef<GananciaDetalle>[]>(() => [
    {
      headerName: 'EMISION',
      field: 'fecha',
      width: 160,
      valueFormatter: (p) => {
        if (!p.data?.fecha) return '-'
        return p.data.hora_emision ? `${p.data.fecha} ${p.data.hora_emision}` : p.data.fecha
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
      cellStyle: { fontWeight: 'bold' } as CellStyle,
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
      cellStyle: { color: '#dc2626', fontWeight: 'bold' } as CellStyle,
    },
    {
      headerName: 'GANANC',
      field: 'ganancia',
      width: 90,
      type: 'numericColumn',
      valueFormatter: (p) => p.value?.toFixed(2) || '0.00',
      cellStyle: (p): CellStyle => ({
        color: (p.value ?? 0) >= 0 ? '#16a34a' : '#dc2626',
        fontWeight: 'bold',
        background: (p.value ?? 0) >= 0 ? '#f0fdf4' : '#fef2f2',
      }),
    },
  ], [])

  // ... resto del componente (isLoading, error, return) igual
  if (isLoading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
  if (error) return <div className="flex items-center justify-center h-64 text-center"><p className="text-red-500">Error al cargar</p></div>

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
    />
  )
}