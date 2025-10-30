'use client'

import { ColDef } from 'ag-grid-community'
import { IngresoSalida, Prisma } from '@prisma/client'
import { getStock } from '~/app/_utils/get-stock'

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
      historial: true
    }
  }>

export function useColumnsDocIngresoSalida({
  estado,
}: {
  estado: IngresoSalida['estado']
}) {
  const columns: ColDef<UnidadDerivadaConProducto>[] = [
    {
      headerName: 'Código',
      field: 'producto_almacen_ingreso_salida',
      valueFormatter: ({
        value,
      }: {
        value: UnidadDerivadaConProducto['producto_almacen_ingreso_salida']
      }) => {
        return `${value.producto_almacen.producto.cod_producto}`
      },
      width: 50,
      minWidth: 50,
      filter: true,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 60,
      minWidth: 60,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Unidad Derivada',
      field: 'unidad_derivada_inmutable',
      width: 60,
      minWidth: 60,
      filter: true,
      valueFormatter: ({
        value,
      }: {
        value: UnidadDerivadaConProducto['unidad_derivada_inmutable']
      }) => {
        return `${value.name}`
      },
    },
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
      width: 80,
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Stock Anterior',
      field: 'historial',
      width: 55,
      minWidth: 55,
      filter: true,
      valueFormatter: ({
        data,
        value,
      }: {
        data: UnidadDerivadaConProducto | undefined
        value: UnidadDerivadaConProducto['historial']
      }) => {
        const historial = getHistorial({
          historial: value,
          estado,
        })

        const unidades_contenidas = Number(
          data?.producto_almacen_ingreso_salida.producto_almacen.producto
            .unidades_contenidas
        )
        return getStock({
          stock_fraccion: Number(historial.stock_anterior),
          unidades_contenidas,
        }).stock
      },
    },
    {
      headerName: 'Stock Nuevo',
      field: 'historial',
      width: 55,
      minWidth: 55,
      filter: true,
      valueFormatter: ({
        data,
        value,
      }: {
        data: UnidadDerivadaConProducto | undefined
        value: UnidadDerivadaConProducto['historial']
      }) => {
        const historial = getHistorial({
          historial: value,
          estado,
        })

        const unidades_contenidas = Number(
          data?.producto_almacen_ingreso_salida.producto_almacen.producto
            .unidades_contenidas
        )
        return getStock({
          stock_fraccion: Number(historial.stock_nuevo),
          unidades_contenidas,
        }).stock
      },
    },
    {
      headerName: 'Costo',
      field: 'producto_almacen_ingreso_salida',
      width: 50,
      minWidth: 50,
      filter: true,
      valueFormatter: ({
        data,
        value,
      }: {
        data: UnidadDerivadaConProducto | undefined
        value: UnidadDerivadaConProducto['producto_almacen_ingreso_salida']
      }) => {
        const factor = Number(data?.factor)
        return `${Number(value.costo) * factor}`
      },
    },
  ]

  return columns
}

export function getHistorial({
  historial,
  estado,
}: {
  historial: {
    stock_anterior: Prisma.Decimal
    stock_nuevo: Prisma.Decimal
  }[]
  estado: boolean
}) {
  console.log('🚀 ~ file: columns-doc-ingreso-salida.tsx:167 ~ estado:', estado)
  const stock_anterior = Number(historial[0].stock_anterior)
  const stock_nuevo = Number(historial[0].stock_nuevo)
  let index = 0
  if (
    (estado && stock_anterior > stock_nuevo) ||
    (!estado && stock_anterior < stock_nuevo)
  )
    index = 1

  return historial[index]
}
