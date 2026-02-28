'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { ProductoEntrega } from '../../_hooks/use-productos-entrega'
import { useRef, useCallback } from 'react'
import { InputNumber } from 'antd'

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

  const handleEntregarChange = useCallback((id: number, value: number | null) => {
    let newValue = Number(value) || 0
    const producto = productosRef.current.find(p => p.id === id)
    if (!producto) return

    if (newValue > producto.pendiente) newValue = producto.pendiente
    if (newValue < 0) newValue = 0

    const updated = productosRef.current.map((p) =>
      p.id === id ? { ...p, entregar: newValue } : p
    )
    onProductoChangeRef.current(updated)
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
      width: 130,
      cellRenderer: (params: { data: ProductoEntrega }) => {
        if (!params.data) return null
        return (
          <div className='flex items-center h-full'>
            <InputNumber
              size='small'
              value={params.data.entregar}
              min={0}
              max={params.data.pendiente}
              precision={2}
              onChange={(val) => handleEntregarChange(params.data.id, val)}
              style={{ width: '100%' }}
            />
          </div>
        )
      },
      cellStyle: {
        backgroundColor: '#f0fdf4',
      },
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
      />
    </div>
  )
}
