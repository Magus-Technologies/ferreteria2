'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import ChartPie from '~/components/charts/chart-pie'
import { redColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { comisionApi } from '~/lib/api/comision'

const colors = redColors

export default function ComisionPorVendedor() {
  const filtros = {
    desde: dayjs().startOf('month').format('YYYY-MM-DD'),
    hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  }

  const { data } = useQuery({
    queryKey: [QueryKeys.COMISIONES_POR_VENDEDOR, 'dashboard', filtros],
    queryFn: async () => {
      const res = await comisionApi.porVendedor(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const chartData = (data?.data ?? [])
    .filter(v => v.comision_generada > 0)
    .sort((a, b) => b.comision_generada - a.comision_generada)
    .slice(0, 10)
    .map((v, i) => ({
      label: v.vendedor ?? 'Sin nombre',
      value: v.comision_generada,
      fill: colors[i % colors.length],
    }))

  if (chartData.length === 0) {
    return (
      <div className='flex items-center justify-center h-full text-gray-500 text-sm'>
        Sin comisiones registradas este mes
      </div>
    )
  }

  return <ChartPie data={chartData} />
}
