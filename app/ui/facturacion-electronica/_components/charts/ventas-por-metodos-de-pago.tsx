'use client'

import { useQuery } from '@tanstack/react-query'
import ChartPie from '~/components/charts/chart-pie'
import { orangeColors } from '~/lib/colors'
import { dashboardFacturacionApi, dashboardFacturacionKeys } from '~/lib/api/dashboard-facturacion'
import { useFiltrosDashboard } from '../../_store/store-dashboard-filtros'

const colors = orangeColors

export default function VentasPorMetodosDePago() {
  const filtros = useFiltrosDashboard()

  const { data } = useQuery({
    queryKey: dashboardFacturacionKeys.ventasPorMetodoPago(filtros),
    queryFn: async () => {
      const res = await dashboardFacturacionApi.ventasPorMetodoPago(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  const chartData = (data ?? []).map((item, i) => ({
    label: item.label,
    value: item.value,
    fill: colors[i % colors.length],
  }))

  if (chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-40 text-gray-400 text-sm'>
        Sin pagos en el periodo
      </div>
    )
  }

  return <ChartPie data={chartData} />
}
