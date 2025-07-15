import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsDetalleDePrecios } from './columns-detalle-de-precios'

const items = [
  {
    formato: 'Formato 1',
    factor: 'Factor 1',
    precio_compra: 100,
    precio_publico: 200,
    precio_especial: 300,
    precio_minimo: 400,
    precio_ultimo: 500,
    ganancia: 600,
  },
  {
    formato: 'Formato 2',
    factor: 'Factor 2',
    precio_compra: 100,
    precio_publico: 200,
    precio_especial: 300,
    precio_minimo: 400,
    precio_ultimo: 500,
    ganancia: 600,
  },
  {
    formato: 'Formato 3',
    factor: 'Factor 3',
    precio_compra: 100,
    precio_publico: 200,
    precio_especial: 300,
    precio_minimo: 400,
    precio_ultimo: 500,
    ganancia: 600,
  },
]

export default function TableDetalleDePrecios() {
  return (
    <TableWithTitle
      title='Detalle de precios'
      columnDefs={useColumnsDetalleDePrecios()}
      rowData={items}
    />
  )
}
