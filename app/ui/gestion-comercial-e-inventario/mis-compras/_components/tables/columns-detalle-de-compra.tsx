'use client'

import { ColDef } from 'ag-grid-community'
import { getComprasResponseProps } from '~/app/_actions/compra'

export type TableDetalleDeCompraProps = Pick<
  getComprasResponseProps['productos_por_almacen'][number],
  'producto_almacen' | 'costo'
> &
  getComprasResponseProps['productos_por_almacen'][number]['unidades_derivadas'][number]

export function useColumnsDetalleDeCompra() {
  const columns: ColDef<TableDetalleDeCompraProps>[] = [
    {
      headerName: 'Cod. Producto',
      field: 'producto_almacen',
      width: 70,
      minWidth: 70,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeCompraProps['producto_almacen']
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
        value: TableDetalleDeCompraProps['producto_almacen']
        data: TableDetalleDeCompraProps | undefined
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
        value: TableDetalleDeCompraProps['producto_almacen']
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
        value: TableDetalleDeCompraProps['unidad_derivada_inmutable']
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
      headerName: 'P. Compra',
      field: 'costo',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      type: 'pen4',
      valueFormatter: ({
        data,
      }: {
        data: TableDetalleDeCompraProps | undefined
      }) =>
        data?.bonificacion
          ? '0'
          : String(Number(data?.costo ?? 0) * Number(data?.factor ?? 1)),
    },
    {
      headerName: 'Importe',
      field: 'producto_almacen',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      type: 'pen4',
      valueFormatter: ({
        data,
      }: {
        data: TableDetalleDeCompraProps | undefined
      }) =>
        data?.bonificacion
          ? '0'
          : String(
              Number(data?.costo ?? 0) *
                Number(data?.factor ?? 1) *
                Number(data?.cantidad ?? 0)
            ),
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
