'use client'

import { useMemo, useCallback } from 'react'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import { useGetIngresos } from '../../_hooks/use-get-ingresos'
import TableBase from '~/components/tables/table-base'
import { ColDef } from 'ag-grid-community'
import type { Ingreso } from '~/lib/api/ingresos'

export default function TableMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)

  // Convert store filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return null
    
    return {
      desde: filtros.desde,
      hasta: filtros.hasta,
      user_id: filtros.user_id,
      concepto: filtros.concepto,
      search: filtros.search,
      per_page: 50,
      page: 1,
    }
  }, [filtros])

  // Usar datos reales de la API
  const { data: response, isLoading, error } = useGetIngresos(
    apiFilters || {},
    !!apiFilters
  )

  const data = response?.data || []

  const columns: ColDef<Ingreso>[] = useMemo(() => [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return ''
        // La fecha ya viene formateada desde el backend
        return params.value
      },
      sort: 'desc',
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 140,
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0)
        return `<span class="font-semibold text-rose-600">S/. ${monto.toFixed(2)}</span>`
      },
      type: 'numericColumn',
    },
    {
      headerName: 'Concepto',
      field: 'concepto',
      width: 200,
      flex: 1,
    },
    {
      headerName: 'Comentario',
      field: 'comentario',
      width: 250,
      flex: 1,
    },
    {
      headerName: 'Cajero',
      field: 'cajero',
      width: 150,
    },
    {
      headerName: 'Autoriza',
      field: 'autoriza',
      width: 150,
    },
  ], [])

  const getRowId = useCallback((params: any) => params.data.id, [])

  // Mostrar loading o error
  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-gray-500'>Cargando ingresos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-red-500'>Error al cargar los ingresos</div>
      </div>
    )
  }

  // Solo renderizar cuando hay filtros
  if (!apiFilters) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-gray-500'>Selecciona los filtros para ver los ingresos</div>
      </div>
    )
  }

  return (
    <div className='h-full'>
      <TableBase<Ingreso>
        columnDefs={columns}
        rowData={data}
        getRowId={getRowId}
        headerColor='var(--color-rose-600)'
        selectionColor='#fef2f2'
        pagination={false}
        rowSelection={true}
        tableKey='mis-ingresos'
      />
    </div>
  )
}