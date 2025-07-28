'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import {
  DetalleDePreciosProps,
  useColumnsDetalleDePrecios,
} from './columns-detalle-de-precios'

interface TableDetalleDePreciosProps
  extends Omit<
    TableWithTitleProps<DetalleDePreciosProps>,
    'rowData' | 'columnDefs' | 'id' | 'title'
  > {
  data: DetalleDePreciosProps[]
}

export default function TableDetalleDePrecios({
  data,
  ...rest
}: TableDetalleDePreciosProps) {
  return (
    <TableWithTitle
      {...rest}
      id='g-c-e-i.mi-almacen.detalle-de-precios'
      title='Detalle de precios'
      columnDefs={useColumnsDetalleDePrecios({ data })}
      rowData={data}
    />
  )
}
