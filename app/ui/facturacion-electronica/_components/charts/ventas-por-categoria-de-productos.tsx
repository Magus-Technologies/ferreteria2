import ChartPie from '~/components/charts/chart-pie'
import { orangeColors } from '~/lib/colors'

const colors = orangeColors

const data = [
  {
    label: 'Chrome',
    value: 90123,
    fill: colors[0],
  },
  {
    label: 'Safari',
    value: 90123,
    fill: colors[1],
  },
  {
    label: 'Firefox',
    value: 90123,
    fill: colors[2],
  },
  {
    label: 'Edge',
    value: 90123,
    fill: colors[3],
  },
  {
    label: 'Other',
    value: 90123,
    fill: colors[4],
  },
  {
    label: 'X',
    value: 90123,
    fill: colors[5],
  },
  {
    label: 'Y',
    value: 90123,
    fill: colors[6],
  },
  {
    label: 'Z',
    value: 90123,
    fill: colors[7],
  },
  {
    label: 'W',
    value: 90123,
    fill: colors[8],
  },
  {
    label: 'V',
    value: 90123,
    fill: colors[9],
  },
]

export default function VentasPorCategoriaDeProductos() {
  return <ChartPie data={data} />
}
