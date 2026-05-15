'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { ProductoEntrega } from '../../_hooks/use-productos-entrega'
import { useRef, useCallback, useState, useEffect, memo } from 'react'
import { InputNumber } from 'antd'

interface TablaProductosEntregaProps {
  productos: ProductoEntrega[]
  onProductoChange: (productos: ProductoEntrega[]) => void
  /**
   * Modo simple: oculta las columnas "Ubicación" y "Eliminar". Usado al
   * reusar la tabla en `mis-entregas` para actualizar una entrega existente
   * (los productos ya están fijados — no se eliminan ni se ubican).
   */
  simple?: boolean
}

type EntregarCellProps = {
  id: number
  initialValue: number
  max: number
  onCommit: (id: number, value: number | null) => void
}

const EntregarCell = memo(function EntregarCell({
  id,
  initialValue,
  max,
  onCommit,
}: EntregarCellProps) {
  const [value, setValue] = useState<number | null>(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <div className='flex items-center h-full'>
      <InputNumber
        size='small'
        value={value}
        min={0}
        max={max}
        precision={2}
        onChange={setValue}
        onBlur={() => onCommit(id, value)}
        onPressEnter={() => onCommit(id, value)}
        style={{ width: '100%' }}
      />
    </div>
  )
})

export default function TablaProductosEntrega({
  productos,
  onProductoChange,
  simple = false,
}: TablaProductosEntregaProps) {
  const mostrarRecibido = productos.some((p) => Number(p.recibido || 0) > 0)
  const mostrarProgramado = productos.some((p) => Number(p.programado || 0) > 0)
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

    const updated = productosRef.current.map((p) => {
      if (p.id !== id) return p
      // Auto-distribuir el resto a "programar". Descontar lo YA entregado en
      // entregas previas (>0 sólo en `crear-entrega-resto`), si no la suma
      // entregar+programado podría superar lo realmente disponible. En
      // `crear-venta` `entregado=0` y la fórmula se simplifica a
      // `total - newValue` igual que antes.
      const restoAuto = Math.max(0, p.total - newValue - (p.entregado || 0))
      return { ...p, entregar: newValue, entregar_programado: restoAuto }
    })
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
    ...(simple
      ? []
      : [{
          headerName: 'Ubicación',
          field: 'ubicacion',
          width: 120,
        } as ColDef<ProductoEntrega>]),
    {
      headerName: 'Total',
      field: 'total',
      width: 100,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    ...(mostrarRecibido
      ? [{
          headerName: 'Recibido',
          field: 'recibido',
          width: 110,
          valueFormatter: (params) => Number(params.value || 0).toFixed(2),
          cellStyle: { color: '#b45309', fontWeight: 'bold' },
        } as ColDef<ProductoEntrega>]
      : []),
    ...(mostrarProgramado
      ? [{
          headerName: 'Programado',
          field: 'programado',
          width: 120,
          valueFormatter: (params) => Number(params.value || 0).toFixed(2),
          cellStyle: { color: '#2563eb', fontWeight: 'bold' },
        } as ColDef<ProductoEntrega>]
      : []),
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
          <EntregarCell
            id={params.data.id}
            initialValue={params.data.entregar}
            max={params.data.pendiente}
            onCommit={handleEntregarChange}
          />
        )
      },
      cellStyle: {
        backgroundColor: '#f0fdf4',
      },
    },
    ...(simple
      ? []
      : [{
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
        } as ColDef<ProductoEntrega>]),
  ]

  return (
    <div style={{ height: '200px' }}>
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
