import { ColDef } from 'ag-grid-community'

interface DetalleDePreciosProps {
  formato: string
  factor: string
  precio_compra: number
  precio_publico: number
  precio_especial: number
  precio_minimo: number
  precio_ultimo: number
  ganancia: number
}

export function useColumnsDetalleDePrecios() {
  const columns: ColDef<DetalleDePreciosProps>[] = [
    {
      headerName: 'Formato',
      field: 'formato',
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
      field: 'precio_compra',
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
      headerName: 'Ganancia',
      field: 'ganancia',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
      type: 'pen',
    },
  ]

  return columns
}
