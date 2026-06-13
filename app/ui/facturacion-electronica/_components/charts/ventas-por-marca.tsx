'use client'

import { useQuery } from '@tanstack/react-query'
import ChartBar from '~/components/charts/chart-bar'
import { orangeColors } from '~/lib/colors'
import { dashboardFacturacionApi, dashboardFacturacionKeys } from '~/lib/api/dashboard-facturacion'
import { useFiltrosDashboard } from '../../_store/store-dashboard-filtros'

const colors = orangeColors

export default function VentasPorMarca() {
  const filtros = useFiltrosDashboard()

  const { data } = useQuery({
    queryKey: dashboardFacturacionKeys.ventasPorMarca(filtros),
    queryFn: async () => {
      const res = await dashboardFacturacionApi.ventasPorMarca(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  const chartData = (data ?? []).map((item) => ({
    xAxis: item.label,
    Ventas: item.value,
  }))

  if (chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-40 text-gray-400 text-sm'>
        Sin ventas en el periodo
      </div>
    )
  }

  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ Ventas: colors[1] }}
    />
  )
}
