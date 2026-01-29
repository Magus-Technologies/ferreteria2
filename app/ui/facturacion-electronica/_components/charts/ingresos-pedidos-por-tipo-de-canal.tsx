import ChartBar from '~/components/charts/chart-bar'
import { orangeColors } from '~/lib/colors'

const colors = orangeColors

const chartData = [
  { xAxis: 'February', Mobile: 200 },
  { xAxis: 'January', Mobile: 80 },
]

export default function IngresosPedidosPorTipoDeCanal() {
  return (
    <ChartBar
      className='max-h-[24dvh]'
      data={chartData}
      fills={{ Mobile: colors[3] }}
    />
  )
}
