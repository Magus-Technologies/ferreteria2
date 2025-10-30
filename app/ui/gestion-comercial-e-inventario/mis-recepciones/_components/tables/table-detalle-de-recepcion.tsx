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
import { getDetallesRecepcionAlmacen } from '../../_utils/get-detalles-recepcion-almacen'

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
      key={`estado-${recepcionSeleccionada?.estado ?? false}`}
      tableRef={tableRef}
      id='g-c-e-i.mis-recepciones.detalle-de-recepcion'
      title='Detalle de Recepción'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      columnDefs={useColumnsDetalleDeRecepcion({
        estado: recepcionSeleccionada?.estado ?? false,
      })}
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
            'Stock Anterior',
            'Stock Nuevo',
            'P. Compra',
            'Importe',
            'F. Vencimiento',
            'Lote',
          ],
        },
      ]}
      rowData={getDetallesRecepcionAlmacen({ data: recepcionSeleccionada })}
    />
  )
}
