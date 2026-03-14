'use client'

import { useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import { Button, InputNumber } from 'antd'
import { FaTrash, FaWeightHanging } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import SelectBase from '~/app/_components/form/selects/select-base'

export type TipoPrecioPaquete = 'publico' | 'especial' | 'minimo' | 'ultimo'

export const TIPO_PRECIO_OPTIONS = [
  { value: 'publico', label: 'P. Público' },
  { value: 'especial', label: 'P. Especial' },
  { value: 'minimo', label: 'P. Mínimo' },
  { value: 'ultimo', label: 'P. Último' },
]

export interface ProductoPaquete {
  key: string
  producto_id: number
  producto_name: string
  producto_codigo: string
  marca_name?: string
  unidad_derivada_id: number
  unidad_derivada_name: string
  cantidad: number
  precio_publico?: number
  precio_especial?: number
  precio_minimo?: number
  precio_ultimo?: number
  descuento_publico?: number
  descuento_especial?: number
  descuento_minimo?: number
  descuento_ultimo?: number
  tipo_precio_vista: TipoPrecioPaquete
  costo?: number
  unidades_derivadas_disponibles?: any[]
}

/** Obtener el precio original del producto según tipo y unidad derivada */
export function getPrecioOriginal(producto: ProductoPaquete, tipo?: TipoPrecioPaquete): number {
  const unidades = producto.unidades_derivadas_disponibles || []
  const unidad = unidades.find((u: any) => u.unidad_derivada.id === producto.unidad_derivada_id)
  if (!unidad) return 0
  const campo = `precio_${tipo || producto.tipo_precio_vista}`
  return Number(unidad[campo] || 0)
}

/** Obtener el precio del paquete según el tipo */
export function getPrecioPaquete(producto: ProductoPaquete, tipo?: TipoPrecioPaquete): number {
  const campo = `precio_${tipo || producto.tipo_precio_vista}` as keyof ProductoPaquete
  return Number(producto[campo] || 0)
}

/** Obtener el descuento del paquete según el tipo */
export function getDescuentoPaquete(producto: ProductoPaquete, tipo?: TipoPrecioPaquete): number {
  const campo = `descuento_${tipo || producto.tipo_precio_vista}` as keyof ProductoPaquete
  return Number(producto[campo] || 0)
}

interface TableProductosPaqueteProps {
  productos: ProductoPaquete[]
  onEliminar: (key: string) => void
  onCantidadChange: (key: string, cantidad: number) => void
  onPrecioChange: (key: string, tipo: TipoPrecioPaquete, precio: number | undefined) => void
  onUnidadDerivadaChange: (key: string, unidadDerivadaId: number) => void
}

export default function TableProductosPaquete({
  productos,
  onEliminar,
  onCantidadChange,
  onPrecioChange,
  onUnidadDerivadaChange,
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
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 80,
      cellRenderer: (params: any) => {
        const CantidadCell = () => {
          const [val, setVal] = useState(params.value ?? 1)
          useEffect(() => { setVal(params.value ?? 1) }, [params.value])
          const commit = () => {
            if (val !== params.value) onCantidadChange(params.data.key, Number(val ?? 1))
          }
          return (
            <div className="flex items-center h-full">
              <InputNumber
                size="small"
                className="w-full"
                value={val}
                min={0.001}
                precision={2}
                controls={false}
                onChange={(v) => setVal(Number(v ?? 1))}
                onBlur={commit}
                onPressEnter={commit}
              />
            </div>
          )
        }
        return <CantidadCell />
      },
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
      domLayout="autoHeight"
      overlayNoRowsTemplate='<span class="text-gray-500">No hay productos agregados</span>'
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['Código', 'Producto', 'Marca', 'U. Derivada', 'Cantidad', 'Acciones'],
        },
      ]}
    />
  )
}
