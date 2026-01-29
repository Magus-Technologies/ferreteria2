'use client'

import { useMemo } from 'react'
import TableBase from '~/components/tables/table-base'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tooltip } from 'antd'

type DetalleGuiaRow = {
  id: number
  producto_codigo: string
  producto_nombre: string
  marca_nombre: string
  unidad_derivada: string
  cantidad: number
  costo: number
  precio_venta: number
}

function useColumnsDetalleGuia() {
  const columns: ColDef<DetalleGuiaRow>[] = [
    {
      headerName: 'Código',
      field: 'producto_codigo',
      minWidth: 100,
      width: 100,
    },
    {
      headerName: 'Producto',
      field: 'producto_nombre',
      minWidth: 250,
      flex: 1,
      cellRenderer: ({ value }: ICellRendererParams<DetalleGuiaRow>) => (
        <div className='flex items-center h-full'>
          <Tooltip title={value}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {value}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Marca',
      field: 'marca_nombre',
      minWidth: 120,
      width: 120,
    },
    {
      headerName: 'U. Medida',
      field: 'unidad_derivada',
      minWidth: 100,
      width: 100,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      minWidth: 100,
      width: 100,
      cellRenderer: ({ value }: ICellRendererParams<DetalleGuiaRow>) => (
        <div className='flex items-center h-full justify-end font-semibold'>
          {Number(value).toFixed(2)}
        </div>
      ),
    },
    {
      headerName: 'Costo',
      field: 'costo',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<DetalleGuiaRow>) => (
        <div className='flex items-center h-full justify-end'>
          S/. {Number(value).toFixed(4)}
        </div>
      ),
    },
    {
      headerName: 'P. Venta',
      field: 'precio_venta',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<DetalleGuiaRow>) => (
        <div className='flex items-center h-full justify-end'>
          S/. {Number(value).toFixed(4)}
        </div>
      ),
    },
  ]

  return columns
}

export default function TableDetalleGuia() {
  // TODO: Obtener datos del detalle de la guía seleccionada
  const data = useMemo(() => [], [])

  return (
    <div className='mt-4'>
      <h3 className='text-lg font-semibold mb-2 text-gray-700'>
        Detalle de Productos
      </h3>
      <TableBase
        className='h-[250px]'
        rowSelection={false}
        rowData={data}
        columnDefs={useColumnsDetalleGuia()}
      />
    </div>
  )
}
