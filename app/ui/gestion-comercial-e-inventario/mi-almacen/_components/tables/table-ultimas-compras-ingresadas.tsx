import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsUltimasComprasIngresadas } from './columns-ultimas-compras-ingresadas'

const items = [
  {
    documento: 'Factura',
    serie: '001',
    numero: '001',
    fecha: '2022-01-01',
    razon_social: 'Empresa 1 ada sdasd asd asad asda da',
    registrado_por: 'Usuario 1 asdasd asdas dasd asd as',
    cantidad: 10,
    unidad_de_medida: 'Kg asd asd asd asd asd',
    precio: 100,
    subtotal: 1000,
  },
  {
    documento: 'Factura',
    serie: '002',
    numero: '002',
    fecha: '2022-01-02',
    razon_social: 'Empresa 2',
    registrado_por: 'Usuario 2',
    cantidad: 20,
    unidad_de_medida: 'Kg',
    precio: 150,
    subtotal: 3000,
  },
  {
    documento: 'Factura',
    serie: '003',
    numero: '003',
    fecha: '2022-01-03',
    razon_social: 'Empresa 3',
    registrado_por: 'Usuario 3',
    cantidad: 30,
    unidad_de_medida: 'Kg',
    precio: 200,
    subtotal: 6000,
  },
  {
    documento: 'Factura',
    serie: '004',
    numero: '004',
    fecha: '2022-01-04',
    razon_social: 'Empresa 4',
    registrado_por: 'Usuario 4',
    cantidad: 40,
    unidad_de_medida: 'Kg',
    precio: 250,
    subtotal: 10000,
  },
  {
    documento: 'Factura',
    serie: '005',
    numero: '005',
    fecha: '2022-01-05',
    razon_social: 'Empresa 5',
    registrado_por: 'Usuario 5',
    cantidad: 50,
    unidad_de_medida: 'Kg',
    precio: 300,
    subtotal: 15000,
  },
]

export default function TableUltimasComprasIngresadas() {
  return (
    <TableWithTitle
      title='Últimas 6 compras ingresadas'
      columnDefs={useColumnsUltimasComprasIngresadas()}
      rowData={items}
    />
  )
}
