'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tooltip } from 'antd'
import { FaImage } from 'react-icons/fa'
import { IoIosCopy } from 'react-icons/io'
import ColumnAction from '~/components/tables/column-action'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

interface ProductosProps {
  id: string
  codigo: string
  producto: string
  marca: string
  stock: string
  stock_min: string
}

export function useColumnsProductos() {
  const can = usePermission()

  const columns: ColDef<ProductosProps>[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Producto',
      field: 'producto',
      minWidth: 80,
      filter: true,
      cellRenderer: (params: ICellRendererParams<ProductosProps>) => {
        return (
          <div className='flex items-center justify-between gap-2'>
            {params.value}
            <FaImage size={15} className='text-cyan-600 cursor-pointer' />
          </div>
        )
      },
      flex: 2,
    },
    {
      headerName: 'Marca',
      field: 'marca',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Stock',
      field: 'stock',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'S. Min',
      field: 'stock_min',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Acciones',
      field: 'id',
      minWidth: 80,
      filter: true,
      cellRenderer: (params: ICellRendererParams<ProductosProps>) => {
        return (
          <ColumnAction id={params.value} permiso={permissions.PRODUCTO_BASE}>
            {can(permissions.PRODUCTO_DUPLICAR) && (
              <Tooltip title='Duplicar'>
                <IoIosCopy
                  size={15}
                  className='cursor-pointer text-cyan-600 hover:scale-105 transition-all active:scale-95'
                />
              </Tooltip>
            )}
          </ColumnAction>
        )
      },
      flex: 1,
      type: 'actions',
    },
  ]

  return columns
}
