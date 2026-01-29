'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
          <Bar key={key} dataKey={key} radius={4} fill={fills?.[key]} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
