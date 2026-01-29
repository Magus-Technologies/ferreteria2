'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { ProductoEntrega } from '../../_hooks/use-productos-entrega'

interface TablaProductosEntregaProps {
  productos: ProductoEntrega[]
  onProductoChange: (productos: ProductoEntrega[]) => void
}

export default function TablaProductosEntrega({
  productos,
  onProductoChange,
}: TablaProductosEntregaProps) {
  const columnDefs: ColDef<ProductoEntrega>[] = [
    {
      headerName: 'Producto',
      field: 'producto',
      flex: 1,
    },
    {
      headerName: 'Ubicación',
      field: 'ubicacion',
      width: 120,
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 100,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      headerName: 'Entregado',
      field: 'entregado',
      width: 120,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      headerName: 'Pendiente',
      field: 'pendiente',
      width: 120,
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: { color: '#f59e0b', fontWeight: 'bold' },
    },
    {
      headerName: 'Entregar',
      field: 'entregar',
      width: 120,
      editable: true,
      singleClickEdit: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: (params: { data: ProductoEntrega }) => params.data.pendiente,
        precision: 2,
      },
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: {
        backgroundColor: '#f0fdf4',
        color: '#000000',
        fontWeight: '500',
      },
      cellClass: 'ag-cell-editable',
    },
    {
      headerName: 'Eliminar',
      width: 80,
      cellRenderer: () => '❌',
      onCellClicked: (params) => {
        if (params.data) {
          onProductoChange(productos.filter((p) => p.id !== params.data!.id))
        }
      },
      cellStyle: {
        cursor: 'pointer',
        textAlign: 'center',
        color: '#ef4444',
      },
    },
  ]

  return (
    <div style={{ height: '350px' }}>
      <TableWithTitle<ProductoEntrega>
        id="productos-entrega"
        title="Lista de productos"
        selectionColor={orangeColors[10]}
        columnDefs={columnDefs}
        rowData={productos}
        onCellValueChanged={(params) => {
          onProductoChange(
            productos.map((p) =>
              p.id === params.data.id ? { ...p, entregar: params.newValue } : p
            )
          )
        }}
      />
    </div>
  )
}
