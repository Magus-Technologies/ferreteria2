'use client'

import { useState, useEffect } from 'react'
import { ColDef, RowStyle } from 'ag-grid-community'
import { Button, InputNumber } from 'antd'
import { FaTrash, FaWeightHanging } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import SelectBase from '~/app/_components/form/selects/select-base'
import type { ProductoPaquete, TipoPrecioPaquete } from './paquete-types'
import { TIPO_PRECIO_OPTIONS } from './paquete-types'

// Re-export for backward compat with files that import types from here
export type { ProductoPaquete, TipoPrecioPaquete } from './paquete-types'
export { TIPO_PRECIO_OPTIONS, getPrecioOriginal, getPrecioPaquete, getDescuentoPaquete } from './paquete-types'

// ============= CELDA CANTIDAD =============

function CellInputCantidad({
  value,
  onCommit,
}: {
  value: number
  onCommit: (val: number) => void
}) {
  const [localValue, setLocalValue] = useState<number | null>(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const commit = () => {
    const final = Number(localValue ?? 0)
    if (final !== value) onCommit(final > 0 ? final : value)
    else if (localValue !== value) setLocalValue(value)
  }

  return (
    <div className="flex items-center h-full">
      <InputNumber
        size="small"
        className="w-full"
        value={localValue}
        min={0.001}
        precision={2}
        controls={false}
        onChange={(v) => setLocalValue(v === null ? null : Number(v))}
        onBlur={commit}
        onPressEnter={commit}
      />
    </div>
  )
}

// ============= PROPS =============

interface TableProductosPaqueteProps {
  productos: ProductoPaquete[]
  selectedKey?: string
  onProductoSelected?: (key: string) => void
  onEliminar: (key: string) => void
  onCantidadChange: (key: string, cantidad: number) => void
  onPrecioChange: (key: string, tipo: TipoPrecioPaquete, precio: number | undefined) => void
  onUnidadDerivadaChange: (key: string, unidadDerivadaId: number) => void
  onTipoPrecioChange: (key: string, tipo: TipoPrecioPaquete) => void
}

// ============= COMPONENTE =============

export default function TableProductosPaquete({
  productos,
  selectedKey,
  onProductoSelected,
  onEliminar,
  onCantidadChange,
  onPrecioChange,
  onUnidadDerivadaChange,
  onTipoPrecioChange,
}: TableProductosPaqueteProps) {
  const columnDefs: ColDef<ProductoPaquete>[] = [
    {
      headerName: 'Código',
      field: 'producto_codigo',
      width: 90,
    },
    {
      headerName: 'Producto',
      field: 'producto_name',
      flex: 2,
      cellClass: 'font-medium',
    },
    {
      headerName: 'Marca',
      field: 'marca_name',
      width: 85,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'U. Derivada',
      field: 'unidad_derivada_id',
      width: 130,
      cellRenderer: (params: any) => {
        const unidades = params.data?.unidades_derivadas_disponibles || []

        if (unidades.length === 0) {
          return <span className="px-2">{params.data?.unidad_derivada_name || '-'}</span>
        }

        const options = unidades.map((u: any) => ({
          value: u.unidad_derivada.id,
          label: u.unidad_derivada.name,
        }))

        return (
          <SelectBase
            size="small"
            variant="borderless"
            className="w-full"
            value={params.value}
            options={options}
            onChange={(nuevoId) => {
              onUnidadDerivadaChange(params.data.key, nuevoId)
              const unidadSeleccionada = unidades.find((u: any) => u.unidad_derivada.id === nuevoId)
              if (unidadSeleccionada) {
                onPrecioChange(params.data.key, 'publico', Number(unidadSeleccionada.precio_publico) || 0)
                onPrecioChange(params.data.key, 'especial', Number(unidadSeleccionada.precio_especial) || 0)
                onPrecioChange(params.data.key, 'minimo', Number(unidadSeleccionada.precio_minimo) || 0)
                onPrecioChange(params.data.key, 'ultimo', Number(unidadSeleccionada.precio_ultimo) || 0)
              }
            }}
            prefix={<FaWeightHanging size={12} className="text-cyan-600" />}
          />
        )
      },
    },
    {
      headerName: 'Tipo Precio',
      field: 'tipo_precio_vista',
      width: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <SelectBase
            size="small"
            variant="borderless"
            className="w-full"
            value={params.value}
            options={TIPO_PRECIO_OPTIONS}
            onChange={(val) => onTipoPrecioChange(params.data.key, val)}
          />
        </div>
      ),
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 80,
      cellRenderer: (params: any) => (
        <CellInputCantidad
          value={Number(params.value ?? 1)}
          onCommit={(val) => onCantidadChange(params.data.key, val)}
        />
      ),
    },
    {
      headerName: 'Acciones',
      width: 70,
      cellClass: 'text-center',
      cellRenderer: (params: any) => (
        <Button
          type="text"
          danger
          icon={<FaTrash />}
          onClick={() => onEliminar(params.data.key)}
          title="Eliminar producto"
          size="small"
        />
      ),
    },
  ]

  return (
    <TableWithTitle<ProductoPaquete>
      id="paquetes.productos"
      title="Productos del Paquete"
      selectionColor={orangeColors[10]}
      columnDefs={columnDefs}
      rowData={productos}
      getRowId={(params) => params.data.key}
      pagination={false}
      overlayNoRowsTemplate='<span class="text-gray-500">No hay productos agregados</span>'
      getRowStyle={(params): RowStyle => {
        if (params.data?.key === selectedKey) {
          return { background: orangeColors[10], cursor: 'pointer' }
        }
        return { cursor: 'pointer' }
      }}
      onRowClicked={(event) => {
        if (event.data) onProductoSelected?.(event.data.key)
      }}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['Código', 'Producto', 'Marca', 'U. Derivada', 'Tipo Precio', 'Cantidad', 'Acciones'],
        },
      ]}
    />
  )
}
