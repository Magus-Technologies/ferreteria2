'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useCallback, useMemo } from 'react'
import { type OrdenCompra, type OrdenCompraProducto } from '~/lib/api/orden-compra'
import { type ColDef, type RowClickedEvent } from 'ag-grid-community'
import { z } from 'zod'
import dayjs from 'dayjs'
import { toLocalString } from '~/utils/fechas'

const OrdenCompraProductoSchema = z.object({})

export default function TableDetalleOrdenCompra({
  compraSeleccionada,
  setCompraSeleccionada,
}: {
  compraSeleccionada: OrdenCompra | undefined
  setCompraSeleccionada: (value: OrdenCompra | undefined) => void
}) {
  const handleRowClicked = useCallback(
    (event: RowClickedEvent<OrdenCompraProducto>) => {
      event.node.setSelected(true)
    },
    []
  )

  const columns: ColDef<OrdenCompraProducto>[] = useMemo(
    () => [
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 60,
        cellStyle: () => ({ textAlign: 'center' }),
        pinned: 'left',
      },
      {
        headerName: 'Código',
        field: 'codigo',
        width: 120,
      },
      {
        headerName: 'Producto',
        field: 'nombre',
        width: 250,
      },
      {
        headerName: 'Marca',
        field: 'marca',
        width: 150,
      },
      {
        headerName: 'Unidad',
        field: 'unidad',
        width: 100,
        cellStyle: () => ({ textAlign: 'center' }),
      },
      {
        headerName: 'Cantidad',
        field: 'cantidad',
        width: 100,
        valueFormatter: params => (params.value || 0).toFixed(2),
        cellStyle: () => ({ textAlign: 'right' }),
      },
      {
        headerName: 'Precio',
        field: 'precio',
        width: 120,
        valueFormatter: params => `S/ ${(params.value || 0).toFixed(2)}`,
        cellStyle: () => ({ textAlign: 'right' }),
      },
      {
        headerName: 'Flete',
        field: 'flete',
        width: 100,
        valueFormatter: params => `S/ ${(params.value || 0).toFixed(2)}`,
        cellStyle: () => ({ textAlign: 'right' }),
      },
      {
        headerName: 'Subtotal',
        field: 'subtotal',
        width: 120,
        valueFormatter: params => `S/ ${(params.value || 0).toFixed(2)}`,
        cellStyle: () => ({ textAlign: 'right', fontWeight: 'bold' }),
      },
      {
        headerName: 'Lote',
        field: 'lote',
        width: 120,
        valueFormatter: params => (params.value ? String(params.value) : '-'),
      },
      {
        headerName: 'Vencimiento',
        field: 'vencimiento',
        width: 120,
        valueFormatter: params => {
          if (!params.value) return '-'
          const formatted = toLocalString({ date: dayjs(params.value), format: 'DD/MM/YYYY' })
          return formatted ?? '-'
        },
        cellStyle: () => ({ textAlign: 'center' }),
      },
    ],
    []
  )

  return (
    <TableWithTitle<OrdenCompraProducto>
      id='g-c-e-i.mis-compras.detalle-orden-compra'
      title='Detalle de Orden de Compra'
      schema={OrdenCompraProductoSchema}
      columnDefs={columns}
      onRowClicked={handleRowClicked}
      rowData={compraSeleccionada?.productos ?? []}
      selectColumns={false}
      exportExcel={false}
      exportPdf={false}
      withNumberColumn={false}
    />
  )
}
