import { ColDef } from 'ag-grid-community'

interface ProductosProps {
  codigo: string
  producto: string
  marca: string
  stock: string
  stock_min: string
}

export function useColumnsProductos() {
  const columns: ColDef<ProductosProps>[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Producto',
      field: 'producto',
      minWidth: 80,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Marca',
      field: 'marca',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Stock',
      field: 'stock',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'S. Min',
      field: 'stock_min',
      minWidth: 80,
      filter: true,
      flex: 1,
    },
  ]

  return columns
}
