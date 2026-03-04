'use client'

import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent, RowClickedEvent } from 'ag-grid-community'
import PaginationControls from '~/app/_components/tables/pagination-controls'
import { ordenCompraApi, type OrdenCompra, type OrdenCompraFilters } from '~/lib/api/orden-compra'
import { useQuery } from '@tanstack/react-query'
import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface TableOrdenesCompraProps {
    columns: ColDef<OrdenCompra>[]
    id: string
    setOrdenSeleccionada: (orden: OrdenCompra | undefined) => void
    filtros: OrdenCompraFilters
}

const TableOrdenesCompra = memo(function TableOrdenesCompra({
    columns,
    id,
    setOrdenSeleccionada,
    filtros,
}: TableOrdenesCompraProps) {
    const tableRef = useRef<AgGridReact>(null)
    const [page, setPage] = useState(1)
    const pageSize = 50

    const apiFilters = useMemo(() => ({
        ...filtros,
        per_page: pageSize,
        page,
    }), [filtros, page])

    const { data, isLoading } = useQuery({
        queryKey: [QueryKeys.ORDENES_COMPRA, apiFilters],
        queryFn: async () => {
            const result = await ordenCompraApi.getAll(apiFilters)
            if (result.error) {
                throw new Error(result.error.message)
            }
            return result.data!
        },
        enabled: !!filtros.almacen_id,
    })

    const totalPages = data?.last_page ?? 0
    const total = data?.total ?? 0
    const rowData = data?.data ?? []

    const handleSelectionChanged = useCallback(
        (event: SelectionChangedEvent<OrdenCompra>) => {
            const selectedNodes = event.api?.getSelectedNodes() || []
            const selected = selectedNodes?.[0]?.data as OrdenCompra
            setOrdenSeleccionada(selected)
        },
        [setOrdenSeleccionada]
    )

    const handleRowClicked = useCallback(
        (event: RowClickedEvent<OrdenCompra>) => {
            event.node.setSelected(true)
        },
        []
    )

    const nextPage = useCallback(() => {
        if (page < totalPages) setPage(p => p + 1)
    }, [page, totalPages])

    const prevPage = useCallback(() => {
        if (page > 1) setPage(p => p - 1)
    }, [page])

    return (
        <TableWithTitle<OrdenCompra>
            id={id}
            selectionColor="#86efac" // greenColors[0] literal for clarity or import it
            onSelectionChanged={handleSelectionChanged}
            onRowClicked={handleRowClicked}
            tableRef={tableRef}
            title='Órdenes de Compra'
            loading={isLoading}
            columnDefs={columns}
            rowData={rowData}
            exportExcel={true}
            exportPdf={true}
            selectColumns={true}
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

export default TableOrdenesCompra
