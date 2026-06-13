'use client'

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

interface ChartDataBar {
  xAxis: string
  [key: string]: string | number
}

interface ChartBarProps {
  className?: string
  data: ChartDataBar[]
  fills?: Record<string, string>
}

export default function ChartBar({ className, data, fills }: ChartBarProps) {
  const numericKeys = Object.keys(data[0] ?? {}).filter(
    key =>
      key !== 'xAxis' &&
      typeof data[0][key] === 'number' &&
      !key.endsWith('Fill')
  )

  // Soporte de color por-barra: si las filas traen un campo `fill`, cada barra
  // usa su propio color (ej. tonalidades distintas). Si no, se usa el color de
  // la serie (comportamiento original para el resto de gráficos).
  const tieneFillPorBarra = data.some(d => typeof d.fill === 'string')

  return (
    <ChartContainer config={{}} className={`w-full ${className}`}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='xAxis'
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={value => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={props => <ChartTooltipContent {...props} />}
        />
        {numericKeys.map(key => (
          <Bar key={key} dataKey={key} radius={4} fill={fills?.[key]}>
            {tieneFillPorBarra
              ? data.map((row, i) => (
                  <Cell key={i} fill={(row.fill as string) ?? fills?.[key]} />
                ))
              : null}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  )
}
