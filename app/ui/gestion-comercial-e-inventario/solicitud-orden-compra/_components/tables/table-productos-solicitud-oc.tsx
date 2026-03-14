'use client'

import { memo, useMemo } from 'react'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tag } from 'antd'
import TableWithTitle from '~/components/tables/table-with-title'
import { type RequerimientoInternoProducto } from '~/lib/api/requerimiento-interno'

interface TableProductosSolicitudOCProps {
  id: string
  productos: RequerimientoInternoProducto[]
}

const TableProductosSolicitudOC = memo(function TableProductosSolicitudOC({ id, productos }: TableProductosSolicitudOCProps) {
  const columns = useMemo<ColDef<RequerimientoInternoProducto>[]>(() => [
    {
      headerName: 'Código',
      field: 'producto.cod_producto',
      width: 120,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full font-semibold text-blue-600">
          {data?.producto?.cod_producto || '—'}
        </div>
      ),
    },
    {
      headerName: 'Producto',
      field: 'producto.name',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full overflow-hidden text-ellipsis whitespace-nowrap">
          {data?.producto?.name || data?.nombre_adicional || '—'}
        </div>
      ),
    },
    {
      headerName: 'Marca',
      field: 'producto.marca.name',
      width: 130,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full">
          {data?.producto?.marca?.name ? (
            <Tag color="blue">{data.producto.marca.name}</Tag>
          ) : (
            '—'
          )}
        </div>
      ),
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full font-semibold text-emerald-600">
          {data?.cantidad || 0}
        </div>
      ),
    },
    {
      headerName: 'Unidad',
      field: 'unidad',
      width: 100,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full text-sm">
          {data?.unidad || data?.producto?.unidad_medida?.name || '—'}
        </div>
      ),
    },
    {
      headerName: 'Pendiente',
      field: 'cantidad_pendiente',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full">
          <Tag color={data?.cantidad_pendiente && data.cantidad_pendiente > 0 ? 'orange' : 'green'}>
            {data?.cantidad_pendiente || 0}
          </Tag>
        </div>
      ),
    },
  ], [])

  return (
    <TableWithTitle<RequerimientoInternoProducto>
      id={id}
      title="Productos Solicitados"
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

export default TableProductosSolicitudOC
