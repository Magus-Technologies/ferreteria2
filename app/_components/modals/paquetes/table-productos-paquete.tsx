'use client'

import { ColDef } from 'ag-grid-community'
import { Button, InputNumber } from 'antd'
import { FaTrash, FaWeightHanging } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import SelectBase from '~/app/_components/form/selects/select-base'

export type TipoPrecioPaquete = 'publico' | 'especial' | 'minimo' | 'ultimo'

const TIPO_PRECIO_OPTIONS = [
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
  // Precios del paquete (editables, lo que se guarda)
  precio_publico?: number
  precio_especial?: number
  precio_minimo?: number
  precio_ultimo?: number
  // Tipo de precio activo para visualización
  tipo_precio_vista: TipoPrecioPaquete
  costo?: number
  unidades_derivadas_disponibles?: any[]
}

/** Obtener el precio original del producto según tipo y unidad derivada */
function getPrecioOriginal(producto: ProductoPaquete): number {
  const unidades = producto.unidades_derivadas_disponibles || []
  const unidad = unidades.find((u: any) => u.unidad_derivada.id === producto.unidad_derivada_id)
  if (!unidad) return 0
  const campo = `precio_${producto.tipo_precio_vista}`
  return Number(unidad[campo] || 0)
}

/** Obtener el precio del paquete según el tipo activo */
function getPrecioPaquete(producto: ProductoPaquete): number {
  const campo = `precio_${producto.tipo_precio_vista}` as keyof ProductoPaquete
  return Number(producto[campo] || 0)
}

interface TableProductosPaqueteProps {
  productos: ProductoPaquete[]
  onEliminar: (key: string) => void
  onCantidadChange: (key: string, cantidad: number) => void
  onPrecioChange: (key: string, tipo: TipoPrecioPaquete, precio: number | undefined) => void
  onUnidadDerivadaChange: (key: string, unidadDerivadaId: number) => void
  onTipoPrecioVistaChange: (key: string, tipo: TipoPrecioPaquete) => void
}

export default function TableProductosPaquete({
  productos,
  onEliminar,
  onCantidadChange,
  onPrecioChange,
  onUnidadDerivadaChange,
  onTipoPrecioVistaChange,
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

              // Auto-cargar los 4 precios de la nueva unidad derivada
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
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <InputNumber
            size="small"
            className="w-full"
            value={params.value ?? 1}
            min={0.001}
            precision={2}
            controls={false}
            onChange={(val) => onCantidadChange(params.data.key, Number(val ?? 1))}
          />
        </div>
      ),
    },
    {
      headerName: 'Tipo Precio',
      field: 'tipo_precio_vista',
      width: 130,
      cellRenderer: (params: any) => (
        <SelectBase
          size="small"
          variant="borderless"
          className="w-full"
          value={params.value || 'publico'}
          options={TIPO_PRECIO_OPTIONS}
          onChange={(nuevoTipo) => {
            onTipoPrecioVistaChange(params.data.key, nuevoTipo as TipoPrecioPaquete)
          }}
        />
      ),
    },
    {
      headerName: 'P. Original',
      width: 100,
      cellClass: 'text-right text-gray-500',
      valueGetter: (params) => {
        if (!params.data) return 0
        return getPrecioOriginal(params.data)
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: 'Descuento',
      width: 110,
      cellRenderer: (params: any) => {
        if (!params.data) return null
        const original = getPrecioOriginal(params.data)
        const paquete = getPrecioPaquete(params.data)
        const descuento = Math.max(original - paquete, 0)
        return (
          <div className="flex items-center h-full">
            <InputNumber
              size="small"
              className="w-full"
              prefix="S/."
              value={descuento}
              min={0}
              max={original}
              precision={2}
              controls={false}
              onChange={(val) => {
                const nuevoDescuento = Number(val ?? 0)
                const nuevoPrecio = Math.max(original - nuevoDescuento, 0)
                onPrecioChange(params.data.key, params.data.tipo_precio_vista, nuevoPrecio)
              }}
            />
          </div>
        )
      },
    },
    {
      headerName: 'P. Paquete',
      width: 110,
      cellRenderer: (params: any) => {
        if (!params.data) return null
        const precioPaquete = getPrecioPaquete(params.data)
        return (
          <div className="flex items-center h-full">
            <InputNumber
              size="small"
              className="w-full"
              prefix="S/."
              value={precioPaquete}
              min={0}
              precision={2}
              controls={false}
              onChange={(val) => {
                onPrecioChange(params.data.key, params.data.tipo_precio_vista, val ?? undefined)
              }}
            />
          </div>
        )
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
          columns: ['Código', 'Producto', 'Marca', 'U. Derivada', 'Cantidad', 'Tipo Precio', 'P. Original', 'Descuento', 'P. Paquete', 'Acciones'],
        },
      ]}
    />
  )
}
