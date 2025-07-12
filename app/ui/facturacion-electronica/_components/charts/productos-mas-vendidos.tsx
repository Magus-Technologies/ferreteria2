import ChartBar from '~/components/charts/chart-bar'
import { orangeColors } from '~/lib/colors'

const colors = orangeColors

const chartData = [
  { xAxis: 'January', Mobile: 80 },
  { xAxis: 'February', Mobile: 200 },
  { xAxis: 'March', Mobile: 120 },
  { xAxis: 'April', Mobile: 190 },
  { xAxis: 'May', Mobile: 130 },
  { xAxis: 'June', Mobile: 140 },
  { xAxis: 'July', Mobile: 150 },
  { xAxis: 'August', Mobile: 110 },
  { xAxis: 'September', Mobile: 180 },
  { xAxis: 'October', Mobile: 160 },
  { xAxis: 'November', Mobile: 130 },
]

export default function ProductosMasVendidos() {
  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ Mobile: colors[1] }}
    />
  )
}
