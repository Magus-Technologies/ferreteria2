'use client'

import { ColDef } from 'ag-grid-community'
import { TableComprasProps } from './columns-compras'

export type TableDetalleDeCompraProps = Pick<
  TableComprasProps['productos_por_almacen'][number],
  'producto_almacen'
> &
  TableComprasProps['productos_por_almacen'][number]['unidades_derivadas'][number]

export function useColumnsDetalleDeCompra() {
  const columns: ColDef<TableDetalleDeCompraProps>[] = [
    {
      headerName: 'Cod. Producto',
      field: 'producto_almacen',
      width: 130,
      minWidth: 130,
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
      width: 130,
      minWidth: 130,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeCompraProps['producto_almacen']
      }) => {
        return value.producto.name
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
      headerName: 'Unidad de Medida',
      field: 'producto_almacen',
      width: 130,
      minWidth: 130,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeCompraProps['producto_almacen']
      }) => {
        return value.producto.unidad_medida.name
      },
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 80,
      minWidth: 80,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'P. Compra',
      field: 'producto_almacen.costo',
      width: 80,
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      type: 'pen4',
    },
    {
      headerName: 'Importe',
      field: 'producto_almacen',
      width: 80,
      minWidth: 80,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'F. Vencimiento',
      field: 'vencimiento',
      width: 80,
      minWidth: 80,
      filter: 'agDateColumnFilter',
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
