'use client'

import { useMemo } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductosPorVencer } from '~/app/ui/gestion-comercial-e-inventario/_components/tables/columns-productos-por-vencer'
import { greenColors } from '~/lib/colors'
import { useQuery } from '@tanstack/react-query'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreAlmacen } from '~/store/store-almacen'
import { Spin } from 'antd'

interface TableProductosPorVencerProps {
  dias?: number
  busqueda?: string
}

export default function TableProductosPorVencer({ dias = -1, busqueda = '' }: TableProductosPorVencerProps) {
  const { almacen_id } = useStoreAlmacen()

  const { data, isLoading } = useQuery({
    queryKey: ['productos-vencidos', almacen_id, dias],
    queryFn: async () => {
      const response = await productosApiV2.getVencimientos(almacen_id!, dias)
      return response.data || []
    },
    enabled: !!almacen_id
  })

  // Filter data by search term on the frontend
  const filteredData = useMemo(() => {
    if (!data) return []
    if (!busqueda.trim()) return data

    const term = busqueda.toLowerCase().trim()
    return data.filter((item: any) =>
      item.name?.toLowerCase().includes(term) ||
      item.lote?.toLowerCase().includes(term) ||
      item.almacen?.toLowerCase().includes(term)
    )
  }, [data, busqueda])

  const getTitle = () => {
    if (dias === 0) return 'Productos Vencidos'
    if (dias === -1) return 'Todos los Vencimientos'
    return `Productos por vencer (${dias} días)`
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-10'>
        <Spin size="large" tip="Cargando productos por vencer..." />
      </div>
    )
  }

  return (
    <TableWithTitle
      id='g-c-e-i.dashboard.productos-por-vencer-v2'
      title={getTitle()}
      extraTitle={
        <span className='text-xs text-slate-400 font-normal'>
          ({filteredData.length} {filteredData.length === 1 ? 'registro' : 'registros'})
        </span>
      }
      selectionColor={greenColors[10]}
      columnDefs={useColumnsProductosPorVencer()}
      rowData={filteredData}
    />
  )
}
