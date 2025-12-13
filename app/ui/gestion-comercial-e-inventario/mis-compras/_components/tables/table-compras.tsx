'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { usePaginatedServerQuery } from '~/hooks/use-paginated-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { getComprasPaginated } from '~/app/_actions/compra'
import { getComprasResponseProps } from '~/app/_actions/compra'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent } from 'ag-grid-community'
import { Prisma } from '@prisma/client'
import PaginationControls from '~/app/_components/tables/pagination-controls'

interface TableComprasProps {
  columns: ColDef<getComprasResponseProps>[]
  id: string
  setCompraSeleccionada: (compra: getComprasResponseProps | undefined) => void
  filtros: Prisma.CompraWhereInput | undefined
  querykeys: QueryKeys[]
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getComprasResponseProps | undefined
  }) => void
}

const TableCompras = memo(function TableCompras({
  columns,
  id,
  setCompraSeleccionada,
  filtros,
  querykeys,
  onRowDoubleClicked,
}: TableComprasProps) {
  const tableRef = useRef<AgGridReact>(null)

  const { 
    response, 
    loading, 
    currentPage,
    totalPages,
    total,
    nextPage,
    prevPage,
    pageSize
  } = usePaginatedServerQuery({
    action: getComprasPaginated,
    propsQuery: {
      queryKey: querykeys,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
    params: {
      where: filtros,
    },
    pageSize: 50, // 50 compras por página
    enabled: !!filtros,
  })

  // Memoizar callbacks para evitar re-renders innecesarios
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<getComprasResponseProps>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      setCompraSeleccionada(
        selectedNodes?.[0]?.data as getComprasResponseProps
      )
    },
    [setCompraSeleccionada]
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<getComprasResponseProps>) => {
      onRowDoubleClicked?.({ data: event.data })
    },
    [onRowDoubleClicked]
  )

  // Memoizar opciones de columnas para evitar recreaciones
  const optionsSelectColumns = useMemo(() => [
    {
      label: 'Default',
      columns: [
        '#',
        'Documento',
        'Serie',
        'Número',
        'Fecha',
        'RUC',
        'Proveedor',
        'Subtotal',
        'IGV',
        'Total',
        'Forma de Pago',
        'Total Pagado',
        'Resta',
        'Estado de Cuenta',
        'Registrador',
        'Estado',
        'Acciones',
      ],
    },
  ], [])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <TableWithTitle<getComprasResponseProps>
      id={id}
      onSelectionChanged={handleSelectionChanged}
      onRowDoubleClicked={handleRowDoubleClicked}
      tableRef={tableRef}
      title='Compras'
      schema={CompraCreateInputSchema}
      loading={loading}
      columnDefs={columns}
      rowData={response}
      optionsSelectColumns={optionsSelectColumns}
      // Habilitar lazy loading para mejor rendimiento
      suppressRowTransform={true}
      rowBuffer={10}
      cacheBlockSize={100}
    >
      {/* Paginación */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        loading={loading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </TableWithTitle>
  )
})

export default TableCompras
