'use client'

import { memo, useMemo } from 'react'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tag } from 'antd'
import TableWithTitle from '~/components/tables/table-with-title'
import { type OrdenCompraProducto } from '~/lib/api/orden-compra'

interface TableProductosOrdenCompraProps {
  id: string
  productos: OrdenCompraProducto[]
}

const TableProductosOrdenCompra = memo(function TableProductosOrdenCompra({ id, productos }: TableProductosOrdenCompraProps) {
  const columns = useMemo<ColDef<OrdenCompraProducto>[]>(() => [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 120,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full font-semibold text-blue-600">
          {data?.codigo || '—'}
        </div>
      ),
    },
    {
      headerName: 'Producto',
      field: 'nombre',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full overflow-hidden text-ellipsis whitespace-nowrap">
          {data?.nombre || '—'}
        </div>
      ),
    },
    {
      headerName: 'Marca',
      field: 'marca',
      width: 130,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full">
          {data?.marca ? <Tag color="blue">{data.marca}</Tag> : '—'}
        </div>
      ),
    },
    {
      headerName: 'Unidad',
      field: 'unidad',
      width: 90,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full text-sm">{data?.unidad || '—'}</div>
      ),
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 100,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full font-semibold text-emerald-600">
          {data?.cantidad ?? 0}
        </div>
      ),
    },
    {
      headerName: 'Precio',
      field: 'precio',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full">
          S/. {Number(data?.precio ?? 0).toFixed(4)}
        </div>
      ),
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full font-semibold">
          S/. {Number(data?.subtotal ?? 0).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: 'Flete',
      field: 'flete',
      width: 100,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full">
          S/. {Number(data?.flete ?? 0).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: 'Vencimiento',
      field: 'vencimiento',
      width: 120,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full text-sm">{data?.vencimiento || '—'}</div>
      ),
    },
    {
      headerName: 'Lote',
      field: 'lote',
      width: 100,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<OrdenCompraProducto>) => (
        <div className="flex items-center h-full text-sm">{data?.lote || '—'}</div>
      ),
    },
  ], [])

  return (
    <TableWithTitle<OrdenCompraProducto>
      id={id}
      title="Productos de la Orden"
      columnDefs={columns}
      rowData={productos}
      rowSelection={false}
      withNumberColumn={false}
      exportExcel={false}
      exportPdf={false}
      selectColumns={false}
      selectionColor="transparent"
    />
  )
})

export default TableProductosOrdenCompra
