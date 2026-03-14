'use client'

import { useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import { InputNumber } from 'antd'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import type { ProductoPaquete, TipoPrecioPaquete } from './table-productos-paquete'
import { getPrecioPaquete, getDescuentoPaquete } from './table-productos-paquete'

/** Input con estado local que solo notifica al padre en blur/enter */
function CellInputPrecio({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min?: number
  max?: number
  onChange: (val: number | undefined) => void
}) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const commit = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  return (
    <div className="flex items-center h-full">
      <InputNumber
        size="small"
        className="w-full"
        prefix="S/."
        value={localValue}
        min={min ?? 0}
        max={max}
        precision={2}
        controls={false}
        onChange={(val) => setLocalValue(Number(val ?? 0))}
        onBlur={commit}
        onPressEnter={commit}
      />
    </div>
  )
}

interface TablePreciosPaqueteProps {
  productos: ProductoPaquete[]
  onDescuentoChange: (key: string, tipo: TipoPrecioPaquete, descuento: number | undefined) => void
}

export default function TablePreciosPaquete({
  productos,
  onDescuentoChange,
}: TablePreciosPaqueteProps) {
  /** Genera par de columnas: Precio + Descuento para un tipo */
  function colsPrecio(tipo: TipoPrecioPaquete, label: string): ColDef<ProductoPaquete>[] {
    return [
      {
        headerName: label,
        width: 110,
        cellRenderer: (params: any) => {
          if (!params.data) return null
          const precio = getPrecioPaquete(params.data, tipo)
          return (
            <div className="flex items-center h-full">
              <InputNumber
                size="small"
                className="w-full"
                prefix="S/."
                value={precio}
                precision={2}
                controls={false}
                readOnly
                variant="borderless"
              />
            </div>
          )
        },
      },
      {
        headerName: `Desc.`,
        width: 100,
        cellRenderer: (params: any) => {
          if (!params.data) return null
          const descuento = getDescuentoPaquete(params.data, tipo)
          return (
            <CellInputPrecio
              value={descuento}
              onChange={(val) => onDescuentoChange(params.data.key, tipo, val)}
            />
          )
        },
      },
    ]
  }

  const columnDefs: ColDef<ProductoPaquete>[] = [
    {
      headerName: 'Producto',
      field: 'producto_name',
      flex: 1,
      cellClass: 'font-medium',
      minWidth: 150,
    },
    ...colsPrecio('publico', 'P. Público'),
    ...colsPrecio('especial', 'P. Especial'),
    ...colsPrecio('minimo', 'P. Mínimo'),
    ...colsPrecio('ultimo', 'P. Último'),
  ]

  return (
    <TableWithTitle<ProductoPaquete>
      id="paquetes.precios"
      title="Precios del Paquete"
      selectionColor={orangeColors[10]}
      columnDefs={columnDefs}
      rowData={productos}
      getRowId={(params) => params.data.key}
      pagination={false}
      domLayout="autoHeight"
      overlayNoRowsTemplate='<span class="text-gray-500">Agrega productos arriba para ver sus precios</span>'
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['Producto', 'P. Público', 'Desc.', 'P. Especial', 'Desc.', 'P. Mínimo', 'Desc.', 'P. Último', 'Desc.'],
        },
      ]}
    />
  )
}
