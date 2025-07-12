import ChartPie from '~/components/charts/chart-pie'
import { orangeColors } from '~/lib/colors'

const colors = orangeColors

const data = [
  {
    label: 'Notas',
    value: 90123,
    fill: colors[0],
  },
  {
    label: 'Facturas',
    value: 90123,
    fill: colors[1],
  },
  {
    label: 'Boletas',
    value: 90123,
    fill: colors[2],
  },
]

export default function VentasPorTiposDeDocumento() {
  return <ChartPie data={data} className='max-h-[24dvh]' />
}
