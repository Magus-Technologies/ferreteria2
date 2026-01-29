import ChartBar from '~/components/charts/chart-bar'
import { greenColors } from '~/lib/colors'

const colors = greenColors

const chartData = [
  { xAxis: 'January', Desktop: 186, Mobile: 80 },
  { xAxis: 'February', Desktop: 305, Mobile: 200 },
  { xAxis: 'March', Desktop: 237, Mobile: 120 },
  { xAxis: 'April', Desktop: 73, Mobile: 190 },
  { xAxis: 'May', Desktop: 209, Mobile: 130 },
  { xAxis: 'June', Desktop: 214, Mobile: 140 },
]

export default function PrestamosPrestes() {
  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ Desktop: colors[0], Mobile: colors[5] }}
    />
  )
}
