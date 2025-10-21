'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useServerQuery } from '~/hooks/use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { CompraCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreRecepcionAlmacenSeleccionada } from '../../_store/store-recepcion-almacen-seleccionado'
import { useStoreFiltrosMisRecepciones } from '../../_store/store-filtros-mis-recepciones'
import {
  getRecepcionesAlmacen,
  getRecepcionesAlmacenResponseProps,
} from '~/app/_actions/recepcion-almacen'
import { useColumnsRecepcionesAlmacen } from './columns-recepciones-almacen'

export default function TableRecepcionesAlmacen() {
  const tableRef = useRef<AgGridReact>(null)

  const [primera_vez, setPrimeraVez] = useState(true)

  const setRecepcionAlmacenSeleccionada = useStoreRecepcionAlmacenSeleccionada(
    store => store.setRecepcionAlmacen
  )

  const filtros = useStoreFiltrosMisRecepciones(state => state.filtros)

  const { response, refetch, loading } = useServerQuery({
    action: getRecepcionesAlmacen,
    propsQuery: {
      queryKey: [QueryKeys.RECEPCIONES_ALMACEN],
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

  return (
    <>
      <TableWithTitle<getRecepcionesAlmacenResponseProps>
        id='g-c-e-i.mis-recepciones.recepciones-almacen'
        onSelectionChanged={({ selectedNodes }) =>
          setRecepcionAlmacenSeleccionada(
            selectedNodes?.[0]?.data as getRecepcionesAlmacenResponseProps
          )
        }
        tableRef={tableRef}
        title='Recepciones de Almacén'
        schema={CompraCreateInputSchema}
        loading={loading}
        columnDefs={useColumnsRecepcionesAlmacen()}
        rowData={response}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: ['#', 'N° Documento', 'Fecha', 'Registrador', 'Acciones'],
          },
        ]}
      />
    </>
  )
}
