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
import { Tooltip } from 'antd'
import { GetStock } from '~/app/_utils/get-stock'

export type DetalleDePreciosProps = ProductoAlmacenUnidadDerivada & {
  almacen: Pick<Almacen, 'id' | 'name'>
  producto: Producto
  unidad_derivada: UnidadDerivada
  producto_almacen: {
    costo: Decimal
    stock_fraccion: Decimal
    ubicacion: Ubicacion
    costo_anterior?: Decimal | null
    stock_costo_anterior?: Decimal
    costo_actual?: Decimal | null
    stock_costo_actual?: Decimal
  }
  compras?: Array<{
    costo: Decimal
    compra: any
    unidades_derivadas: any[]
  }>
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
      colId: 'costo_anterior',
      headerName: 'Costo Anterior',
      field: 'producto_almacen.costo_anterior',
      minWidth: 160,
      cellRenderer: ({ data }: any) => {
        const costoAnterior = data?.producto_almacen?.costo_anterior
        const stockAnterior = data?.producto_almacen?.stock_costo_anterior ?? 0
        const unidadesContenidas = Number(data?.producto?.unidades_contenidas ?? 1)
        
        if (!costoAnterior) {
          return <span className='text-gray-400'>-</span>
        }

        return (
          <div title={`Costo: S/. ${Number(costoAnterior).toFixed(4)} | Stock: ${stockAnterior}`}>
            <span className='text-sm'>
              S/. {Number(costoAnterior).toFixed(4)} (
              <GetStock
                stock_fraccion={Number(stockAnterior)}
                unidades_contenidas={unidadesContenidas}
              />
              )
            </span>
          </div>
        )
      },
      width: 180,
    },
    {
      colId: 'costo_actual',
      headerName: 'Costo Actual',
      field: 'producto_almacen.costo_actual',
      minWidth: 160,
      cellRenderer: ({ data }: any) => {
        const costoActual = data?.producto_almacen?.costo_actual
        const stockActual = data?.producto_almacen?.stock_costo_actual ?? 0
        const unidadesContenidas = Number(data?.producto?.unidades_contenidas ?? 1)
        
        if (!costoActual) {
          return <span className='text-gray-400'>-</span>
        }

        return (
          <div title={`Costo: S/. ${Number(costoActual).toFixed(4)} | Stock: ${stockActual}`}>
            <span className='text-sm'>
              S/. {Number(costoActual).toFixed(4)} (
              <GetStock
                stock_fraccion={Number(stockActual)}
                unidades_contenidas={unidadesContenidas}
              />
              )
            </span>
          </div>
        )
      },
      width: 180,
    },
    {
      colId: 'costo_referencial',
      headerName: 'Costo Referencial',
      minWidth: 160,
      cellRenderer: ({ data }: any) => {
        // Validar que tenemos datos válidos
        if (!data) {
          return <span className='text-gray-400'>-</span>
        }

        const compras = data?.compras ?? []
        const factor = Number(data?.factor ?? 1)
        
        if (compras.length === 0) {
          return <span className='text-gray-400'>-</span>
        }

        // Ordenar compras por fecha descendente (más reciente primero)
        const comprasOrdenadas = [...compras].sort((a, b) => {
          const fechaA = new Date(a.compra?.fecha || 0).getTime()
          const fechaB = new Date(b.compra?.fecha || 0).getTime()
          return fechaB - fechaA // Descendente: más reciente primero
        })

        // Obtener el costo referencial: segunda compra si hay 2+, primera si hay 1
        let costoReferencial = null
        if (comprasOrdenadas.length >= 2) {
          costoReferencial = comprasOrdenadas[1]?.costo
        } else if (comprasOrdenadas.length === 1) {
          costoReferencial = comprasOrdenadas[0]?.costo
        }
        
        if (!costoReferencial) {
          return <span className='text-gray-400'>-</span>
        }

        // Asegurar que el costo es un número válido
        const costoNumerico = Number(costoReferencial)
        if (isNaN(costoNumerico) || isNaN(factor)) {
          return <span className='text-gray-400'>-</span>
        }

        // Multiplicar por el factor de la unidad derivada (igual que en "Últimas compras ingresadas")
        const costoConFactor = costoNumerico * factor

        return (
          <Tooltip title={`Costo de la segunda compra más reciente. Se mantiene fijo hasta que su stock se agote (PEPS)`}>
            <div title={`Costo: S/. ${costoConFactor.toFixed(4)}`}>
              <span className='text-sm font-semibold text-blue-600'>
                S/. {costoConFactor.toFixed(4)}
              </span>
            </div>
          </Tooltip>
        )
      },
      width: 180,
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
