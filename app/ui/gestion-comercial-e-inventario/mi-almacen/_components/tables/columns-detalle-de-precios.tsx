'use client'

import {
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
} from '@prisma/client'
import { ColDef } from 'ag-grid-community'

export type DetalleDePreciosProps = ProductoAlmacenUnidadDerivada & {
  unidad_derivada: UnidadDerivada
  costo: ProductoAlmacen['costo']
}

export function useColumnsDetalleDePrecios() {
  const columns: ColDef<DetalleDePreciosProps>[] = [
    {
      headerName: 'Formato',
      field: 'unidad_derivada.name',
      minWidth: 80,
      filter: true,
      flex: 2,
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
      field: 'costo',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
    {
      headerName: 'P. Público',
      field: 'precio_publico',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
  ]

  return columns
}
