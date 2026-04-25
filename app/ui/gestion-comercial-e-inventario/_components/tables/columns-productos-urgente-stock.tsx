import { ColDef } from 'ag-grid-community'

interface ProductosUrgenteStockProps {
  name: string
  cantidad: string
  stock_min: number
  almacen: string
  vencimiento: string
}

export function useColumnsProductosUrgenteStock() {
  const columns: ColDef<ProductosUrgenteStockProps>[] = [
    {
      colId: 'producto',
      headerName: 'Producto',
      field: 'name',
      minWidth: 150,
      filter: true,
      flex: 2,
    },
    {
      colId: 'cantidad',
      headerName: 'Cantidad',
      field: 'cantidad',
      minWidth: 80,
      filter: true,
      width: 130,
    },
    {
      colId: 'stock_min',
      headerName: 'Stock Mínimo',
      field: 'stock_min',
      minWidth: 80,
      filter: 'agNumberColumnFilter',
      width: 130,
    },
    {
      colId: 'almacen',
      headerName: 'Almacén',
      field: 'almacen',
      minWidth: 80,
      filter: true,
      width: 130,
    },
    {
      colId: 'vencimiento',
      headerName: 'Vencimiento',
      field: 'vencimiento',
      minWidth: 80,
      filter: 'agDateColumnFilter',
      width: 130,
    },
  ]

  return columns
}
