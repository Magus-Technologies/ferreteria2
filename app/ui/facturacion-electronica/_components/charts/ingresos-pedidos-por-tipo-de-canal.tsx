'use client'

import { useState } from 'react'
import { Segmented } from 'antd'
import { useQuery } from '@tanstack/react-query'
import ChartBar from '~/components/charts/chart-bar'
import { orangeColors } from '~/lib/colors'
import { dashboardFacturacionApi, dashboardFacturacionKeys } from '~/lib/api/dashboard-facturacion'
import { useFiltrosDashboard } from '../../_store/store-dashboard-filtros'

const colors = orangeColors

type Vista = 'canal' | 'despacho'

export default function IngresosPedidosPorTipoDeCanal() {
  const filtros = useFiltrosDashboard()
  const [vista, setVista] = useState<Vista>('canal')

  const { data } = useQuery({
    queryKey:
      vista === 'canal'
        ? dashboardFacturacionKeys.ingresosPorCanal(filtros)
        : dashboardFacturacionKeys.ingresosPorDespacho(filtros),
    queryFn: async () => {
      const res =
        vista === 'canal'
          ? await dashboardFacturacionApi.ingresosPorCanal(filtros)
          : await dashboardFacturacionApi.ingresosPorDespacho(filtros)
      if (res.error) throw new Error(res.error.message)
      return res.data?.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  const chartData = (data ?? []).map((item) => ({
    xAxis: item.label,
    Ingresos: item.value,
  }))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center">
        <Segmented<Vista>
          size="small"
          value={vista}
          onChange={setVista}
          options={[
            { label: 'Canal', value: 'canal' },
            { label: 'Despacho', value: 'despacho' },
          ]}
        />
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          {vista === 'canal' ? 'Sin ingresos en el periodo' : 'Sin despachos en el periodo'}
        </div>
      ) : (
        <ChartBar
          className="max-h-[24dvh]"
          data={chartData}
          fills={{ Ingresos: colors[3] }}
        />
      )}
    </div>
  )
}
