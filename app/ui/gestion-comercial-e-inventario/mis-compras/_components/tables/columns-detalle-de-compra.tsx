'use client'

import { ColDef } from 'ag-grid-community'
import { type ProductoAlmacenCompra, type UnidadDerivadaInmutableCompra } from '~/lib/api/compra'

export type TableDetalleDeCompraProps = Pick<
  ProductoAlmacenCompra,
  'producto_almacen' | 'costo'
> &
  UnidadDerivadaInmutableCompra & {
    descuento?: number
    percepcion?: number
  }

export function useColumnsDetalleDeCompra() {
  const columns: ColDef<TableDetalleDeCompraProps>[] = [
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
        value: TableDetalleDeCompraProps['producto_almacen']
      }) => {
        return value?.producto?.cod_producto ?? ''
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
      colId: 'marca',
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
      colId: 'unidad_derivada',
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
      colId: 'cantidad',
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 50,
      minWidth: 50,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'costo',
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
      colId: 'descuento',
      headerName: '%',
      field: 'descuento' as any,
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
      colId: 'percepcion',
      headerName: 'Perc',
      field: 'percepcion' as any,
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
      colId: 'importe',
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
    {
      colId: 'total_und',
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
      colId: 'id_prod',
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
        return String(value?.producto?.id ?? '')
      },
    },
  ]

  return columns
}
