import ChartBar from '~/components/charts/chart-bar'
import { redColors } from '~/lib/colors'

const colors = redColors

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

export default function PorcentajeDeGanancias() {
  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ Mobile: colors[1] }}
    />
  )
}
