'use client'

import { useQuery } from '@tanstack/react-query'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductosUrgenteStock } from './columns-productos-urgente-stock'
import { greenColors } from '~/lib/colors'
import { inventarioReporteApi } from '~/lib/api/inventario-reporte'
import { useStoreAlmacen } from '~/store/store-almacen'

export default function TableProductosUrgenteStock() {
  const { almacen_id } = useStoreAlmacen()

  const { data } = useQuery({
    queryKey: ['productos-stock-bajo', almacen_id],
    queryFn: async () => {
      const res = await inventarioReporteApi.getStockBajo({ almacen_id, per_page: 100 })
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!almacen_id,
  })

  return (
    <TableWithTitle
      id='g-c-e-i.dashboard.productos-urgente-stock'
      title='Productos Urgente por Stockear'
      selectionColor={greenColors[10]}
      columnDefs={useColumnsProductosUrgenteStock()}
      rowData={data ?? []}
    />
  )
}
