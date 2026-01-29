import { ColDef } from 'ag-grid-community'

interface ProductosPorVencerProps {
  name: string
  cantidad: string
  stock_min: number
  almacen: string
  vencimiento: string
}

export function useColumnsProductosPorVencer() {
  const columns: ColDef<ProductosPorVencerProps>[] = [
    {
      headerName: 'Producto',
      field: 'name',
      minWidth: 150,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Stock Mínimo',
      field: 'stock_min',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      flex: 1,
    },
    {
      headerName: 'Almacén',
      field: 'almacen',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Vencimiento',
      field: 'vencimiento',
      minWidth: 80,
      filter: 'agDateColumnFilter',
      flex: 1,
    },
  ]

  return columns
}
