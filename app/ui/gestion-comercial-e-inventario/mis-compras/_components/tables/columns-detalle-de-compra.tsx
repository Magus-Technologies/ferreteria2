'use client'

import { ColDef } from 'ag-grid-community'
import { type Compra, type ProductoAlmacenCompra, type UnidadDerivadaInmutableCompra } from '~/lib/api/compra'

export type TableDetalleDeCompraProps = Pick<
  ProductoAlmacenCompra,
  'producto_almacen' | 'costo'
> &
  UnidadDerivadaInmutableCompra

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
        return value?.producto?.cod_producto ?? ''
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
        const productName = value?.producto?.name ?? ''
        return data?.bonificacion
          ? `🎁 ${productName} (Bonificación)`
          : productName
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
        return value?.producto?.marca?.name ?? ''
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
        return value?.name ?? ''
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
      headerName: '%',
      field: 'descuento',
      width: 60,
      minWidth: 60,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'center' },
      valueFormatter: ({
        data,
      }: {
        data: TableDetalleDeCompraProps | undefined
      }) => {
        const descuento = Number(data?.descuento ?? 0)
        return descuento > 0 ? `${descuento}%` : '-'
      },
    },
    {
      headerName: 'Perc',
      field: 'percepcion',
      width: 80,
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      type: 'pen4',
      cellStyle: { textAlign: 'right' },
      valueFormatter: ({
        data,
      }: {
        data: TableDetalleDeCompraProps | undefined
      }) => {
        const percepcion = Number(data?.percepcion ?? 0)
        return percepcion > 0 ? String(percepcion) : '-'
      },
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
    {
      headerName: 'TotalUnd',
      field: 'cantidad',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      cellStyle: { textAlign: 'center' },
      valueFormatter: ({
        data,
      }: {
        data: TableDetalleDeCompraProps | undefined
      }) => {
        const cantidad = Number(data?.cantidad ?? 0)
        const factor = Number(data?.factor ?? 1)
        const totalUnidades = cantidad * factor
        return String(totalUnidades)
      },
    },
    {
      headerName: 'IdProd',
      field: 'producto_almacen',
      width: 80,
      minWidth: 80,
      filter: true,
      cellStyle: { textAlign: 'center', fontSize: '11px' },
      valueFormatter: ({
        value,
      }: {
        value: TableDetalleDeCompraProps['producto_almacen']
      }) => {
        return value?.producto?.id ?? ''
      },
    },
  ]

  return columns
}
