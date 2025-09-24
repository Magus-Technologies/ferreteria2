'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { useStoreCompraSeleccionada } from '../../_store/store-compra-seleccionada'
import { getCompras } from '~/app/_actions/compra'
import { useColumnsCompras } from './columns-compras'

export default function TableCompras() {
  const tableRef = useRef<AgGridReact>(null)

  const [primera_vez, setPrimeraVez] = useState(true)

  const setCompraSeleccionada = useStoreCompraSeleccionada(
    store => store.setCompra
  )

  const filtros = useStoreFiltrosMisCompras(state => state.filtros)

  const { response, refetch, loading } = useServerQuery({
    action: getCompras,
    propsQuery: {
      queryKey: [QueryKeys.COMPRAS],
    },
    params: {
      where: filtros,
    },
  })

  useEffect(() => {
    if (!loading && filtros) setPrimeraVez(false)
  }, [loading, filtros])

  useEffect(() => {
    if (!primera_vez) refetch()
  }, [filtros, refetch, primera_vez])

  type ResponseItem = NonNullable<typeof response>[number]

  return (
    <TableWithTitle<ResponseItem>
      id='g-c-e-i.mis-compras.compras'
      onSelectionChanged={({ selectedNodes }) =>
        setCompraSeleccionada(selectedNodes?.[0]?.data as ResponseItem)
      }
      tableRef={tableRef}
      title='Compras'
      schema={CompraCreateInputSchema}
      loading={loading}
      columnDefs={useColumnsCompras()}
      rowData={response}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Documento',
            'Serie',
            'Número',
            'Fecha',
            'RUC',
            'Proveedor',
            'Subtotal',
            'IGV',
            'Total',
            'Forma de Pago',
            'Total Pagado',
            'Resta',
            'Estado de Cuenta',
            'Registrador',
            'Acciones',
          ],
        },
      ]}
    />
  )
}
