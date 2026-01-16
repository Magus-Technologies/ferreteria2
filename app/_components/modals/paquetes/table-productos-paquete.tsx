'use client'

import { ColDef } from 'ag-grid-community'
import { Button } from 'antd'
import { FaTrash, FaWeightHanging } from 'react-icons/fa'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import SelectBase from '~/app/_components/form/selects/select-base'

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
  // Unidades derivadas disponibles para este producto (tipo simplificado)
  unidades_derivadas_disponibles?: any[]
}

interface TableProductosPaqueteProps {
  productos: ProductoPaquete[]
  onEliminar: (key: string) => void
  onCantidadChange: (key: string, cantidad: number) => void
  onPrecioChange: (key: string, precio: number | undefined) => void
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
      editable: true,
      cellClass: 'text-center',
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0.001,
        precision: 3,
      },
      valueFormatter: (params) => {
        return params.value ? Number(params.value).toFixed(2) : '0.00'
      },
      onCellValueChanged: (params) => {
        if (params.newValue !== params.oldValue) {
          onCantidadChange(params.data.key, params.newValue)
        }
      },
    },
    {
      headerName: 'Precio',
      field: 'precio_sugerido',
      width: 120,
      editable: true,
      cellClass: 'text-right',
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        precision: 2,
      },
      valueFormatter: (params) => {
        if (params.value == null) return '-'
        return `S/. ${Number(params.value).toFixed(4)}`
      },
      onCellValueChanged: (params) => {
        if (params.newValue !== params.oldValue) {
          onPrecioChange(params.data.key, params.newValue)
        }
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
          columns: ['Código', 'Producto', 'Marca', 'Unidad Derivada', 'Cantidad', 'Precio', 'Acciones'],
        },
      ]}
    />
  )
}
