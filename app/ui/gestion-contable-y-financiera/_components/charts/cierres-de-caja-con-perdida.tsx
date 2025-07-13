import ChartBar from '~/components/charts/chart-bar'
import { redColors } from '~/lib/colors'

const colors = redColors

const chartData = [
  { xAxis: 'February', Mobile: 200 },
  { xAxis: 'January', Mobile: 80 },
]

export default function CierresDeCajaConPerdida() {
  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ Mobile: colors[3] }}
    />
  )
}
