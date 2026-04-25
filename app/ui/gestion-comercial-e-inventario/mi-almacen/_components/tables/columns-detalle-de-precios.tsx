'use client'

import type {
  Almacen,
  Decimal,
  Producto,
  ProductoAlmacenUnidadDerivada,
  Ubicacion,
  UnidadDerivada,
} from '~/types'
import { ColDef } from 'ag-grid-community'
import { useMemo } from 'react'

export type DetalleDePreciosProps = ProductoAlmacenUnidadDerivada & {
  almacen: Pick<Almacen, 'id' | 'name'>
  producto: Producto
  unidad_derivada: UnidadDerivada
  producto_almacen: {
    costo: Decimal
    stock_fraccion: Decimal
    ubicacion: Ubicacion
  }
}

export function useColumnsDetalleDePrecios() {
  const columns: ColDef<DetalleDePreciosProps>[] = useMemo(() => [
    {
      colId: 'cod_producto',
      headerName: 'Cod. Producto',
      field: 'producto.cod_producto',
      width: 150,
      minWidth: 130,
      filter: true,
    },
    {
      colId: 'producto',
      headerName: 'Producto',
      field: 'producto.name',
      minWidth: 250,
      filter: true,
      flex: 3,
    },
    {
      colId: 'formato',
      headerName: 'Formato',
      field: 'unidad_derivada.name',
      width: 110,
      minWidth: 80,
      filter: true,
    },
    {
      colId: 'factor',
      headerName: 'Factor',
      field: 'factor',
      width: 100,
      minWidth: 80,
      filter: true,
    },
    {
      colId: 'p_compra',
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
      width: 130,
      type: 'pen4',
    },
    {
      colId: 'p_venta',
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
      width: 130,
      type: 'percent',
    },
    {
      colId: 'precio_publico',
      headerName: 'Precio Público',
      field: 'precio_publico',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'ganancia',
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
      width: 130,
      type: 'pen',
    },
    {
      colId: 'precio_especial',
      headerName: 'Precio Ferretería',
      field: 'precio_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'precio_minimo',
      headerName: 'Precio Mínimo',
      field: 'precio_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'precio_ultimo',
      headerName: 'Precio Final',
      field: 'precio_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const precio = Number(value)
        return isNaN(precio) ? '0.00' : precio.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'comision_publico',
      headerName: 'Comisión Público',
      field: 'comision_publico',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'comision_especial',
      headerName: 'Comisión Ferretería',
      field: 'comision_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'comision_minimo',
      headerName: 'Comisión Mínimo',
      field: 'comision_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'comision_ultimo',
      headerName: 'Comisión Final',
      field: 'comision_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const comision = Number(value)
        return isNaN(comision) ? '0.00' : comision.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'activador_especial',
      headerName: 'Activador Ferretería',
      field: 'activador_especial',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const activador = Number(value)
        return isNaN(activador) ? '0.00' : activador.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'activador_minimo',
      headerName: 'Activador Mínimo',
      field: 'activador_minimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const activador = Number(value)
        return isNaN(activador) ? '0.00' : activador.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
    {
      colId: 'activador_ultimo',
      headerName: 'Activador Final',
      field: 'activador_ultimo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ value }) => {
        const activador = Number(value)
        return isNaN(activador) ? '0.00' : activador.toFixed(2)
      },
      width: 130,
      type: 'pen',
    },
  ], [])

  return columns
}
