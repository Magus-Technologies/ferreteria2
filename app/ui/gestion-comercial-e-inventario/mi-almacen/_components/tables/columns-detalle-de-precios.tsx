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
  almacen: Pick<Almacen, 'id' | 'name'>
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
        const costo = Number(value)
        const factor = Number(data!.factor)
        if (isNaN(costo) || isNaN(factor)) return '0.0000'
        return `${(costo * factor).toFixed(4)}`
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
        const costo = Number(value)
        const factor = Number(data!.factor)
        const precioPublico = Number(data!.precio_publico)
        
        if (isNaN(costo) || isNaN(factor) || isNaN(precioPublico)) return '0.00'
        
        const costoTotal = costo * factor
        const ganancia = precioPublico - costoTotal
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
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Ganancia',
      field: 'producto_almacen.costo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value, data }) => {
        const costo = Number(value)
        const factor = Number(data!.factor)
        const precioPublico = Number(data!.precio_publico)
        
        if (isNaN(costo) || isNaN(factor) || isNaN(precioPublico)) return '0.00'
        
        const costoTotal = costo * factor
        const ganancia = precioPublico - costoTotal
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
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'P. Mínimo',
      field: 'precio_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'P. Último',
      field: 'precio_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Público',
      field: 'comision_publico',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Especial',
      field: 'comision_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Mínimo',
      field: 'comision_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Comisión P. Último',
      field: 'comision_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Activador P. Especial',
      field: 'activador_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const activador = Number(value)
        return isNaN(activador) ? '0.00' : activador.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Activador P. Mínimo',
      field: 'activador_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const activador = Number(value)
        return isNaN(activador) ? '0.00' : activador.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'Activador P. Último',
      field: 'activador_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const activador = Number(value)
        return isNaN(activador) ? '0.00' : activador.toFixed(2)
      },
      flex: 1,
      type: 'pen',
    },
  ]

  return columns
}
