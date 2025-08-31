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
  Ubicacion,
  UnidadDerivada,
  UnidadMedida,
} from '@prisma/client'
import { getStock, GetStock } from '~/app/_utils/get-stock'
// import { eliminarProducto } from '~/app/_actions/producto'
import { useStoreEditOrCopyProducto } from '../../store/store-edit-or-copy-producto'

export type TableProductosProps = Producto & {
  marca: Marca
  categoria: Categoria
  unidad_medida: UnidadMedida
  producto_en_almacenes: (ProductoAlmacen & {
    unidades_derivadas: (ProductoAlmacenUnidadDerivada & {
      unidad_derivada: UnidadDerivada
    })[]
    almacen: Almacen
    ubicacion: Ubicacion
  })[]
}

interface UseColumnsProductosProps {
  almacen_id?: number
}

export function useColumnsProductos({ almacen_id }: UseColumnsProductosProps) {
  const can = usePermission()
  const setOpen = useStoreEditOrCopyProducto(state => state.setOpenModal)
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)

  const columns: ColDef<TableProductosProps>[] = [
    {
      headerName: 'Código de Producto',
      field: 'cod_producto',
      width: 80,
      filter: true,
    },
    {
      headerName: 'Producto',
      field: 'name',
      width: 350,
      minWidth: 350,
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
      flex: 1,
    },
    {
      headerName: 'Ticket',
      field: 'name_ticket',
      width: 350,
      minWidth: 350,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Ubicación en Almacén',
      field: 'producto_en_almacenes',
      width: 80,
      filter: true,
      valueFormatter: ({
        value,
      }: ValueFormatterParams<
        TableProductosProps,
        TableProductosProps['producto_en_almacenes']
      >) => {
        const producto_en_almacen = value?.find(
          item => item.almacen_id === almacen_id
        )
        return producto_en_almacen?.ubicacion.name ?? ''
      },
    },
    {
      headerName: 'Stock Fracción en Almacén',
      field: 'producto_en_almacenes',
      width: 70,
      filter: true,
      valueFormatter: ({
        value,
      }: ValueFormatterParams<
        TableProductosProps,
        TableProductosProps['producto_en_almacenes']
      >) => {
        const producto_en_almacen = value?.find(
          item => item.almacen_id === almacen_id
        )
        return `${Number(producto_en_almacen?.stock_fraccion ?? 0)}`
      },
    },
    {
      headerName: 'Costo en Almacén',
      field: 'producto_en_almacenes',
      width: 80,
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
        return `${
          Number(producto_en_almacen?.costo ?? 0) *
          Number(data!.unidades_contenidas)
        }`
      },
      type: 'pen',
    },
    {
      headerName: 'U. Contenidas',
      field: 'unidades_contenidas',
      width: 50,
      filter: true,
    },
    {
      headerName: 'Código de Barra',
      field: 'cod_barra',
      width: 120,
      filter: true,
    },
    {
      headerName: 'Marca',
      field: 'marca.name',
      width: 140,
      filter: true,
    },
    {
      headerName: 'Categoria',
      field: 'categoria.name',
      width: 140,
      filter: true,
    },
    {
      headerName: 'Unidad de Medida',
      field: 'unidad_medida.name',
      width: 100,
      filter: true,
    },
    {
      headerName: 'Stock',
      field: 'producto_en_almacenes',
      width: 80,
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
          unidades_contenidas: Number(data!.unidades_contenidas),
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
                            Number(item.factor) ===
                            Number(data!.unidades_contenidas)
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
    },
    {
      headerName: 'S. Min',
      field: 'stock_min',
      width: 50,
      filter: true,
    },
    {
      headerName: 'S. Max',
      field: 'stock_max',
      width: 50,
      filter: true,
    },
    {
      headerName: 'Activo',
      field: 'estado',
      width: 90,
      type: 'boolean',
    },
    {
      headerName: 'Acción Técnica',
      field: 'accion_tecnica',
      width: 250,
      filter: true,
    },
    {
      headerName: 'Ruta IMG',
      field: 'img',
      width: 250,
      filter: true,
      type: 'link',
    },
    {
      headerName: 'Ruta Ficha Técnica',
      field: 'ficha_tecnica',
      width: 250,
      filter: true,
      type: 'link',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<TableProductosProps>) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.PRODUCTO_BASE}
            // actionDelete={eliminarProducto}
            onEdit={() => {
              setProducto(params.data)
              setOpen(true)
            }}
            childrenMiddle={
              can(permissions.PRODUCTO_DUPLICAR) && (
                <Tooltip title='Duplicar'>
                  <IoIosCopy
                    onClick={() => {
                      setProducto({ ...params.data!, id: undefined })
                      setOpen(true)
                    }}
                    size={15}
                    className='cursor-pointer text-cyan-600 hover:scale-105 transition-all active:scale-95'
                  />
                </Tooltip>
              )
            }
          />
        )
      },
      type: 'actions',
    },
  ]

  return columns
}
