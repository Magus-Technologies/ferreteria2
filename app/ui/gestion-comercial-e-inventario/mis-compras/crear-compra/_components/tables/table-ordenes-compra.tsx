'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useRef, memo, useCallback, useMemo, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { type ColDef, type SelectionChangedEvent, type RowClickedEvent } from 'ag-grid-community'
import { useStoreFiltrosOrdenesCompra } from '../../_store/store-filtros-ordenes-compra'
import { useStoreOrdenCompraSeleccionada } from '../../_store/store-orden-compra-seleccionada'
import { useColumnsOrdenesCompra } from './columns-ordenes-compra'
import { useQuery } from '@tanstack/react-query'
import { ordenCompraApi, type OrdenCompra } from '~/lib/api/orden-compra'
import { useStoreAlmacen } from '~/store/store-almacen'
import { z } from 'zod'

const OrdenCompraSchema = z.object({})

const TableOrdenesCompra = memo(function TableOrdenesCompra() {
  const tableRef = useRef<AgGridReact>(null)
  const filtros = useStoreFiltrosOrdenesCompra(state => state.filtros)
  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const setCompraSeleccionada = useStoreOrdenCompraSeleccionada(
    state => state.setCompra
  )

  const columns = useColumnsOrdenesCompra()

  const { data, isLoading } = useQuery({
    queryKey: ['ordenes-compra', filtros, almacen_id],
    queryFn: async () => {
      const result = await ordenCompraApi.getAll({ ...filtros, almacen_id })
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: !!almacen_id,
  })

  const rowData = useMemo(() => data?.data ?? [], [data?.data])

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<OrdenCompra>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      const selectedCompra = selectedNodes?.[0]?.data as OrdenCompra
      setCompraSeleccionada(selectedCompra)
      event.api?.redrawRows()
    },
    [setCompraSeleccionada]
  )

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<OrdenCompra>) => {
      event.node.setSelected(true)
    },
    []
  )

  // Seleccionar automáticamente la primera fila cuando se cargan los datos
  useEffect(() => {
    if (rowData && rowData.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0)
        if (firstNode) {
          firstNode.setSelected(true)
          setCompraSeleccionada(firstNode.data)
        }
      }, 100)
    }
  }, [rowData, setCompraSeleccionada])

  return (
    <TableWithTitle<OrdenCompra>
      id='g-c-e-i.mis-compras.ordenes-compra'
      selectionColor="transparent"
      onSelectionChanged={handleSelectionChanged}
      onRowClicked={handleRowClicked}
      tableRef={tableRef}
      title='Órdenes de Compra'
      schema={OrdenCompraSchema}
      loading={isLoading}
      columnDefs={columns}
      rowData={rowData}
      selectColumns={false}
      exportExcel={false}
      exportPdf={false}
      withNumberColumn={false}
    />
  )
})

export default TableOrdenesCompra
