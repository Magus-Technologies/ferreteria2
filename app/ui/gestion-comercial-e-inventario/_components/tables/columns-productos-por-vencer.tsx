import { ColDef } from 'ag-grid-community'
import { Tag } from 'antd'
import dayjs from 'dayjs'

interface ProductosPorVencerProps {
  name: string
  cod_producto: string
  cantidad: number
  stock_min: string
  almacen: string
  vencimiento: string
  lote: string | null
  unidad?: string | null
  estado: string
  dias_restantes: number
}

/**
 * Columnas para la tabla de DETALLE POR LOTE.
 * NOTA: No incluye la columna "Producto" ya que el detalle muestra
 * los lotes del producto seleccionado en el Resumen.
 */
export function useColumnsProductosPorVencer() {
  const columns: ColDef<ProductosPorVencerProps>[] = [
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      minWidth: 100,
      width: 120,
      cellRenderer: (params: any) => {
        const isVencido = params.value === 'Vencido'
        return (
          <Tag color={isVencido ? 'error' : 'warning'} className='font-bold uppercase !rounded-full'>
            {params.value}
          </Tag>
        )
      },
      sortable: true,
      filter: true,
    },
    {
      colId: 'cod_producto',
      headerName: 'Código',
      field: 'cod_producto',
      minWidth: 90,
      width: 100,
      filter: true,
    },
    {
      colId: 'lote',
      headerName: 'Lote',
      field: 'lote',
      minWidth: 100,
      filter: true,
      valueFormatter: (params) => params.value || '-',
    },
    {
      colId: 'unidad',
      headerName: 'Unidad',
      field: 'unidad',
      minWidth: 100,
      filter: true,
      valueFormatter: (params) => params.value || '-',
    },
    {
      colId: 'situacion',
      headerName: 'Situación',
      field: 'dias_restantes',
      minWidth: 130,
      cellRenderer: (params: any) => {
        const dias = params.value
        if (dias < 0) return <span className='text-rose-600 font-bold'>Venció hace {Math.abs(dias)} días</span>
        if (dias === 0) return <span className='text-orange-600 font-bold'>Vence hoy</span>
        return <span className='text-slate-600'>Vence en {dias} días</span>
      },
      sortable: true,
    },
    {
      colId: 'vencimiento',
      headerName: 'Vencimiento',
      field: 'vencimiento',
      minWidth: 110,
      valueFormatter: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
      filter: 'agDateColumnFilter',
    },
    {
      colId: 'cantidad',
      headerName: 'Cant. lote',
      field: 'cantidad',
      width: 120,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'stock_min',
      headerName: 'Stock Mín.',
      field: 'stock_min',
      width: 100,
      minWidth: 90,
      filter: 'agNumberColumnFilter',
    },
    {
      colId: 'almacen',
      headerName: 'Almacén',
      field: 'almacen',
      minWidth: 120,
      filter: true,
    },
  ]

  return columns
}
