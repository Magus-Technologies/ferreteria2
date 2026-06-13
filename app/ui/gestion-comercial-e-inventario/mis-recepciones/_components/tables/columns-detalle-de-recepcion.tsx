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
}: {
  historial: { stock_anterior: number; stock_nuevo: number }[] | undefined | null
}) {
  if (!historial || historial.length === 0) {
    return { stock_anterior: 0, stock_nuevo: 0 }
  }

  // El historial conserva siempre el movimiento ORIGINAL de la recepción
  // (índice 0). Al deshacer ya NO se crea un movimiento de reversión, por lo
  // que no se debe saltar al índice 1 cuando estado=false (antes lo hacía y
  // dejaba en blanco las columnas Stock Anterior/Nuevo de las deshechas).
  return {
    stock_anterior: Number(historial[0]?.stock_anterior ?? 0),
    stock_nuevo: Number(historial[0]?.stock_nuevo ?? 0),
  }
}

export function useColumnsDetalleDeRecepcion() {
  const columns: ColDef<TableDetalleDeRecepcionProps>[] = [
    {
      colId: 'cod_producto',
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
      colId: 'producto',
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
      colId: 'marca',
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
      colId: 'unidad_derivada',
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
      colId: 'cantidad',
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 50,
      minWidth: 50,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'cantidad_pedida',
      headerName: 'Cant. Pedida',
      field: 'cantidad_pedida',
      width: 60,
      minWidth: 60,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({
        value,
      }: {
        value: number | undefined
      }) => {
        return value !== undefined ? value.toString() : '-'
      },
    },
    {
      colId: 'cantidad_recepcionada',
      headerName: 'Cant. Total Recepcionada',
      field: 'cantidad_recepcionada',
      width: 80,
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({
        value,
      }: {
        value: number | undefined
      }) => {
        return value !== undefined ? value.toString() : '-'
      },
    },
    {
      colId: 'cantidad_finalizada',
      headerName: 'Cant. Finalizada',
      field: 'cantidad_finalizada',
      width: 70,
      minWidth: 70,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({
        value,
      }: {
        value: number | undefined
      }) => {
        return value !== undefined ? value.toString() : '-'
      },
    },
    {
      colId: 'stock_anterior',
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
      colId: 'stock_nuevo',
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
      colId: 'vencimiento',
      headerName: 'F. Vencimiento',
      field: 'vencimiento',
      width: 90,
      minWidth: 90,
      filter: 'agDateColumnFilter',
      type: 'date',
    },
    {
      colId: 'lote',
      headerName: 'Lote',
      field: 'lote',
      width: 80,
      minWidth: 80,
      filter: true,
    },
  ]

  return columns
}
