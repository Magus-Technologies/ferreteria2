'use client'

import { useQuery } from '@tanstack/react-query'
import ChartPie from '~/components/charts/chart-pie'
import { greenColors } from '~/lib/colors'
import { inventarioReporteApi } from '~/lib/api/inventario-reporte'
import { useFiltrosDashboardGCI } from '../../_store/store-dashboard-filtros'

const colors = greenColors

export default function DemandaPorCategoriaDeProductos() {
  const filtros = useFiltrosDashboardGCI()

  const { data } = useQuery({
    queryKey: ['demanda-por-categoria', filtros],
    queryFn: async () => {
      const res = await inventarioReporteApi.getDemandaPorCategoria(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!filtros.almacen_id,
  })

  const chartData = (data ?? []).map((item, i) => ({
    label: item.label,
    value: item.value,
    fill: colors[i % colors.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-full text-gray-400 text-sm'>
        Sin demanda en el periodo
      </div>
    )
  }

  return <ChartPie data={chartData} className='!h-full min-h-0' />
}
