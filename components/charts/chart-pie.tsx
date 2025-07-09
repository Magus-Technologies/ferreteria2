'use client'

import { Legend, Pie, PieChart, Sector } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'
import { PieSectorDataItem } from 'recharts/types/polar/Pie'

type ChartData = { label: string; value: number; fill: string }

interface ChartPieProps {
  data: ChartData[]
}

export default function ChartPie({ data }: ChartPieProps) {
  return (
    <ChartContainer config={{}} className='mx-auto max-h-[180px] w-full'>
      <PieChart>
        <Legend
          layout='vertical'
          verticalAlign='middle'
          align='left'
          iconType='circle'
          iconSize={10}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
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
