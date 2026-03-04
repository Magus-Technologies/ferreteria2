'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, RowSelectedEvent } from 'ag-grid-community'
import { useQuery } from '@tanstack/react-query'
import TableWithTitle from '~/components/tables/table-with-title'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { requerimientoInternoApi, type RequerimientoInterno, type RequerimientoFilters } from '~/lib/api/requerimiento-interno'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface TableMisOSProps {
  id: string
  columns: ColDef<RequerimientoInterno>[]
  filtros: RequerimientoFilters
  selectionColor?: string
  onRowSelected?: (event: RowSelectedEvent<RequerimientoInterno>) => void
}

const TableMisOS = memo(function TableMisOS({ id, columns, filtros, selectionColor, onRowSelected }: TableMisOSProps) {
  const tableRef = useRef<AgGridReact>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const apiFilters = useMemo(() => ({
    ...filtros,
    tipo_solicitud: 'OS',
    per_page: pageSize,
    page,
  }), [filtros, page])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.ORDENES_DE_SERVICIO, apiFilters],
    queryFn: async () => {
      const result = await requerimientoInternoApi.getAll(apiFilters)
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
  })

  const totalPages = data?.last_page ?? 0
  const total = data?.total ?? 0
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
      title="Órdenes de Servicio"
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
          columns: ['Código', 'Título', 'Área', 'Tipo Servicio', 'Prioridad', 'Estado', 'Fecha Requerida', 'Acciones'],
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

export default TableMisOS
