'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductos } from './columns-productos'

const items = [
  {
    id: '1',
    codigo: '1',
    producto: 'Producto 1',
    marca: 'Marca 1',
    stock: '10',
    stock_min: '5',
    unidades_contenidas: '1',
    activo: true,
  },
  {
    id: '2',
    codigo: '2',
    producto: 'Producto 2',
    marca: 'Marca 2',
    stock: '15',
    stock_min: '10',
    unidades_contenidas: '2',
    activo: false,
  },
  {
    id: '3',
    codigo: '3',
    producto: 'Producto 3',
    marca: 'Marca 3',
    stock: '20',
    stock_min: '15',
    unidades_contenidas: '3',
    activo: true,
  },
  {
    id: '4',
    codigo: '4',
    producto: 'Producto 4',
    marca: 'Marca 4',
    stock: '25',
    stock_min: '20',
    unidades_contenidas: '4',
    activo: false,
  },
  {
    id: '5',
    codigo: '5',
    producto: 'Producto 5',
    marca: 'Marca 5',
    stock: '30',
    stock_min: '25',
    unidades_contenidas: '5',
    activo: true,
  },
  {
    id: '6',
    codigo: '6',
    producto: 'Producto 6',
    marca: 'Marca 6',
    stock: '35',
    stock_min: '30',
    unidades_contenidas: '6',
    activo: true,
  },
  {
    id: '7',
    codigo: '7',
    producto: 'Producto 7',
    marca: 'Marca 7',
    stock: '40',
    stock_min: '35',
    unidades_contenidas: '7',
    activo: true,
  },
  {
    id: '8',
    codigo: '8',
    producto: 'Producto 8',
    marca: 'Marca 8',
    stock: '45',
    stock_min: '40',
    unidades_contenidas: '8',
    activo: true,
  },
  {
    id: '9',
    codigo: '9',
    producto: 'Producto 9',
    marca: 'Marca 9',
    stock: '50',
    stock_min: '45',
    unidades_contenidas: '9',
    activo: true,
  },
  {
    id: '10',
    codigo: '10',
    producto: 'Producto 10',
    marca: 'Marca 10',
    stock: '55',
    stock_min: '50',
    unidades_contenidas: '10',
    activo: true,
  },
]

export default function TableProductos() {
  return (
    <TableWithTitle
      id='g-c-e-i.mi-almacen.productos'
      title='Productos'
      columnDefs={useColumnsProductos()}
      rowData={items}
    />
  )
}
