'use client'

import { ColDef } from 'ag-grid-community'
import { Prisma } from '@prisma/client'

export type UnidadDerivadaConProducto =
  Prisma.UnidadDerivadaInmutableIngresoSalidaGetPayload<{
    include: {
      producto_almacen_ingreso_salida: {
        include: {
          producto_almacen: {
            include: {
              producto: true
            }
          }
        }
      }
      unidad_derivada_inmutable: true
    }
  }>

export function useColumnsDocIngresoSalida() {
  const columns: ColDef<UnidadDerivadaConProducto>[] = [
    {
      headerName: 'Producto',
      field: 'producto_almacen_ingreso_salida',
      valueFormatter: ({
        value,
      }: {
        value: UnidadDerivadaConProducto['producto_almacen_ingreso_salida']
      }) => {
        return `${value.producto_almacen.producto.name}`
      },
      minWidth: 130,
      filter: true,
      flex: 6,
    },
    {
      headerName: 'Unidad Derivada',
      field: 'unidad_derivada_inmutable',
      minWidth: 80,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: UnidadDerivadaConProducto['unidad_derivada_inmutable']
      }) => {
        return `${value.name}`
      },
      flex: 2,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
    },
  ]

  return columns
}
