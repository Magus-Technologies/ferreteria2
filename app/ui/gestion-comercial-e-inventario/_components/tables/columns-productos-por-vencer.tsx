import { ColDef } from 'ag-grid-community'
import { Tag } from 'antd'
import dayjs from 'dayjs'

interface ProductosPorVencerProps {
  name: string
  cantidad: string
  stock_min: string
  almacen: string
  vencimiento: string
  lote: string | null
  estado: string
  dias_restantes: number
}

export function useColumnsProductosPorVencer() {
  const columns: ColDef<ProductosPorVencerProps>[] = [
    {
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
      headerName: 'Producto',
      field: 'name',
      minWidth: 200,
      filter: true,
      flex: 2,
    },
    {
      headerName: 'Lote',
      field: 'lote',
      minWidth: 100,
      filter: true,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Situación',
      field: 'dias_restantes',
      minWidth: 120,
      cellRenderer: (params: any) => {
        const dias = params.value
        if (dias < 0) return <span className='text-rose-600 font-bold'>Venció hace {Math.abs(dias)} días</span>
        if (dias === 0) return <span className='text-orange-600 font-bold'>Vence hoy</span>
        return <span className='text-slate-600'>Vence en {dias} días</span>
      },
      sortable: true,
    },
    {
      headerName: 'Vencimiento',
      field: 'vencimiento',
      minWidth: 110,
      valueFormatter: (params) => params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'Cant. Stock',
      field: 'cantidad',
      minWidth: 90,
      filter: true,
      flex: 0.8,
    },
    {
      headerName: 'Stock Mín.',
      field: 'stock_min',
      minWidth: 90,
      filter: 'agNumberColumnFilter',
      flex: 0.8,
    },
    {
      headerName: 'Almacén',
      field: 'almacen',
      minWidth: 100,
      filter: true,
    },
  ]

  return columns
}
