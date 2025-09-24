'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import { useRef } from 'react'
import {
  TableDetalleDeCompraProps,
  useColumnsDetalleDeCompra,
} from './columns-detalle-de-compra'

export default function TableDetalleDeCompra() {
  const tableRef = useRef<AgGridReact>(null)

  const compraSeleccionada = useStoreCompraSeleccionada(store => store.compra)

  return (
    <TableWithTitle<TableDetalleDeCompraProps>
      tableRef={tableRef}
      id='g-c-e-i.mis-compras.detalle-de-compra'
      title='Detalle de Compra'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      columnDefs={useColumnsDetalleDeCompra()}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Cod. Producto',
            'Producto',
            'Marca',
            'Unidad de Medida',
            'Cantidad',
            'P. Compra',
            'Importe',
            'F. Vencimiento',
            'Lote',
          ],
        },
      ]}
      rowData={
        compraSeleccionada?.productos_por_almacen?.flatMap(ppa =>
          ppa.unidades_derivadas.map(ud => ({
            ...ud,
            producto_almacen: ppa.producto_almacen,
          }))
        ) ?? []
      }
    />
  )
}
