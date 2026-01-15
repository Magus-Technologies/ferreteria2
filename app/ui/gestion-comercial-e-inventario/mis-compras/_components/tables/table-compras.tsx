'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { greenColors } from '~/lib/colors'
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

    // Mapeo de estados de Prisma a valores de Laravel
    const estadoMap: Record<EstadoDeCompra, string> = {
      [EstadoDeCompra.Creado]: 'cr',
      [EstadoDeCompra.EnEspera]: 'ee',
      [EstadoDeCompra.Anulado]: 'an',
      [EstadoDeCompra.Procesado]: 'pr',
    };

    // Extraer estado_de_compra
    let estadoDeCompra: string | undefined;
    if (filtros.estado_de_compra) {
      const estadoFilter = filtros.estado_de_compra as any;
      if (estadoFilter.equals) {
        estadoDeCompra = estadoMap[estadoFilter.equals as EstadoDeCompra];
      } else if (estadoFilter.in && Array.isArray(estadoFilter.in) && estadoFilter.in.length > 0) {
        // Si hay múltiples estados, tomar el primero (o podrías enviar todos)
        // Por ahora, el backend no soporta múltiples estados, así que omitimos este filtro
        estadoDeCompra = undefined;
      } else if (typeof estadoFilter === 'string') {
        estadoDeCompra = estadoMap[estadoFilter as EstadoDeCompra];
      }
    }

    // Extraer fechas
    const fechaFilter = filtros.fecha as any;
    const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined;
    const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined;

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      estado_de_compra: estadoDeCompra,
      proveedor_id: filtros.proveedor_id as number | undefined,
      forma_de_pago: filtros.forma_de_pago as string | undefined,
      tipo_documento: filtros.tipo_documento as string | undefined,
      user_id: filtros.user_id as string | undefined,
      desde,
      hasta,
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

  // Seleccionar automáticamente la primera fila cuando se cargan los datos
  useEffect(() => {
    if (rowData && rowData.length > 0 && tableRef.current) {
      // Esperar un momento para que la tabla se renderice completamente
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setCompraSeleccionada(firstNode.data);
        }
      }, 100);
    }
  }, [rowData, setCompraSeleccionada]);

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <TableWithTitle<Compra>
      id={id}
      selectionColor={greenColors[10]} // Color verde para gestión comercial e inventario
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
