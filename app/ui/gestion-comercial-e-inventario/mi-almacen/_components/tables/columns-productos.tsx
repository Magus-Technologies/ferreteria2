'use client'

import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community'
import { Popover, Tooltip } from 'antd'
import { FaImage } from 'react-icons/fa'
import { IoIosCopy } from 'react-icons/io'
import { PiWarehouseFill } from 'react-icons/pi'
import ColumnAction from '~/components/tables/column-action'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ProductoOtrosAlmacenes from '../others/producto-otros-almacenes'
import {
  Almacen,
  Categoria,
  Marca,
  Producto,
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
  UnidadMedida,
} from '@prisma/client'
import { getStock, GetStock } from '~/app/_utils/get-stock'

type TableProductosProps = Producto & {
  marca: Marca
  categoria: Categoria
  unidad_medida: UnidadMedida
  producto_en_almacenes: (ProductoAlmacen & {
    unidades_derivadas: (ProductoAlmacenUnidadDerivada & {
      unidad_derivada: UnidadDerivada
    })[]
    almacen: Almacen
  })[]
}

interface UseColumnsProductosProps {
  almacen_id?: number
}

export function useColumnsProductos({ almacen_id }: UseColumnsProductosProps) {
  const can = usePermission()

  const columns: ColDef<TableProductosProps>[] = [
    {
      headerName: 'Código',
      field: 'cod_producto',
      minWidth: 180,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Producto',
      field: 'name',
      minWidth: 250,
      filter: true,
      cellRenderer: ({
        value,
        data,
      }: ICellRendererParams<TableProductosProps>) => {
        return (
          <div className='flex items-center justify-between gap-2'>
            {value}
            <Popover
              content={
                data?.img ? (
                  <img
                    src={data.img}
                    alt='Logo'
                    className='max-w-72 wax-h-72'
                  />
                ) : (
                  'No hay Imagen'
                )
              }
            >
              <FaImage
                size={15}
                className={`cursor-pointer ${
                  data?.img ? 'text-cyan-600' : 'text-gray-400'
                }`}
              />
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
      field: 'marca.name',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Stock',
      field: 'producto_en_almacenes',
      minWidth: 80,
      filter: true,
      valueFormatter: ({
        value,
        data,
      }: ValueFormatterParams<
        TableProductosProps,
        TableProductosProps['producto_en_almacenes']
      >) => {
        const producto_en_almacen = value?.find(
          item => item.almacen_id === almacen_id
        )
        return getStock({
          stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
          unidades_contenidas: data!.unidades_contenidas,
        }).stock
      },
      cellRenderer: ({
        value,
        data,
      }: ICellRendererParams<
        TableProductosProps,
        TableProductosProps['producto_en_almacenes']
      >) => {
        const producto_en_almacen = value?.find(
          item => item.almacen_id === almacen_id
        )
        return (
          <div className='flex items-center justify-between gap-2'>
            <div>
              <GetStock
                stock_fraccion={Number(
                  producto_en_almacen?.stock_fraccion ?? 0
                )}
                unidades_contenidas={Number(data!.unidades_contenidas)}
              />
            </div>
            <Popover
              placement='right'
              trigger='click'
              content={
                <div className='flex flex-col items-center justify-center gap-6 px-4 py-2'>
                  {value?.map((item, index) => (
                    <ProductoOtrosAlmacenes
                      key={index}
                      stock_fraccion={Number(item.stock_fraccion)}
                      unidades_contenidas={Number(data!.unidades_contenidas)}
                      producto_almacen_unidad_derivada={
                        item.unidades_derivadas.find(
                          item =>
                            Number(item.factor) === data!.unidades_contenidas
                        ) ?? item.unidades_derivadas[0]
                      }
                      almacen={item.almacen.name}
                    />
                  ))}
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
      field: 'estado',
      minWidth: 80,
      flex: 1,
      type: 'boolean',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<TableProductosProps>) => {
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
