import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductos } from './columns-productos'

const items = [
  {
    codigo: '1',
    producto: 'Producto 1',
    marca: 'Marca 1',
    stock: '10',
    stock_min: '5',
  },
  {
    codigo: '2',
    producto: 'Producto 2',
    marca: 'Marca 2',
    stock: '15',
    stock_min: '10',
  },
  {
    codigo: '3',
    producto: 'Producto 3',
    marca: 'Marca 3',
    stock: '20',
    stock_min: '15',
  },
  {
    codigo: '4',
    producto: 'Producto 4',
    marca: 'Marca 4',
    stock: '25',
    stock_min: '20',
  },
  {
    codigo: '5',
    producto: 'Producto 5',
    marca: 'Marca 5',
    stock: '30',
    stock_min: '25',
  },
  {
    codigo: '6',
    producto: 'Producto 6',
    marca: 'Marca 6',
    stock: '35',
    stock_min: '30',
  },
  {
    codigo: '7',
    producto: 'Producto 7',
    marca: 'Marca 7',
    stock: '40',
    stock_min: '35',
  },
  {
    codigo: '8',
    producto: 'Producto 8',
    marca: 'Marca 8',
    stock: '45',
    stock_min: '40',
  },
  {
    codigo: '9',
    producto: 'Producto 9',
    marca: 'Marca 9',
    stock: '50',
    stock_min: '45',
  },
  {
    codigo: '10',
    producto: 'Producto 10',
    marca: 'Marca 10',
    stock: '55',
    stock_min: '50',
  },
]

export default function TableProductos() {
  return (
    <TableWithTitle
      title='Productos'
      columnDefs={useColumnsProductos()}
      rowData={items}
    />
  )
}
