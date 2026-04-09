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
  const columns: ColDef<DetalleDePreciosProps>[] = [
    {
      colId: 'cod_producto',
      headerName: 'Cod. Producto',
      field: 'producto.cod_producto',
      minWidth: 130,
      filter: true,
      flex: 1,
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
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      colId: 'factor',
      headerName: 'Factor',
      field: 'factor',
      minWidth: 80,
      filter: true,
      flex: 1,
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
      flex: 1,
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
      flex: 1,
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
      flex: 1,
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
      flex: 1,
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
      flex: 1,
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
      flex: 1,
      type: 'pen',
    },
    {
      colId: 'precio_ultimo',
      headerName: 'Precio Último',
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
      colId: 'comision_publico',
      headerName: 'Comisión Precio Público',
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
      colId: 'comision_especial',
      headerName: 'Comisión Precio Ferretería',
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
      colId: 'comision_minimo',
      headerName: 'Comisión Precio Mínimo',
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
      colId: 'comision_ultimo',
      headerName: 'Comisión Precio Último',
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
      colId: 'activador_especial',
      headerName: 'Activador Precio Ferretería',
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
      colId: 'activador_minimo',
      headerName: 'Activador Precio Mínimo',
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
      colId: 'activador_ultimo',
      headerName: 'Activador Precio Último',
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
