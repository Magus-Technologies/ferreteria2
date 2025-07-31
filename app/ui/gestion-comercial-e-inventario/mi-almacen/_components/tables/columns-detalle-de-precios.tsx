'use client'

import {
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  ProductoAlmacenUnidadDerivadaPrecio,
  UnidadDerivada,
} from '@prisma/client'
import { ColDef } from 'ag-grid-community'

export type DetalleDePreciosProps = ProductoAlmacenUnidadDerivada & {
  unidad_derivada: UnidadDerivada
  precios: ProductoAlmacenUnidadDerivadaPrecio[]
  costo: ProductoAlmacen['costo']
}

interface UseColumnsDetalleDePreciosProps {
  data: DetalleDePreciosProps[]
}

export function useColumnsDetalleDePrecios({
  data,
}: UseColumnsDetalleDePreciosProps) {
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
      field: 'precio_principal',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
  ]

  const precioNames = new Set<string>()
  data.forEach(item => {
    item.precios.forEach(p => {
      precioNames.add(p.name)
    })
  })

  const dynamicColumns: ColDef<DetalleDePreciosProps>[] = Array.from(
    precioNames
  ).map(name => ({
    headerName: name,
    minWidth: 80,
    flex: 1,
    filter: 'agNumberColumnFilter',
    type: 'pen',
    valueGetter: params => {
      const precio = params.data?.precios.find(p => p.name === name)
      return precio?.precio ?? null
    },
  }))

  return [...columns, ...dynamicColumns]
}
