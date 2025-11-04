'use client'

import {
  Almacen,
  Prisma,
  Producto,
  ProductoAlmacenUnidadDerivada,
  Ubicacion,
  UnidadDerivada,
} from '@prisma/client'
import { ColDef } from 'ag-grid-community'

export type DetalleDePreciosProps = ProductoAlmacenUnidadDerivada & {
  almacen: Almacen
  producto: Producto
  unidad_derivada: UnidadDerivada
  producto_almacen: {
    costo: Prisma.Decimal
    stock_fraccion: Prisma.Decimal
    ubicacion: Ubicacion
  }
}

export function useColumnsDetalleDePrecios() {
  const columns: ColDef<DetalleDePreciosProps>[] = [
    {
      headerName: 'Cod. Producto',
      field: 'producto.cod_producto',
      minWidth: 130,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Producto',
      field: 'producto.name',
      minWidth: 250,
      filter: true,
      flex: 3,
    },
    {
      headerName: 'Formato',
      field: 'unidad_derivada.name',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Factor',
      field: 'factor',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'P. Compra',
      field: 'producto_almacen.costo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value, data }) => {
        return `${value * Number(data!.factor)}`
      },
      flex: 1,
      type: 'pen4',
    },
    {
      headerName: '% Venta',
      field: 'producto_almacen.costo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value, data }) => {
        const costoTotal = value * Number(data!.factor)
        const precioPublico = data!.precio_publico
        const ganancia = Number(precioPublico) - costoTotal
        const p_venta = costoTotal != 0 ? (ganancia * 100) / costoTotal : 0
        return `${p_venta.toFixed(2)}`
      },
      flex: 1,
      type: 'percent',
    },
    {
      headerName: 'P. Público',
      field: 'precio_publico',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Ganancia',
      field: 'producto_almacen.costo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value, data }) => {
        const costoTotal = value * Number(data!.factor)
        const precioPublico = data!.precio_publico
        const ganancia = Number(precioPublico) - costoTotal
        return `${ganancia.toFixed(2)}`
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'P. Especial',
      field: 'precio_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'P. Mínimo',
      field: 'precio_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'P. Último',
      field: 'precio_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Público',
      field: 'comision_publico',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Especial',
      field: 'comision_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Mínimo',
      field: 'comision_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Último',
      field: 'comision_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Activador P. Especial',
      field: 'activador_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Activador P. Mínimo',
      field: 'activador_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Activador P. Último',
      field: 'activador_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
  ]

  return columns
}
