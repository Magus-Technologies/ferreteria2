import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductosPorVencer } from './columns-productos-por-vencer'

const items = [
  {
    name: 'Item 1',
    cantidad: '10 unidades',
    stock_min: 5,
    almacen: 'Almacén 1',
    vencimiento: '2025-12-31',
  },
  {
    name: 'Item 2',
    cantidad: '5 kg',
    stock_min: 2,
    almacen: 'Almacén 2',
    vencimiento: '2025-11-15',
  },
  {
    name: 'Item 3',
    cantidad: '2 litros',
    stock_min: 1,
    almacen: 'Almacén 3',
    vencimiento: '2025-10-01',
  },
  {
    name: 'Item 4',
    cantidad: '1 caja',
    stock_min: 3,
    almacen: 'Almacén 4',
    vencimiento: '2026-01-10',
  },
  {
    name: 'Item 5',
    cantidad: '500 g',
    stock_min: 1,
    almacen: 'Almacén 5',
    vencimiento: '2025-09-20',
  },
  {
    name: 'Item 6',
    cantidad: '3 paquetes',
    stock_min: 4,
    almacen: 'Almacén 6',
    vencimiento: '2025-08-05',
  },
  {
    name: 'Item 7',
    cantidad: '7 unidades',
    stock_min: 2,
    almacen: 'Almacén 7',
    vencimiento: '2026-02-14',
  },
  {
    name: 'Item 8',
    cantidad: '6 botellas',
    stock_min: 3,
    almacen: 'Almacén 8',
    vencimiento: '2025-07-30',
  },
  {
    name: 'Item 9',
    cantidad: '4 sobres',
    stock_min: 2,
    almacen: 'Almacén 9',
    vencimiento: '2025-10-25',
  },
  {
    name: 'Item 10',
    cantidad: '8 latas',
    stock_min: 5,
    almacen: 'Almacén 10',
    vencimiento: '2025-12-01',
  },
]

export default function TableProductosPorVencer() {
  return (
    <TableWithTitle
      id='g-c-e-i.dashboard.productos-por-vencer'
      title='Productos por vencer'
      columnDefs={useColumnsProductosPorVencer()}
      rowData={items}
    />
  )
}
