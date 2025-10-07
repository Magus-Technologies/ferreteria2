'use client'

import { ColDef } from 'ag-grid-community'
import { Prisma, TipoDocumento } from '@prisma/client'
import { IGV } from '~/lib/constantes'

export type TableComprasProps = Prisma.CompraGetPayload<{
  include: {
    proveedor: true
    productos_por_almacen: {
      include: {
        producto_almacen: {
          include: {
            producto: {
              include: {
                marca: true
                unidad_medida: true
              }
            }
          }
        }
        unidades_derivadas: {
          include: {
            unidad_derivada_inmutable: true
          }
        }
      }
    }
    user: true
  }
}>

export function useColumnsCompras() {
  const columns: ColDef<TableComprasProps>[] = [
    {
      headerName: 'Documento',
      field: 'tipo_documento',
      width: 80,
      minWidth: 80,
      valueFormatter: ({ value }) => {
        return value == TipoDocumento.NotaDeVenta ? 'Nota de Venta' : value
      },
      filter: true,
    },
    {
      headerName: 'Serie',
      field: 'serie',
      width: 60,
      minWidth: 60,
      filter: true,
    },
    {
      headerName: 'Número',
      field: 'numero',
      width: 60,
      minWidth: 60,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Fecha',
      field: 'created_at',
      width: 90,
      minWidth: 90,
      type: 'date',
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'RUC',
      field: 'proveedor.ruc',
      width: 100,
      minWidth: 100,
      filter: true,
    },
    {
      headerName: 'Proveedor',
      field: 'proveedor.razon_social',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Subtotal',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({
        value,
      }: {
        value: TableComprasProps['productos_por_almacen']
      }) =>
        String(
          Number(getSubTotal(value)) - Number(getSubTotal(value)) / (IGV + 1)
        ),
      type: 'pen',
    },
    {
      headerName: 'IGV',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: ({
        value,
      }: {
        value: TableComprasProps['productos_por_almacen']
      }) => String(Number(getSubTotal(value)) / (IGV + 1)),
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Total',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: ({
        value,
      }: {
        value: TableComprasProps['productos_por_almacen']
      }) => getSubTotal(value),
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Forma de Pago',
      field: 'forma_de_pago',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Total Pagado',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: () => '0',
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Resta',
      field: 'productos_por_almacen',
      width: 90,
      minWidth: 90,
      valueFormatter: () => '0',
      filter: 'agNumberColumnFilter',
      type: 'pen',
    },
    {
      headerName: 'Estado de Cuenta',
      field: 'productos_por_almacen',
      width: 80,
      minWidth: 80,
      valueFormatter: () => 'Pagado',
      filter: true,
    },
    {
      headerName: 'Registrador',
      field: 'user.name',
      width: 80,
      minWidth: 80,
      filter: true,
    },
  ]

  return columns
}

function getSubTotal(value: TableComprasProps['productos_por_almacen']) {
  return String(
    value.reduce(
      (acc, item) =>
        acc +
        item.unidades_derivadas.reduce(
          (acc2, item2) =>
            acc2 +
            Number(item2.cantidad) *
              Number(item2.factor) *
              Number(item.costo) *
              (item2.bonificacion ? 0 : 1),
          0
        ),
      0
    )
  )
}
