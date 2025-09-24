'use client'

import { ColDef } from 'ag-grid-community'
import { Prisma, TipoDocumento } from '@prisma/client'

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
        unidades_derivadas: true
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
      valueFormatter: ({ value }) => {
        return value == TipoDocumento.NotaDeVenta ? 'Nota de Venta' : value
      },
      filter: true,
    },
    {
      headerName: 'Serie',
      field: 'serie',
      width: 100,
      minWidth: 100,
      filter: true,
    },
    {
      headerName: 'Número',
      field: 'numero',
      width: 100,
      minWidth: 100,
      filter: true,
    },
    {
      headerName: 'Fecha',
      field: 'created_at',
      width: 100,
      minWidth: 100,
      filter: true,
    },
    {
      headerName: 'RUC',
      field: 'proveedor.ruc',
      width: 80,
      minWidth: 80,
      filter: true,
    },
    {
      headerName: 'Proveedor',
      field: 'proveedor.razon_social',
      width: 100,
      minWidth: 100,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Subtotal',
      field: 'productos_por_almacen',
      width: 80,
      filter: true,
      type: 'pen4',
    },
    {
      headerName: 'IGV',
      field: 'productos_por_almacen',
      width: 50,
      filter: true,
    },
    {
      headerName: 'Total',
      field: 'productos_por_almacen',
      width: 120,
      filter: true,
    },
    {
      headerName: 'Forma de Pago',
      field: 'forma_de_pago',
      width: 140,
      filter: true,
    },
    {
      headerName: 'Total Pagado',
      field: 'productos_por_almacen',
      width: 140,
      filter: true,
    },
    {
      headerName: 'Resta',
      field: 'productos_por_almacen',
      width: 100,
      filter: true,
    },
    {
      headerName: 'Estado de Cuenta',
      field: 'productos_por_almacen',
      width: 80,
      filter: true,
    },
    {
      headerName: 'Registrador',
      field: 'user.name',
      width: 50,
      filter: true,
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      type: 'actions',
    },
  ]

  return columns
}
