'use client'

import { ColDef } from 'ag-grid-community'
import { getStock } from '~/app/_utils/get-stock'
import type { RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'

export type TableDetalleDeRecepcionProps = Pick<
  RecepcionAlmacenResponse['productos_por_almacen'][number],
  'producto_almacen' | 'costo'
> &
  RecepcionAlmacenResponse['productos_por_almacen'][number]['unidades_derivadas'][number]

function getHistorialFromResponse({
  historial,
  estado,
}: {
  historial: { stock_anterior: number; stock_nuevo: number }[] | undefined | null
  estado: boolean
}) {
  if (!historial || historial.length === 0) {
    return { stock_anterior: 0, stock_nuevo: 0 }
  }

  const stock_anterior = Number(historial[0]?.stock_anterior ?? 0)
  const stock_nuevo = Number(historial[0]?.stock_nuevo ?? 0)
  let index = 0
  if (
    (estado && stock_anterior > stock_nuevo) ||
    (!estado && stock_anterior < stock_nuevo)
  )
    index = 1

  return {
    stock_anterior: Number(historial[index]?.stock_anterior ?? 0),
    stock_nuevo: Number(historial[index]?.stock_nuevo ?? 0),
  }
}

export function useColumnsDetalleDeRecepcion({
  estado,
}: {
  estado: boolean
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
        const historial = getHistorialFromResponse({
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
        const historial = getHistorialFromResponse({
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
