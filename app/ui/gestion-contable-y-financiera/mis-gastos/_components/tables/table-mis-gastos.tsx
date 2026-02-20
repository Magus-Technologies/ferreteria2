'use client'

import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent, ICellRendererParams } from 'ag-grid-community'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import { useGetGastos } from '../../_hooks/use-get-gastos'
import { type Gasto } from '~/lib/api/gastos'
import dayjs from 'dayjs'
import TableBase from '~/components/tables/table-base'

// Componente para renderizar el estado
const EstadoCellRenderer = (props: ICellRendererParams) => {
  const anulado = Boolean(props.value)
  
  if (anulado) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Anulado
      </span>
    )
  }
  
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Activo
    </span>
  )
}

const TableMisGastos = memo(function TableMisGastos() {
  const filtros = useStoreFiltrosMisGastos(state => state.filtros)

  // Convert store filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return null
    
    return {
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      motivoGasto: filtros.motivoGasto,
      cajeroRegistra: filtros.cajeroRegistra,
      sucursal: filtros.sucursal,
      busqueda: filtros.busqueda,
      per_page: 100,
      page: 1
    }
  }, [filtros])

  // Fetch gastos data
  const { data: gastosResponse, isLoading, error } = useGetGastos(
    apiFilters || {},
    !!apiFilters
  )

  const gastosData = gastosResponse?.data || []

  // Definir columnas según la imagen
  const columns: ColDef<Gasto>[] = useMemo(() => [
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 100,
      valueFormatter: (params) => {
        if (!params.value) return ''
        return dayjs(params.value).format('DD/MM/YYYY')
      },
      sort: 'desc',
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 100,
      valueFormatter: (params) => {
        const monto = Number(params.value || 0)
        return `S/. ${monto.toFixed(2)}`
      },
      cellClass: 'font-semibold text-rose-600',
      type: 'numericColumn',
    },
    {
      headerName: 'DESTINO',
      field: 'destino',
      width: 150,
      flex: 1,
    },
    {
      headerName: 'MOTIVO',
      field: 'motivo',
      width: 250,
      flex: 1,
    },
    {
      headerName: 'COMPROBANTE',
      field: 'comprobante',
      width: 120,
    },
    {
      headerName: 'CAJERO',
      field: 'cajero',
      width: 120,
    },
    {
      headerName: 'AUTORIZA',
      field: 'autoriza',
      width: 120,
    },
    {
      headerName: 'ESTADO',
      field: 'anulado',
      width: 100,
      cellRenderer: EstadoCellRenderer,
      cellClass: 'flex items-center',
    },
  ], [])

  const getRowId = useCallback((params: any) => params.data.id, [])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  // Show loading state
  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-slate-500'>Cargando gastos...</div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-red-500'>Error al cargar gastos: {error.message}</div>
      </div>
    )
  }

  return (
    <div className='h-full'>
      <TableBase<Gasto>
        columnDefs={columns}
        rowData={gastosData}
        getRowId={getRowId}
        headerColor='var(--color-rose-600)'
        selectionColor='#fee2e2'
        pagination={false}
        suppressRowClickSelection={false}
        rowSelection={true}
        tableKey='mis-gastos'
      />
    </div>
  )
})

export default TableMisGastos