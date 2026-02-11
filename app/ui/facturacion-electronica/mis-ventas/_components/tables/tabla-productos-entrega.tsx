'use client'

import { ColDef, CellValueChangedEvent } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { ProductoEntrega } from '../../_hooks/use-productos-entrega'
import { useRef, useCallback } from 'react'

interface TablaProductosEntregaProps {
  productos: ProductoEntrega[]
  onProductoChange: (productos: ProductoEntrega[]) => void
}

export default function TablaProductosEntrega({
  productos,
  onProductoChange,
}: TablaProductosEntregaProps) {
  // Ref para evitar stale closures
  const productosRef = useRef(productos)
  productosRef.current = productos

  const onProductoChangeRef = useRef(onProductoChange)
  onProductoChangeRef.current = onProductoChange

  const handleCellValueChanged = useCallback((params: CellValueChangedEvent<ProductoEntrega>) => {
    if (params.colDef.field === 'entregar') {
      let newValue = Number(params.newValue) || 0
      const pendiente = params.data.pendiente

      // Validar que no exceda el pendiente
      if (newValue > pendiente) newValue = pendiente
      if (newValue < 0) newValue = 0

      const updated = productosRef.current.map((p) =>
        p.id === params.data.id ? { ...p, entregar: newValue } : p
      )
      onProductoChangeRef.current(updated)
    }
  }, [])

  const handleDelete = useCallback((id: number) => {
    onProductoChangeRef.current(
      productosRef.current.filter((p) => p.id !== id)
    )
  }, [])

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
        precision: 2,
      },
      valueSetter: (params) => {
        let newValue = Number(params.newValue) || 0
        if (newValue > params.data.pendiente) newValue = params.data.pendiente
        if (newValue < 0) newValue = 0
        params.data.entregar = newValue
        return true
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
      cellRenderer: (params: { data: ProductoEntrega }) => (
        <span
          style={{ cursor: 'pointer' }}
          onClick={() => params.data && handleDelete(params.data.id)}
        >
          ❌
        </span>
      ),
      cellStyle: {
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
        onCellValueChanged={handleCellValueChanged}
      />
    </div>
  )
}
