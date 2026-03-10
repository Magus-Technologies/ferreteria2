'use client'

import { ColDef } from 'ag-grid-community'
import { Button, InputNumber } from 'antd'
import { FaTrash, FaWeightHanging } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import SelectBase from '~/app/_components/form/selects/select-base'

export type TipoPrecioPaquete = 'publico' | 'especial' | 'minimo' | 'ultimo'

export interface ProductoPaquete {
  key: string
  producto_id: number
  producto_name: string
  producto_codigo: string
  marca_name?: string
  unidad_derivada_id: number
  unidad_derivada_name: string
  cantidad: number
  precio_sugerido?: number
  tipo_precio: TipoPrecioPaquete
  descuento: number
  costo?: number
  unidades_derivadas_disponibles?: any[]
}

const TIPO_PRECIO_OPTIONS = [
  { value: 'publico', label: 'P. Público' },
  { value: 'especial', label: 'P. Especial' },
  { value: 'minimo', label: 'P. Mínimo' },
  { value: 'ultimo', label: 'P. Último' },
]

interface TableProductosPaqueteProps {
  productos: ProductoPaquete[]
  onEliminar: (key: string) => void
  onCantidadChange: (key: string, cantidad: number) => void
  onPrecioChange: (key: string, precio: number | undefined) => void
  onUnidadDerivadaChange: (key: string, unidadDerivadaId: number) => void
  onTipoPrecioChange: (key: string, tipoPrecio: TipoPrecioPaquete) => void
  onDescuentoChange: (key: string, descuento: number) => void
}

export default function TableProductosPaquete({
  productos,
  onEliminar,
  onCantidadChange,
  onPrecioChange,
  onUnidadDerivadaChange,
  onTipoPrecioChange,
  onDescuentoChange,
}: TableProductosPaqueteProps) {
  const columnDefs: ColDef<ProductoPaquete>[] = [
    {
      headerName: 'Código',
      field: 'producto_codigo',
      width: 100,
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
      width: 120,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Unidad Derivada',
      field: 'unidad_derivada_id',
      width: 150,
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
              
              // Actualizar precio sugerido automáticamente
              const unidadSeleccionada = unidades.find((u: any) => u.unidad_derivada.id === nuevoId)
              if (unidadSeleccionada?.precio_publico) {
                onPrecioChange(params.data.key, Number(unidadSeleccionada.precio_publico))
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
      width: 100,
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
      field: 'tipo_precio',
      width: 140,
      cellRenderer: (params: any) => {
        return (
          <SelectBase
            size="small"
            variant="borderless"
            className="w-full"
            value={params.value || 'publico'}
            options={TIPO_PRECIO_OPTIONS}
            onChange={(nuevoTipo) => {
              onTipoPrecioChange(params.data.key, nuevoTipo as TipoPrecioPaquete)

              // Auto-actualizar precio según tipo seleccionado
              const unidades = params.data?.unidades_derivadas_disponibles || []
              const unidadActual = unidades.find(
                (u: any) => u.unidad_derivada.id === params.data.unidad_derivada_id
              )
              if (unidadActual) {
                const precioMap: Record<string, string> = {
                  publico: 'precio_publico',
                  especial: 'precio_especial',
                  minimo: 'precio_minimo',
                  ultimo: 'precio_ultimo',
                }
                const campo = precioMap[nuevoTipo as string]
                const nuevoPrecio = campo ? Number(unidadActual[campo]) || 0 : 0
                onPrecioChange(params.data.key, nuevoPrecio)
              }
            }}
          />
        )
      },
    },
    {
      headerName: 'Precio',
      field: 'precio_sugerido',
      width: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <InputNumber
            size="small"
            className="w-full"
            prefix="S/."
            value={params.value ?? 0}
            min={0}
            precision={2}
            controls={false}
            onChange={(val) => onPrecioChange(params.data.key, val ?? 0)}
          />
        </div>
      ),
    },
    {
      headerName: 'Descuento',
      field: 'descuento',
      width: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <InputNumber
            size="small"
            className="w-full"
            prefix="S/."
            value={params.value ?? 0}
            min={0}
            precision={2}
            controls={false}
            onChange={(val) => onDescuentoChange(params.data.key, Number(val ?? 0))}
          />
        </div>
      ),
    },
    {
      headerName: 'P. Final',
      width: 110,
      cellClass: 'text-right font-semibold text-green-700',
      valueGetter: (params) => {
        const precio = Number(params.data?.precio_sugerido || 0)
        const descuento = Number(params.data?.descuento || 0)
        return Math.max(precio - descuento, 0)
      },
      valueFormatter: (params) => {
        return `S/. ${Number(params.value || 0).toFixed(2)}`
      },
    },
    {
      headerName: 'Acciones',
      width: 100,
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
      pagination={false}
      domLayout="autoHeight"
      overlayNoRowsTemplate='<span class="text-gray-500">No hay productos agregados</span>'
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['Código', 'Producto', 'Marca', 'Unidad Derivada', 'Cantidad', 'Tipo Precio', 'Precio', 'Descuento', 'P. Final', 'Acciones'],
        },
      ]}
    />
  )
}
