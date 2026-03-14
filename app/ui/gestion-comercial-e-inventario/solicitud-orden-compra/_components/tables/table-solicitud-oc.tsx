'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, RowSelectedEvent } from 'ag-grid-community'
import { useQuery } from '@tanstack/react-query'
import TableWithTitle from '~/components/tables/table-with-title'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { requerimientoInternoApi, type RequerimientoInterno, type RequerimientoFilters } from '~/lib/api/requerimiento-interno'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface TableSolicitudOCProps {
  id: string
  columns: ColDef<RequerimientoInterno>[]
  filtros: RequerimientoFilters
  selectionColor?: string
  onRowSelected?: (event: RowSelectedEvent<RequerimientoInterno>) => void
}

const TableSolicitudOC = memo(function TableSolicitudOC({ id, columns, filtros, selectionColor, onRowSelected }: TableSolicitudOCProps) {
  const tableRef = useRef<AgGridReact>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const apiFilters = useMemo(() => ({
    ...filtros,
    tipo_solicitud: 'OC',
    per_page: pageSize,
    page,
  }), [filtros, page])

  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.SOLICITUD_ORDEN_COMPRA, apiFilters],
    queryFn: async () => {
      const result = await requerimientoInternoApi.getAll(apiFilters)
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Mapear respuesta Laravel a estructura esperada
  const totalPages = data?.meta?.last_page ?? data?.last_page ?? 1
  const total = data?.meta?.total ?? data?.total ?? 0
  const rowData = data?.data ?? []

  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(p => p + 1)
  }, [page, totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) setPage(p => p - 1)
  }, [page])

  return (
    <TableWithTitle<RequerimientoInterno>
      id={id}
      title="Solicitudes de Orden de Compra"
      tableRef={tableRef}
      loading={isLoading}
      columnDefs={columns}
      rowData={rowData}
      exportExcel
      exportPdf
      selectColumns
      selectionColor={selectionColor}
      onRowSelected={onRowSelected}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['Código', 'Título', 'Área', 'Descripción', 'Presupuesto', 'Prioridad', 'Estado', 'Fecha Requerida', 'Acciones'],
        },
      ]}
    >
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        loading={isLoading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </TableWithTitle>
  )
})

export default TableSolicitudOC
