'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { AgGridReact } from 'ag-grid-react'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useEffect, useRef } from 'react'
import { useStoreRecepcionAlmacenSeleccionada } from '../../_store/store-recepcion-almacen-seleccionado'
import {
  TableDetalleDeRecepcionProps,
  useColumnsDetalleDeRecepcion,
} from './columns-detalle-de-recepcion'

export default function TableDetalleDeRecepcion() {
  const tableRef = useRef<AgGridReact>(null)

  const recepcionSeleccionada = useStoreRecepcionAlmacenSeleccionada(
    store => store.recepcionAlmacen
  )
  const setRecepcionSeleccionada = useStoreRecepcionAlmacenSeleccionada(
    store => store.setRecepcionAlmacen
  )

  useEffect(() => {
    setRecepcionSeleccionada(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TableWithTitle<TableDetalleDeRecepcionProps>
      tableRef={tableRef}
      id='g-c-e-i.mis-recepciones.detalle-de-recepcion'
      title='Detalle de Recepción'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      columnDefs={useColumnsDetalleDeRecepcion()}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Cod. Producto',
            'Producto',
            'Marca',
            'Unidad Derivada',
            'Cantidad',
            'P. Compra',
            'Importe',
            'F. Vencimiento',
            'Lote',
          ],
        },
      ]}
      rowData={
        recepcionSeleccionada?.productos_por_almacen?.flatMap(ppa =>
          ppa.unidades_derivadas.map(ud => ({
            ...ud,
            costo: ppa.costo,
            producto_almacen: ppa.producto_almacen,
          }))
        ) ?? []
      }
    />
  )
}
