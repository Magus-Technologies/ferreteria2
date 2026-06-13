'use client'

import { useQuery } from '@tanstack/react-query'
import ChartBar from '~/components/charts/chart-bar'
import { redColors } from '~/lib/colors'
import { dashboardContableApi } from '~/lib/api/dashboard-contable'
import { useFiltrosDashboardGCF } from '../../_store/store-dashboard-filtros'

const colors = redColors

export default function CierresDeCajaConPerdida() {
  const filtros = useFiltrosDashboardGCF()

  const { data } = useQuery({
    queryKey: ['contable-cierres-con-perdida', filtros],
    queryFn: async () => {
      const res = await dashboardContableApi.cierresConPerdida(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!filtros.almacen_id,
  })

  const chartData = (data ?? []).map((item) => ({
    xAxis: item.label,
    'Pérdida': item.value,
  }))

  if (chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-40 text-gray-400 text-sm'>
        Sin cierres con pérdida en el periodo
      </div>
    )
  }

  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ 'Pérdida': colors[3] }}
    />
  )
}
