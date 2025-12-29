'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import { Prisma, EstadoDeCompra } from '@prisma/client'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { compraApi, type Compra } from '~/lib/api/compra'
import { useQuery } from '@tanstack/react-query'

interface TableComprasProps {
  columns: ColDef<Compra>[]
  id: string
  setCompraSeleccionada: (compra: Compra | undefined) => void
  filtros: Prisma.CompraWhereInput | undefined
  querykeys: QueryKeys[]
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Compra | undefined
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
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Convert Prisma filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      estado_de_compra: filtros.estado_de_compra
        ? (filtros.estado_de_compra as { equals?: EstadoDeCompra })?.equals
        : undefined,
      proveedor_id: filtros.proveedor_id as number | undefined,
      per_page: pageSize,
      page,
    }
  }, [filtros, page])

  const { data, isLoading } = useQuery({
    queryKey: [...querykeys, apiFilters],
    queryFn: async () => {
      const result = await compraApi.getAll(apiFilters)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const totalPages = data?.last_page ?? 0
  const total = data?.total ?? 0
  const rowData = data?.data ?? []

  // Memoizar callbacks para evitar re-renders innecesarios
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Compra>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      setCompraSeleccionada(selectedNodes?.[0]?.data as Compra)
    },
    [setCompraSeleccionada]
  )

  const handleRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<Compra>) => {
      onRowDoubleClicked?.({ data: event.data })
    },
    [onRowDoubleClicked]
  )

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<Compra>) => {
      event.node.setSelected(true)
    },
    []
  )

  // Memoizar opciones de columnas para evitar recreaciones
  const optionsSelectColumns = useMemo(
    () => [
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
    ],
    []
  )

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(p => p + 1)
    }
  }, [page, totalPages])

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1)
    }
  }, [page])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <TableWithTitle<Compra>
      id={id}
      onSelectionChanged={handleSelectionChanged}
      onRowClicked={handleRowClicked}
      onRowDoubleClicked={handleRowDoubleClicked}
      tableRef={tableRef}
      title='Compras'
      schema={CompraCreateInputSchema}
      loading={isLoading}
      columnDefs={columns}
      rowData={rowData}
      optionsSelectColumns={optionsSelectColumns}
      // Habilitar lazy loading para mejor rendimiento
      suppressRowTransform={true}
      rowBuffer={10}
      cacheBlockSize={100}
    >
      {/* Paginación */}
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

export default TableCompras
