'use client'

import { useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import { InputNumber } from 'antd'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import type { ProductoPaquete, TipoPrecioPaquete } from './paquete-types'
import { getPrecioPaquete, getDescuentoPaquete } from './paquete-types'

// ============= CELDA PRECIO EDITABLE =============

function CellInputPrecio({
  value,
  max,
  onChange,
}: {
  value: number
  max?: number
  onChange: (val: number | undefined) => void
}) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const commit = () => {
    if (localValue !== value) onChange(localValue)
  }

  return (
    <div className="flex items-center h-full">
      <InputNumber
        size="small"
        className="w-full"
        prefix="S/."
        value={localValue}
        min={0}
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

// ============= PROPS =============

interface TablePreciosPaqueteProps {
  productos: ProductoPaquete[]
  onDescuentoChange: (key: string, tipo: TipoPrecioPaquete, descuento: number | undefined) => void
}

// ============= COMPONENTE =============

export default function TablePreciosPaquete({
  productos,
  onDescuentoChange,
}: TablePreciosPaqueteProps) {
  function colsPrecio(tipo: TipoPrecioPaquete, label: string): ColDef<ProductoPaquete>[] {
    return [
      {
        headerName: label,
        width: 110,
        cellRenderer: (params: any) => {
          if (!params.data) return null
          const precio = getPrecioPaquete(params.data, tipo)
          const descuento = getDescuentoPaquete(params.data, tipo)
          return (
            <div className="flex items-center h-full">
              <InputNumber
                size="small"
                className="w-full"
                prefix="S/."
                value={Math.max(0, precio - descuento)}
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
        headerName: `Desc. ${label}`,
        width: 100,
        cellRenderer: (params: any) => {
          if (!params.data) return null
          const precio = getPrecioPaquete(params.data, tipo)
          const descuento = getDescuentoPaquete(params.data, tipo)
          return (
            <CellInputPrecio
              value={descuento}
              max={precio}
              onChange={(val) => {
                const descuentoFinal = val !== undefined && val > precio ? precio : val
                onDescuentoChange(params.data.key, tipo, descuentoFinal)
              }}
            />
          )
        },
      },
    ]
  }

  const columnDefs: ColDef<ProductoPaquete>[] = [
    {
      headerName: 'Costo',
      field: 'costo',
      width: 110,
      cellRenderer: (params: any) => {
        if (!params.data) return null
        return (
          <div className="flex items-center h-full">
            <InputNumber
              size="small"
              className="w-full"
              prefix="S/."
              value={Number(params.data.costo ?? 0)}
              precision={2}
              controls={false}
              readOnly
              variant="borderless"
            />
          </div>
        )
      },
    },
    ...colsPrecio('publico', 'Precio Público'),
    ...colsPrecio('especial', 'Precio Especial'),
    ...colsPrecio('minimo', 'Precio Mínimo'),
    ...colsPrecio('ultimo', 'Precio Final'),
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
          columns: ['Costo', 'Precio Público', 'Desc. Precio Público', 'Precio Especial', 'Desc. Precio Especial', 'Precio Mínimo', 'Desc. Precio Mínimo', 'Precio Final', 'Desc. Precio Final'],
        },
      ]}
    />
  )
}
