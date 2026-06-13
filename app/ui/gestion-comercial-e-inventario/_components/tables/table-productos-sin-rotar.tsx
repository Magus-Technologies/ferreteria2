'use client'

import { useQuery } from '@tanstack/react-query'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductosSinRotar } from './columns-productos-sin-rotar'
import { greenColors } from '~/lib/colors'
import { inventarioReporteApi } from '~/lib/api/inventario-reporte'
import { useFiltrosDashboardGCI } from '../../_store/store-dashboard-filtros'

export default function TableProductosSinRotar() {
  const baseFiltros = useFiltrosDashboardGCI()
  const filtros = { ...baseFiltros, per_page: 200 }

  const { data } = useQuery({
    queryKey: ['productos-sin-rotar', filtros],
    queryFn: async () => {
      const res = await inventarioReporteApi.getProductosSinRotar(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!baseFiltros.almacen_id,
  })

  return (
    <TableWithTitle
      id='g-c-e-i.dashboard.productos-sin-rotar'
      title='Productos sin Rotar'
      selectionColor={greenColors[10]}
      columnDefs={useColumnsProductosSinRotar()}
      rowData={data ?? []}
    />
  )
}
