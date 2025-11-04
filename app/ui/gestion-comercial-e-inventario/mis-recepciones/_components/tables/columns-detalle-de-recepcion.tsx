'use client'

import { ColDef } from 'ag-grid-community'
import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'
import { getStock } from '~/app/_utils/get-stock'
import { getHistorial } from '../../../mi-almacen/_components/tables/columns-doc-ingreso-salida'
import { RecepcionAlmacen } from '@prisma/client'

export type TableDetalleDeRecepcionProps = Pick<
  getRecepcionesAlmacenResponseProps['productos_por_almacen'][number],
  'producto_almacen' | 'costo'
> &
  getRecepcionesAlmacenResponseProps['productos_por_almacen'][number]['unidades_derivadas'][number]

export function useColumnsDetalleDeRecepcion({
  estado,
}: {
  estado: RecepcionAlmacen['estado']
}) {
  const columns: ColDef<TableDetalleDeRecepcionProps>[] = [
    {
      headerName: 'Cod. Producto',
      field: 'producto_almacen',
      width: 70,
      minWidth: 70,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeRecepcionProps['producto_almacen']
      }) => {
        return value.producto.cod_producto
      },
    },
    {
      headerName: 'Producto',
      field: 'producto_almacen',
      width: 200,
      minWidth: 200,
      filter: true,
      valueFormatter: ({
        value,
        data,
      }: {
        value: TableDetalleDeRecepcionProps['producto_almacen']
        data: TableDetalleDeRecepcionProps | undefined
      }) => {
        return data?.bonificacion
          ? `🎁 ${value.producto.name} (Bonificación)`
          : value.producto.name
      },
      flex: 1,
    },
    {
      headerName: 'Marca',
      field: 'producto_almacen',
      width: 130,
      minWidth: 130,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeRecepcionProps['producto_almacen']
      }) => {
        return value.producto.marca.name
      },
    },
    {
      headerName: 'Unidad Derivada',
      field: 'unidad_derivada_inmutable',
      width: 80,
      minWidth: 80,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeRecepcionProps['unidad_derivada_inmutable']
      }) => {
        return value.name
      },
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 50,
      minWidth: 50,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Stock Anterior',
      field: 'historial',
      width: 60,
      minWidth: 60,
      valueFormatter: ({
        data,
        value,
      }: {
        data: TableDetalleDeRecepcionProps | undefined
        value: TableDetalleDeRecepcionProps['historial']
      }) => {
        const historial = getHistorial({
          historial: value,
          estado,
        })

        const unidades_contenidas = Number(
          data?.producto_almacen.producto.unidades_contenidas
        )
        return getStock({
          stock_fraccion: Number(historial.stock_anterior),
          unidades_contenidas,
        }).stock
      },
      filter: true,
    },
    {
      headerName: 'Stock Nuevo',
      field: 'historial',
      width: 60,
      minWidth: 60,
      valueFormatter: ({
        data,
        value,
      }: {
        data: TableDetalleDeRecepcionProps | undefined
        value: TableDetalleDeRecepcionProps['historial']
      }) => {
        const historial = getHistorial({
          historial: value,
          estado,
        })

        const unidades_contenidas = Number(
          data?.producto_almacen.producto.unidades_contenidas
        )
        return getStock({
          stock_fraccion: Number(historial.stock_nuevo),
          unidades_contenidas,
        }).stock
      },
      filter: true,
    },
    {
      headerName: 'F. Vencimiento',
      field: 'vencimiento',
      width: 90,
      minWidth: 90,
      filter: 'agDateColumnFilter',
      type: 'date',
    },
    {
      headerName: 'Lote',
      field: 'lote',
      width: 80,
      minWidth: 80,
      filter: true,
    },
  ]

  return columns
}
