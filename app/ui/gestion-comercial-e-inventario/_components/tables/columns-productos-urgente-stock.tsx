import { ColDef } from 'ag-grid-community'
import type { StockBajoItem } from '~/lib/api/inventario-reporte'

export function useColumnsProductosUrgenteStock() {
  const columns: ColDef<StockBajoItem>[] = [
    {
      colId: 'cod_producto',
      headerName: 'Código',
      field: 'cod_producto',
      width: 110,
      minWidth: 90,
      filter: true,
    },
    {
      colId: 'producto',
      headerName: 'Producto',
      field: 'producto',
      minWidth: 150,
      filter: true,
      flex: 2,
    },
    {
      colId: 'categoria',
      headerName: 'Categoría',
      field: 'categoria',
      minWidth: 120,
      filter: true,
      width: 140,
    },
    {
      colId: 'stock',
      headerName: 'Stock Actual',
      field: 'stock',
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      width: 120,
    },
    {
      colId: 'stock_min',
      headerName: 'Stock Mínimo',
      field: 'stock_min',
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      width: 120,
    },
  ]

  return columns
}
