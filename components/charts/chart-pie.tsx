'use client'

import { Legend, Pie, PieChart, Sector } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'
import { PieSectorDataItem } from 'recharts/types/polar/Pie'

type ChartData = { label: string; value: number; fill: string }

interface ChartPieProps {
  data: ChartData[]
  className?: string
}

export default function ChartPie({ data, className }: ChartPieProps) {
  return (
    <ChartContainer config={{}} className={`w-full ${className}`}>
      <PieChart>
        <Legend
          layout='vertical'
          verticalAlign='middle'
          align='left'
          iconType='circle'
          iconSize={10}
        />
        <ChartTooltip content={props => <ChartTooltipContent {...props} />} />
        <Pie
          labelLine={false}
          data={data}
          dataKey='value'
          nameKey='label'
          innerRadius={35}
          activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
            <Sector {...props} outerRadius={outerRadius + 10} />
          )}
        />
      </PieChart>
    </ChartContainer>
  )
}
