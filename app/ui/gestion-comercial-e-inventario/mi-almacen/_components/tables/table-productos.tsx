'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductos } from './columns-productos'
import { useServerQuery } from '~/hooks/use-server-query'
import { getProductos } from '~/app/_actions/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'

export default function TableProductos() {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const { response } = useServerQuery({
    action: getProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS],
    },
    params: undefined,
  })

  return (
    <TableWithTitle
      id='g-c-e-i.mi-almacen.productos'
      title='Productos'
      columnDefs={useColumnsProductos({ almacen_id })}
      rowData={response}
    />
  )
}
