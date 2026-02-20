'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductosPorVencer } from '~/app/ui/gestion-comercial-e-inventario/_components/tables/columns-productos-por-vencer'
import { greenColors } from '~/lib/colors'
import { useQuery } from '@tanstack/react-query'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreAlmacen } from '~/store/store-almacen'
import { Spin } from 'antd'

export default function TableProductosPorVencer({ dias = -1 }: { dias?: number }) {
  const { almacen_id } = useStoreAlmacen()

  const { data, isLoading } = useQuery({
    queryKey: ['productos-vencidos', almacen_id, dias],
    queryFn: async () => {
      const response = await productosApiV2.getVencimientos(almacen_id!, dias)
      return response.data || []
    },
    enabled: !!almacen_id
  })

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
      title={dias === 0 ? 'Productos Vencidos' : `Productos por vencer (${dias} días)`}
      selectionColor={greenColors[10]} // Color verde para gestión comercial e inventario
      columnDefs={useColumnsProductosPorVencer()}
      rowData={data || []}
    />
  )
}
