'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Popover, Tooltip } from 'antd'
import Image from 'next/image'
import { FaImage } from 'react-icons/fa'
import { IoIosCopy } from 'react-icons/io'
import { PiWarehouseFill } from 'react-icons/pi'
import ColumnAction from '~/components/tables/column-action'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ProductoOtrosAlmacenes from '../others/producto-otros-almacenes'

interface ProductosProps {
  id: string
  codigo: string
  producto: string
  marca: string
  stock: string
  stock_min: string
  unidades_contenidas: string
  activo: boolean
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
            <Popover
              content={
                <Image
                  src='/logo-horizontal.png'
                  alt='Logo'
                  width={350}
                  height={300}
                />
              }
            >
              <FaImage size={15} className='text-cyan-600 cursor-pointer' />
            </Popover>
          </div>
        )
      },
      flex: 2,
    },
    {
      headerName: 'U. Contenidas',
      field: 'unidades_contenidas',
      minWidth: 80,
      filter: true,
      flex: 1,
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
      cellRenderer: (params: ICellRendererParams<ProductosProps>) => {
        return (
          <div className='flex items-center justify-between gap-2'>
            {params.value}
            <Popover
              placement='right'
              trigger='click'
              content={
                <div className='flex flex-col items-center justify-center gap-6 px-4 py-2'>
                  <ProductoOtrosAlmacenes />
                  <ProductoOtrosAlmacenes />
                </div>
              }
            >
              <PiWarehouseFill
                size={15}
                className='text-cyan-600 cursor-pointer'
              />
            </Popover>
          </div>
        )
      },
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
      headerName: 'Activo',
      field: 'activo',
      minWidth: 80,
      flex: 1,
      type: 'boolean',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<ProductosProps>) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.PRODUCTO_BASE}
            childrenMiddle={
              can(permissions.PRODUCTO_DUPLICAR) && (
                <Tooltip title='Duplicar'>
                  <IoIosCopy
                    size={15}
                    className='cursor-pointer text-cyan-600 hover:scale-105 transition-all active:scale-95'
                  />
                </Tooltip>
              )
            }
          />
        )
      },
      flex: 1,
      type: 'actions',
    },
  ]

  return columns
}
