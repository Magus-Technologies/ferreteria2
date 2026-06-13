'use client'

import { useQuery } from '@tanstack/react-query'
import ChartBar from '~/components/charts/chart-bar'
import { greenColors } from '~/lib/colors'
import { prestamoApi } from '~/lib/api/prestamo'
import { useFiltrosDashboardGCI } from '../../_store/store-dashboard-filtros'

const colors = greenColors

export default function PrestamosPrestes() {
  const filtros = useFiltrosDashboardGCI()

  const { data } = useQuery({
    queryKey: ['prestamos-resumen-dashboard', filtros],
    queryFn: async () => {
      const res = await prestamoApi.resumenDashboard(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!filtros.almacen_id,
  })

  const chartData = (data ?? []).map((item, i) => ({
    xAxis: item.label,
    Monto: item.value,
    // Cada barra con su tonalidad de verde.
    fill: colors[i === 0 ? 4 : 7],
  }))

  if (chartData.length === 0 || chartData.every((d) => d.Monto === 0)) {
    return (
      <div className='flex items-center justify-center h-full text-gray-400 text-sm'>
        Sin préstamos en el periodo
      </div>
    )
  }

  return (
    <ChartBar
      className='!h-full min-h-0'
      data={chartData}
      fills={{ Monto: colors[4] }}
    />
  )
}
